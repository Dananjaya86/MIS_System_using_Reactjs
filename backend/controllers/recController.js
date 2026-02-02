const { poolPromise, sql } = require("../db");


exports.getPendingBankRows = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;

    const data = await pool.request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT 
          date,
          reference_no,
          amount,
          payment_mode
        FROM Bank_Details
        WHERE status = 'Pending'
        ORDER BY date DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const total = await pool.request().query(`
      SELECT COUNT(*) AS total
      FROM Bank_Details
      WHERE status = 'Pending'
    `);

    res.json({
      rows: data.recordset,
      total: total.recordset[0].total,
      page,
      pages: Math.ceil(total.recordset[0].total / limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveReconciliation = async (req, res) => {
  const { username, ledgerRows, bankRows } = req.body;

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      
      for (const l of ledgerRows) {

  const checkReqL = new sql.Request(transaction);
  const existsL = await checkReqL
    .input("d", sql.Date, new Date(l.date))
    .input("r", sql.VarChar(100), l.referenceNo)
    .input("a", sql.Decimal(18, 2), l.amount)
    .query(`
      SELECT COUNT(*) AS cnt
      FROM Reconcilation
      WHERE date = @d
        AND reference = @r
        AND amount = @a
    `);

  if (existsL.recordset[0].cnt > 0) {
    
    const reqU = new sql.Request(transaction);
    await reqU
      .input("d", sql.Date, new Date(l.date))
      .input("r", sql.VarChar(100), l.referenceNo)
      .input("a", sql.Decimal(18, 2), l.amount)
      .input("status", sql.VarChar(50), l.status)
      .input("remarks", sql.VarChar(sql.MAX), l.remark || "")
      .input("loginuser", sql.VarChar(50), username)
      .query(`
        UPDATE Reconcilation
        SET status = @status,
            remarks = @remarks,
            loginuser = @loginuser
        WHERE date = @d
          AND reference = @r
          AND amount = @a
      `);

  } else {
    
    const reqI = new sql.Request(transaction);
    await reqI
      .input("date", sql.Date, new Date(l.date))
      .input("reference", sql.VarChar(100), l.referenceNo)
      .input("amount", sql.Decimal(18, 2), l.amount)
      .input("status", sql.VarChar(50), l.status)
      .input("remarks", sql.VarChar(sql.MAX), l.remark || "")
      .input("loginuser", sql.VarChar(50), username)
      .input("realdate", sql.DateTime, new Date())
      .query(`
        INSERT INTO Reconcilation
        (date, reference, amount, status, remarks, loginuser, realdate)
        VALUES (@date, @reference, @amount, @status, @remarks, @loginuser, @realdate)
      `);
  }
}

      
      for (const b of bankRows) {

        
        const checkReq = new sql.Request(transaction);
        const exists = await checkReq
  .input("d", sql.Date, new Date(b.date))
  .input("r", sql.VarChar(sql.MAX), b.reference)
  .input("a", sql.Decimal(18, 2), b.amount)
  .query(`
    SELECT COUNT(*) AS cnt
    FROM Bank_Statment_Details
    WHERE CAST(statment_date AS DATE) = @d
      AND statment_reference = @r
      AND statment_amount = @a
  `);

        if (exists.recordset[0].cnt > 0) {
          continue; 
        }

        const req2 = new sql.Request(transaction);

        await req2
          .input("statment_date", sql.Date, new Date(b.date))
          .input("statment_reference", sql.VarChar(sql.MAX), b.reference)
          .input("statment_amount", sql.Decimal(18, 2), b.amount)
          .input("payment_mode", sql.VarChar(50), b.paymentMode || "")
          .input("status", sql.VarChar(50), b.status)
          .input("loginuser", sql.VarChar(50), username)
          .input("realdate", sql.DateTime, new Date())
          .query(`
            INSERT INTO Bank_Statment_Details
            (statment_date, statment_reference, statment_amount, payment_mode, status, loginuser, realdate)
            VALUES (@statment_date, @statment_reference, @statment_amount, @payment_mode, @status, @loginuser, @realdate)
          `);
      }

      
      for (const l of ledgerRows) {
        if (l.status === "Cleared") {
          const req3 = new sql.Request(transaction);

          await req3
            .input("date", sql.Date, new Date(l.date))
            .input("reference_no", sql.VarChar(100), l.referenceNo)
            .input("amount", sql.Decimal(18, 2), l.amount)
            .input("status", sql.VarChar(50), l.status)
            .query(`
              UPDATE Bank_Details
              SET status = @status
              WHERE date = @date
                AND reference_no = @reference_no
                AND amount = @amount
            `);
        }
      }

      await transaction.commit();
      res.json({ message: "Reconciliation saved successfully" });

    } catch (err) {
      await transaction.rollback();
      res.status(500).json({ message: err.message });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingBankStatements = async (req, res) => {
  try {
    const pool = await poolPromise;

    const data = await pool.request().query(`
      SELECT 
        statment_date,
        statment_reference,
        statment_amount,
        payment_mode,
        status
      FROM Bank_Statment_Details
      WHERE status = 'Pending'
      ORDER BY statment_date DESC
    `);

    res.json(data.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBankStatement = async (req, res) => {
  const { date, reference, amount } = req.body;

  if (!date || !reference || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("d", sql.Date, date) 
      .input("r", sql.VarChar(sql.MAX), reference)
      .input("a", sql.Decimal(18,2), amount)
      .query(`
        DELETE FROM Bank_Statment_Details
        WHERE CAST(statment_date AS DATE) = @d
          AND statment_reference = @r
          AND statment_amount = @a
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "No matching row found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};