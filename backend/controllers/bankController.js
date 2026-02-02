const { poolPromise, sql } = require("../db");


exports.getBankAccounts = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT bank, branch, account_number
      FROM bank_accounts
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.saveBankTransactions = async (req, res) => {
  const { rows, username } = req.body;

  try {
    const pool = await poolPromise;

    for (let row of rows) {
      await pool.request()
        .input("transaction_type", sql.VarChar(50), row.transactionType)
        .input("date", sql.Date, row.date)
        .input("reference_no", sql.VarChar(100), row.referenceNo)
        .input("account_number", sql.VarChar(100), row.account)
        .input("payment_mode", sql.VarChar(50), row.mode)
        .input("amount", sql.Decimal(18, 2), row.amount)
        .input("description", sql.VarChar(sql.MAX), row.description)
        .input("status", sql.VarChar(50), row.status)
        .input("userlogin", sql.VarChar(50), username)
        .input("realdate", sql.DateTime, new Date())
        .input("bank", sql.VarChar(100), row.bank || null)
.input("branch", sql.VarChar(100), row.branch || null)
.input("cheque_number", sql.VarChar(100), row.cheque_number || null)

        .query(`
          INSERT INTO Bank_Details
(transaction_type, date, reference_no, account_number,
 payment_mode, amount, description, status, userlogin, realdate,
 bank, branch, chque_number)
VALUES
(@transaction_type, @date, @reference_no, @account_number,
 @payment_mode, @amount, @description, @status, @userlogin, @realdate,
 @bank, @branch, @cheque_number)
        `);
    }

    res.json({ message: "Transactions saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveChequeReturn = async (req, res) => {
  const {
    cheque_no,
    date,
    bank,
    branch,
    type,
    cheque_amount,
    return_amount,
    total_amount,
    payee,
    reason,
    username,
  } = req.body;

  if (!cheque_no || !date || !bank || !cheque_amount || !return_amount || !total_amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("cheque_no", sql.VarChar(100), cheque_no)
      .input("date", sql.Date, date)
      .input("bank", sql.VarChar(100), bank)
      .input("branch", sql.VarChar(100), branch)
      .input("type", sql.VarChar(100), type)
      .input("cheque_amount", sql.Decimal(18,2), cheque_amount)
      .input("return_amount", sql.Decimal(18,2), return_amount)
      .input("total_amount", sql.Decimal(18,2), total_amount)
      .input("payee", sql.VarChar(100), payee)
      .input("reason", sql.VarChar(sql.MAX), reason)
      .input("username", sql.VarChar(100), username)
      .input("status", sql.VarChar(100), "Return")
      .input("realdate", sql.DateTime, new Date())
      .query(`
        INSERT INTO Cheque_Return_Details
        (cheque_no, date, bank, branch, type, cheque_amount, return_amount, total_amount, payee, reason, username, status, realdate)
        VALUES
        (@cheque_no, @date, @bank, @branch, @type, @cheque_amount, @return_amount, @total_amount, @payee, @reason, @username, @status, @realdate)
      `);

    res.json({ message: "Cheque return saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.getChequeReturns = async (req, res) => {
  try {
    const pool = await poolPromise;

    const data = await pool.request()
      .query(`
        SELECT cheque_no, date, bank, branch, type, cheque_amount, return_amount, total_amount, payee, reason, status, balance_amount
        FROM Cheque_Return_Details
        WHERE status = 'Return'
        ORDER BY date DESC
      `);

    res.json(data.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveReturnSetoff = async (req, res) => {
  const {
    cheque_no,
    cheque_date,
    cheque_amount,
    setoff_amount,
    setoff_date,
    balance_amount,
    remaks,
    username
  } = req.body;

  try {
    const pool = await poolPromise;

    
    await pool.request()
  .input("cheque_no", sql.VarChar(100), cheque_no) 
  .input("cheque_date", sql.Date, cheque_date)
  .input("cheque_amount", sql.Decimal(18,2), cheque_amount)
  .input("setoff_amount", sql.Decimal(18,2), setoff_amount)
  .input("setoff_date", sql.Date, setoff_date)
  .input("balance_amount", sql.Decimal(18,2), balance_amount)
  .input("remaks", sql.VarChar(sql.MAX), remaks)
  .input("username", sql.VarChar(100), username)
  .input("realdate", sql.DateTime, new Date())
  .query(`
    INSERT INTO Return_Cheque_Setoff
    (cheque_no, cheque_date, cheque_amount, setoff_amount, setoff_date,
     balance_amount, remaks, username, realdate)
    VALUES
    (@cheque_no, @cheque_date, @cheque_amount, @setoff_amount, @setoff_date,
     @balance_amount, @remaks, @username, @realdate)
  `);

    
    

await pool.request()
  .input("chq", sql.VarChar(100), cheque_no)
  .input("dt", sql.Date, cheque_date)
  .input("newBal", sql.Decimal(18,2), balance_amount)
  .query(`
    UPDATE Cheque_Return_Details
    SET 
      balance_amount = @newBal,
      status = CASE WHEN @newBal = 0 THEN 'Settled' ELSE 'Return' END
    WHERE cheque_no = @chq
      AND [date] = @dt
  `);


    res.json({ message: "Return cheque setoff saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSettledSetoffCheques = async (req, res) => {
  try {
    const pool = await poolPromise;

    const data = await pool.request().query(`
     SELECT 
    c.cheque_no,
    CONVERT(varchar(10), c.date, 120) AS cheque_date,
    c.type,
    c.cheque_amount,
    c.status,
    c.payee,
    c.bank,
    c.branch,
    CONVERT(varchar(10), s.setoff_date, 120) AS setoff_date,
    s.setoff_amount,
    s.balance_amount,
    s.remaks
FROM Cheque_Return_Details c
OUTER APPLY (
    SELECT TOP 1
        setoff_date,
        setoff_amount,
        balance_amount,
        remaks
    FROM Return_Cheque_Setoff s
    WHERE s.cheque_no = c.cheque_no
    ORDER BY s.setoff_date DESC
) s
WHERE c.status = 'Settled'
ORDER BY c.date DESC;


    `);

    res.json(data.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.searchSetoffByCheque = async (req, res) => {
  const { cheque_no } = req.query;

  if (!cheque_no) {
    return res.status(400).json({ message: "Cheque number is required" });
  }

  try {
    const pool = await poolPromise;

    const data = await pool.request()
      .input("cheque_no", sql.VarChar(100), cheque_no)
      .query(`
        SELECT
    c.cheque_no,
    CONVERT(varchar(10), c.date, 120) AS cheque_date,
    c.type,
    c.cheque_amount,
    c.payee,
    c.status,
    c.bank,
    c.branch,
    CONVERT(varchar(10), s.setoff_date, 120) AS last_setoff_date,
    s.remaks,
	s.setoff_amount,
	s.balance_amount

FROM Cheque_Return_Details c
LEFT JOIN Return_Cheque_Setoff s
    ON s.cheque_no = c.cheque_no

WHERE c.cheque_no = @cheque_no

ORDER BY c.date DESC, s.setoff_date DESC;
      `);

    res.json(data.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};