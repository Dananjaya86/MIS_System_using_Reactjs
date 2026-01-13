

const { sql, poolPromise } = require("../db");




exports.getExpencessTypes = async function (req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT expencess_type, sub_expencess FROM Expencess_Types ORDER BY expencess_type"
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching expense types:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.addExpencessType = async function (req, res) {
  const { expencess_type, sub_expencess } = req.body;

  if (!expencess_type || !sub_expencess) {
    return res.status(400).json({ message: "Both fields are required" });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("expencess_type", sql.VarChar, expencess_type)
      .input("sub_expencess", sql.VarChar, sub_expencess)
      .query(
        "INSERT INTO Expencess_Types (expencess_type, sub_expencess) VALUES (@expencess_type, @sub_expencess)"
      );
    res.json({ message: "Expense type saved successfully" });
  } catch (err) {
    console.error("Error adding expense type:", err.message);
    res.status(500).json({ message: err.message });
  }
};



exports.getBankAccounts = async function (req, res) {
  try {
    const pool = await poolPromise; 
    const result = await pool.request()
      .query("SELECT no, bank, branch, account_number FROM bank_accounts ORDER BY bank");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching bank accounts:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.addBankAccount = async function (req, res) {
  const { bank, branch, account_number } = req.body;

  if (!bank || !branch || !account_number) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const pool = await poolPromise; 
    await pool.request()
      .input("bank", sql.VarChar(100), bank)
      .input("branch", sql.VarChar(100), branch)
      .input("account_number", sql.VarChar(sql.MAX), account_number)
      .query(
        "INSERT INTO bank_accounts (bank, branch, account_number) VALUES (@bank, @branch, @account_number)"
      );
    res.json({ message: "Bank account added successfully" });
  } catch (err) {
    console.error("Error adding bank account:", err.message);
    res.status(500).json({ message: err.message });
  }
};



exports.saveExpense = async function (req, res) {
  const {
    expencess_type,
    sub_expencess,
    date,
    amount,
    payment_mode,
    account,
    payment_made_by,
    remarks,
    username
  } = req.body;

 
  if (
    !expencess_type ||
    !sub_expencess ||
    !date ||
    !amount ||
    !payment_mode ||
    !account ||
    !payment_made_by ||
    !username
  ) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input("expencess_type", sql.VarChar(100), expencess_type)
      .input("sub_expencess", sql.VarChar(100), sub_expencess)
      .input("date", sql.Date, date)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("payment_mode", sql.VarChar(100), payment_mode)
      .input("account", sql.VarChar(100), account)
      .input("payment_made_by", sql.VarChar(100), payment_made_by)
      .input("remarks", sql.VarChar(sql.MAX), remarks || "")
      .input("username", sql.VarChar(100), username)
      .query(`
        INSERT INTO Expencess_Details
        (expencess_type, sub_expencess, date, amount, payment_mode, account, payment_made_by, remarks, username, realdate)
        VALUES
        (@expencess_type, @sub_expencess, @date, @amount, @payment_mode, @account, @payment_made_by, @remarks, @username, GETDATE())
      `);

    res.json({ message: "Expense saved successfully" });

  } catch (err) {
    console.error("Error saving expense:", err.message);
    res.status(500).json({ message: err.message });
  }
};
