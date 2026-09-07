const { sql, poolPromise } = require("../db");

// ======================================================
// GET PENDING PAYMENTS
// ======================================================

exports.getPendingPayments = async (req, res) => {
  const party = req.query.party || req.query.party_code;
  const search = req.query.search || "";

  try {
    const pool = await poolPromise;

    let prefix = "cus%";

    if (party === "sup") {
      prefix = "sup%";
    }

    const result = await pool
      .request()
      .input("prefix", sql.VarChar, prefix)
      .input("search", sql.VarChar, `%${search}%`)
      .query(`
        SELECT 
          ref_number,
          party_code,
          party_name,
          payable_amount,
          payment,
          balance_payment,
          real_time,
          status
        FROM pending_payment
        WHERE 
          party_code LIKE @prefix
          AND status = 'pending'
          AND (
            ref_number LIKE @search
            OR party_name LIKE @search
            OR party_code LIKE @search
          )
        ORDER BY payment_date DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ getPendingPayments error:", err);

    res.status(500).json({
      message: err.message
    });
  }
};


// ======================================================
// GET ALL PENDING ADVANCE PAYMENTS
// ======================================================

exports.getAdvancePayments = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .query(`
        SELECT 
          advance_pay_id,
          party_code,
          party_name,
          setoff_date,
          status,
          advance_payment_amount,
          advance_pay_date
        FROM Advance_Payment_Details
        WHERE status = 'pending'
        ORDER BY setoff_date DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ getAdvancePayments error:", err);

    res.status(500).json({
      message: err.message
    });
  }
};


// ======================================================
// GET ADVANCE PAYMENTS BY CUSTOMER / SUPPLIER
// ======================================================

exports.getAdvanceByParty = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      message: "Party code is required"
    });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT 
          advance_pay_id,
          party_code,
          party_name,
          advance_payment_amount,
          advance_pay_date,
          setoff_date,
          status
        FROM Advance_Payment_Details
        WHERE 
          party_code = @code
          AND status = 'pending'
          AND advance_payment_amount > 0
        ORDER BY advance_pay_date DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ getAdvanceByParty error:", err);

    res.status(500).json({
      message: err.message
    });
  }
};


// ======================================================
// SAVE PAYMENT SETOFF
// ======================================================

