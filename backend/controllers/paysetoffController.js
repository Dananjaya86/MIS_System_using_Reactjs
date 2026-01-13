const { sql, poolPromise } = require("../db");


exports.getPendingPayments = async (req, res) => {
  const party = req.query.party || req.query.party_code;

  try {
    const pool = await poolPromise;

    let prefix = "cus%";
    if (party === "sup") prefix = "sup%";

    const result = await pool
      .request()
      .input("prefix", sql.VarChar, prefix)
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
        WHERE party_code LIKE @prefix AND status = 'pending'
        ORDER BY payment_date DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ getPendingPayments error:", err);
    res.status(500).json({ message: err.message });
  }
};


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
          advance_payment_amount
        FROM Advance_Payment_Details
        WHERE status = 'pending'
        ORDER BY setoff_date DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("❌ getAdvancePayments error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getAdvanceByParty = async (req, res) => {
  const { code } = req.query;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT 
          advance_pay_id,
          party_code,
          party_name,
          advance_payment_amount,
          advance_pay_date
        FROM Advance_Payment_Details
        WHERE party_code = @code AND status = 'pending'
        ORDER BY advance_pay_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ getAdvanceByParty error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.savePaymentSetoff = async (req, res) => {
  console.log("🔥 SAVE PAYSETOFF BODY:", req.body);
  const { gridData, selectedAdvanceId, payment_date, user_login } = req.body;


  if (!Array.isArray(gridData) || gridData.length === 0) {
    return res.status(400).json({ message: "No payment data provided" });
  }

  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    
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
    if (lastPay.recordset.length) {
      nextNo = parseInt(lastPay.recordset[0].payment_id.slice(-2)) + 1;
    }

    const payment_id = `PAY${yy}${mm}${String(nextNo).padStart(2, "0")}`;

    
    for (const row of gridData) {

      const paidAmount = Number(row.paidAmount || 0);
      const balanceAmount = Number(row.balanceAmount || 0);
      const totalCredit = Number(row.totalCredit || 0);
      const advancePayment = Number(row.advancePayment || 0);

      if (paidAmount <= 0) {
        throw new Error("Paid amount must be greater than zero");
      }

      
      if (row.invoiceNumber && totalCredit > 0) {
        const updReq = new sql.Request(transaction);
        await updReq
          .input("payment", sql.Decimal(18,2), paidAmount)
          .input("balance", sql.Decimal(18,2), balanceAmount)
          .input("status", sql.VarChar, balanceAmount === 0 ? "Settled" : "Pending")
          .input("ref_no", sql.VarChar, row.invoiceNumber)
          .query(`
            UPDATE pending_payment
            SET payment = @payment,
                balance_payment = @balance,
                status = @status
            WHERE ref_number = @ref_no
          `);
      }

      
      const insReq = new sql.Request(transaction);
      await insReq
        .input("payment_id", sql.VarChar, payment_id)
        .input("party_code", sql.VarChar, row.code)
        .input("party_name", sql.VarChar, row.name)
        .input("ref_no", sql.VarChar, row.invoiceNumber)
        .input("invoice_amount", sql.Decimal(18,2), totalCredit)
        .input("total_amount", sql.Decimal(18,2), totalCredit)
        .input("paid_amount", sql.Decimal(18,2), paidAmount)
        .input("balance_amount", sql.Decimal(18,2), balanceAmount)
        .input("advance_payment", sql.Decimal(18,2), advancePayment)
        .input("user_login", sql.VarChar, user_login)
        .input("real_date", sql.DateTime, payment_date)
        .query(`
          INSERT INTO Payment_setoff (
            payment_id, party_code, party_name, ref_no,
            invoice_amount, total_amount, paid_amount,
            balance_amount, user_login, real_date, advance_payment
          )
          VALUES (
            @payment_id, @party_code, @party_name, @ref_no,
            @invoice_amount, @total_amount, @paid_amount,
            @balance_amount, @user_login, @real_date, @advance_payment
          )
        `);

      
if (row.advancePayId) {
  const remainingAdvance = Number(row.balanceAmount || 0);

  const advReq = new sql.Request(transaction);
  await advReq
    .input("advance_id", sql.VarChar, row.advancePayId)
    .input("remaining", sql.Decimal(18,2), remainingAdvance)
    .input("payment_date", sql.DateTime, payment_date)
    .query(`
      UPDATE Advance_Payment_Details
      SET advance_payment_amount = @remaining,
          status = CASE 
                     WHEN @remaining = 0 THEN 'Settled'
                     ELSE 'Pending'
                   END,
          payment_date = @payment_date
      WHERE advance_pay_id = @advance_id
    `);
}


    }

    await transaction.commit();

    res.json({
      success: true,
      payment_id,
      message: `Payment setoff details saved under "${payment_id}" successfully`
    });

  } catch (err) {
    if (transaction) await transaction.rollback();

    console.error("❌ PAYMENT SETOFF ERROR:", err);

    res.status(500).json({
      message: err.message
    });
  }
};