exports.savePaymentSetoff = async (req, res) => {

  console.log("🔥 SAVE PAYSETOFF BODY:", req.body);

  const {
    gridData,
    selectedAdvanceId,
    payment_date,
    user_login
  } = req.body;


  // ====================================================
  // VALIDATE GRID
  // ====================================================

  if (!Array.isArray(gridData) || gridData.length === 0) {
    return res.status(400).json({
      message: "No payment data provided"
    });
  }


  let transaction;


  try {

    const pool = await poolPromise;

    transaction = new sql.Transaction(pool);

    await transaction.begin();


    // ==================================================
    // GENERATE PAYMENT ID
    // ==================================================

    const now = new Date();

    const yy = String(now.getFullYear()).slice(2);

    const mm = String(now.getMonth() + 1).padStart(2, "0");


    const genReq = new sql.Request(transaction);

    const lastPay = await genReq.query(`
      SELECT TOP 1 payment_id
      FROM Payment_setoff
      WHERE payment_id LIKE 'PAY${yy}${mm}%'
      ORDER BY payment_id DESC
    `);


    let nextNo = 1;


    if (lastPay.recordset.length > 0) {

      const lastId = lastPay.recordset[0].payment_id;

      const lastNumber = parseInt(
        lastId.slice(-2),
        10
      );

      if (!isNaN(lastNumber)) {
        nextNo = lastNumber + 1;
      }
    }


    const payment_id =
      `PAY${yy}${mm}${String(nextNo).padStart(2, "0")}`;


    // ==================================================
    // PROCESS GRID DATA
    // ==================================================

    for (const row of gridData) {

      const paidAmount =
        Number(row.paidAmount || 0);

      const balanceAmount =
        Number(row.balanceAmount || 0);

      const totalCredit =
        Number(row.totalCredit || 0);

      const advancePayment =
        Number(row.advancePayment || 0);


      // =================================================
      // VALIDATE PAID AMOUNT
      // =================================================

      if (paidAmount <= 0) {

        throw new Error(
          "Paid amount must be greater than zero"
        );
      }


     // ==================================================
// UPDATE PENDING PAYMENT
// ==================================================
//
// IMPORTANT:
//
// 1. Normal invoice payment:
//    -> Update pending_payment
//
// 2. Invoice + Advance payment:
//    -> ALSO update pending_payment
//    -> AND update Advance_Payment_Details
//
// 3. Advance payment itself (ADP00025):
//    -> Do NOT update pending_payment
//
// ==================================================

const invoiceNumber = String(
  row.invoiceNumber || ""
).trim();


// --------------------------------------------------
// Check whether this is an Advance Payment ID
// --------------------------------------------------

const isAdvancePayment =
  invoiceNumber.toUpperCase().startsWith("ADP");


// --------------------------------------------------
// Update pending_payment only for real invoices
// --------------------------------------------------

if (
  invoiceNumber &&
  !isAdvancePayment
) {

  console.log(
    "🔍 Checking pending payment for:",
    invoiceNumber
  );


  // ------------------------------------------------
  // Get existing pending payment
  // ------------------------------------------------

  const findReq =
    new sql.Request(transaction);


  const pendingResult =
    await findReq

      .input(
        "ref_no",
        sql.VarChar,
        invoiceNumber
      )

      .query(`
        SELECT TOP 1
          ref_number,
          party_code,
          party_name,
          payable_amount,
          payment,
          balance_payment,
          status
        FROM pending_payment
        WHERE ref_number = @ref_no
      `);


  // ------------------------------------------------
  // Pending payment found
  // ------------------------------------------------

  if (
    pendingResult.recordset.length > 0
  ) {

    const pending =
      pendingResult.recordset[0];


    // ----------------------------------------------
    // Original invoice amount
    // ----------------------------------------------

    const payableAmount =
      Number(
        pending.payable_amount || 0
      );


    // ----------------------------------------------
    // Previous payments already saved
    // ----------------------------------------------

    const previousPayment =
      Number(
        pending.payment || 0
      );


    // ----------------------------------------------
    // New cash payment
    // ----------------------------------------------

    const newCashPayment =
      Number(
        row.paidAmount || 0
      );


    // ----------------------------------------------
    // Advance amount used for this invoice
    // ----------------------------------------------

    const advanceUsed =
      Number(
        row.advancePayment || 0
      );


    // ----------------------------------------------
    // Total payment
    // ----------------------------------------------

    const totalPayment =
      previousPayment +
      newCashPayment +
      advanceUsed;


    // ----------------------------------------------
    // Remaining balance
    // ----------------------------------------------

    const newBalance =
      Math.max(
        0,
        payableAmount - totalPayment
      );


    // ----------------------------------------------
    // Status
    // ----------------------------------------------

    const newStatus =
      newBalance <= 0
        ? "Settled"
        : "pending";


    // ----------------------------------------------
    // UPDATE pending_payment
    // ----------------------------------------------

    const updateReq =
      new sql.Request(transaction);


    await updateReq

      .input(
        "payment",
        sql.Decimal(18, 2),
        totalPayment
      )

      .input(
        "balance",
        sql.Decimal(18, 2),
        newBalance
      )

      .input(
        "status",
        sql.VarChar,
        newStatus
      )

      .input(
        "ref_no",
        sql.VarChar,
        invoiceNumber
      )

      .query(`
        UPDATE pending_payment

        SET
          payment = @payment,
          balance_payment = @balance,
          status = @status

        WHERE
          ref_number = @ref_no
      `);


    // ----------------------------------------------
    // LOG
    // ----------------------------------------------

    console.log(
      "======================================"
    );

    console.log(
      "✅ PENDING PAYMENT UPDATED"
    );

    console.log(
      "Invoice:",
      invoiceNumber
    );

    console.log(
      "Payable Amount:",
      payableAmount
    );

    console.log(
      "Previous Payment:",
      previousPayment
    );

    console.log(
      "New Cash Payment:",
      newCashPayment
    );

    console.log(
      "Advance Used:",
      advanceUsed
    );

    console.log(
      "Total Payment:",
      totalPayment
    );

    console.log(
      "New Balance:",
      newBalance
    );

    console.log(
      "Status:",
      newStatus
    );

    console.log(
      "======================================"
    );

  } else {

    // ----------------------------------------------
    // Invoice not found
    // ----------------------------------------------

    console.log(
      "⚠️ Pending payment not found for invoice:",
      invoiceNumber
    );

  }
}


      // =================================================
      // INSERT PAYMENT SETOFF
      // =================================================

      const insReq =
        new sql.Request(transaction);


      await insReq

        .input(
          "payment_id",
          sql.VarChar,
          payment_id
        )

        .input(
          "party_code",
          sql.VarChar,
          row.code
        )

        .input(
          "party_name",
          sql.VarChar,
          row.name
        )

        .input(
          "ref_no",
          sql.VarChar,
          row.invoiceNumber || null
        )

        .input(
          "invoice_amount",
          sql.Decimal(18, 2),
          totalCredit
        )

        .input(
          "total_amount",
          sql.Decimal(18, 2),
          totalCredit
        )

        .input(
          "paid_amount",
          sql.Decimal(18, 2),
          paidAmount
        )

        .input(
          "balance_amount",
          sql.Decimal(18, 2),
          balanceAmount
        )

        .input(
          "advance_payment",
          sql.Decimal(18, 2),
          advancePayment
        )

        .input(
          "user_login",
          sql.VarChar,
          user_login || null
        )

        .input(
          "real_date",
          sql.DateTime,
          payment_date
            ? new Date(payment_date)
            : new Date()
        )

        .query(`
          INSERT INTO Payment_setoff (
            payment_id,
            party_code,
            party_name,
            ref_no,
            invoice_amount,
            total_amount,
            paid_amount,
            balance_amount,
            user_login,
            real_date,
            advance_payment
          )
          VALUES (
            @payment_id,
            @party_code,
            @party_name,
            @ref_no,
            @invoice_amount,
            @total_amount,
            @paid_amount,
            @balance_amount,
            @user_login,
            @real_date,
            @advance_payment
          )
        `);


      // =================================================
      // ⭐ ADVANCE PAYMENT SELECTED
      // =================================================
      //
      // If an advance payment was selected,
      // that advance payment is fully consumed.
      //
      // Therefore:
      //
      // advance_payment_amount = 0
      // status = Settled
      //
      // =================================================

      if (row.advancePayId) {

        console.log(
          "💰 Selected Advance Payment:",
          row.advancePayId
        );


        const advReq =
          new sql.Request(transaction);


        await advReq

          .input(
            "advance_id",
            sql.VarChar,
            row.advancePayId
          )

          .input(
            "payment_date",
            sql.DateTime,
            payment_date
              ? new Date(payment_date)
              : new Date()
          )

          .query(`
            UPDATE Advance_Payment_Details
            SET 
              advance_payment_amount = 0,
              status = 'Settled',
              payment_date = @payment_date
            WHERE 
              advance_pay_id = @advance_id
              AND status = 'pending'
          `);


        console.log(
          "✅ Advance payment settled:",
          row.advancePayId
        );
      }


      // =================================================
      // ⭐ ALSO SUPPORT selectedAdvanceId
      // =================================================
      //
      // If frontend sends selectedAdvanceId separately,
      // update that record as well.
      //
      // =================================================

      if (
        selectedAdvanceId &&
        selectedAdvanceId === row.advancePayId
      ) {

        const selectedAdvReq =
          new sql.Request(transaction);


        await selectedAdvReq

          .input(
            "advance_id",
            sql.VarChar,
            selectedAdvanceId
          )

          .input(
            "payment_date",
            sql.DateTime,
            payment_date
              ? new Date(payment_date)
              : new Date()
          )

          .query(`
            UPDATE Advance_Payment_Details
            SET 
              advance_payment_amount = 0,
              status = 'Settled',
              payment_date = @payment_date
            WHERE 
              advance_pay_id = @advance_id
              AND status = 'pending'
          `);
      }

    }


    // ==================================================
    // COMMIT TRANSACTION
    // ==================================================

    await transaction.commit();


    // ==================================================
    // RESPONSE
    // ==================================================

    res.json({

      success: true,

      payment_id,

      message:
        `Payment setoff details saved under "${payment_id}" successfully`

    });


  } catch (err) {


    // ==================================================
    // ROLLBACK
    // ==================================================

    if (transaction) {

      try {

        await transaction.rollback();

      } catch (rollbackError) {

        console.error(
          "❌ ROLLBACK ERROR:",
          rollbackError
        );
      }
    }


    console.error(
      "❌ PAYMENT SETOFF ERROR:",
      err
    );


    res.status(500).json({

      success: false,

      message: err.message

    });
  }
};