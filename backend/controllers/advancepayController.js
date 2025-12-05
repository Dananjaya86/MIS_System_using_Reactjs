const { poolPromise, sql } = require("../db");

exports.searchCustomers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const keyword = `%${(req.query.keyword || "").trim()}%`;

    const result = await pool.request()
      .input("keyword", sql.VarChar, keyword)
      .query(`
        SELECT customer_code, name, address
        FROM Customer_Details
        WHERE customer_code LIKE @keyword
           OR name LIKE @keyword
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("Customer search error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.searchSuppliers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const keyword = `%${(req.query.keyword || "").trim()}%`;

    const result = await pool.request()
      .input("keyword", sql.VarChar, keyword)
      .query(`
        SELECT sup_code, sup_name, address
        FROM Supplier_Details
        WHERE sup_code LIKE @keyword
           OR sup_name LIKE @keyword
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("Supplier search error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getNextAdvancePayId = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`SELECT TOP 1 advance_pay_id FROM Advance_Payment_Details ORDER BY advance_pay_id DESC`);

    let nextId = "ADP00001"; 
    if (result.recordset.length > 0) {
      const lastId = result.recordset[0].advance_pay_id; 
      const num = parseInt(lastId.replace("ADP", "")) + 1;
      nextId = "ADP" + num.toString().padStart(5, "0");
    }

    res.json({ nextId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating next Advance Payment ID" });
  }
};


exports.saveAdvancePayment = async (req, res) => {
  const {
    adpaynumber,
    type,
    code,
    name,
    address,
    amount,
    date,
    setoffDate,
    remarks,
    paymentType,
    bank,
    branch,
    chequeNo,       
    otherDetails,
    loginUser
  } = req.body;

  // ------------------ Server-side validation ------------------
  const errors = [];
  if (!adpaynumber) errors.push("Advance Pay Number is required");
  if (!type) errors.push("Party type is required");
  if (!code) errors.push("Party code is required");
  if (!name) errors.push("Party name is required");
  if (!amount || isNaN(amount) || Number(amount) <= 0) errors.push("Amount must be greater than 0");
  if (!date) errors.push("Advance pay date is required");
  if (!setoffDate) errors.push("Setoff date is required");
  if (!paymentType) errors.push("Payment type is required");

  if (paymentType === "Cheque") {
    if (!bank) errors.push("Bank is required for Cheque");
    if (!branch) errors.push("Branch is required for Cheque");
    if (!chequeNo || chequeNo.toString().trim() === "") errors.push("Cheque No is required");
  }

  if (paymentType === "Other") {
    if (!otherDetails) errors.push("Other payment type description is required");
  }

  if (errors.length > 0) return res.status(400).json({ success: false, message: errors.join(", ") });

  try {
    const pool = await poolPromise;

    
    const chequeNumberInt = chequeNo && chequeNo.toString().trim() !== "" 
                            ? parseInt(chequeNo, 10) 
                            : null;

    await pool.request()
      .input("advance_pay_id", sql.VarChar(50), adpaynumber)
      .input("party", sql.VarChar(50), type)
      .input("party_code", sql.VarChar(50), code)
      .input("party_name", sql.VarChar(50), name)
      .input("advance_payment_amount", sql.Decimal(18, 2), amount)
      .input("advance_pay_date", sql.Date, date)
      .input("setoff_date", sql.Date, setoffDate)
      .input("remarks", sql.VarChar(1000), remarks || "")
      .input("payment_type", sql.VarChar(100), paymentType)
      .input("login_user", sql.VarChar(100), loginUser || "SYSTEM") 
      .input("real_date", sql.DateTime, new Date())
      .input("bank_name", sql.VarChar(100), bank || "")
      .input("branch", sql.VarChar(100), branch || "")
      .input("cheque_no", sql.Int, chequeNumberInt)
      .input("other_payment_type", sql.VarChar(100), paymentType === "Other" ? otherDetails : "")
      .input("status", sql.VarChar(20), "Pending")
      .query(`
        INSERT INTO Advance_Payment_Details
        (advance_pay_id, party, party_code, party_name, advance_payment_amount, advance_pay_date,
         setoff_date, remarks, payment_type, login_user, real_date, bank_name, branch, cheque_no, other_payment_type, status)
        VALUES
        (@advance_pay_id, @party, @party_code, @party_name, @advance_payment_amount, @advance_pay_date,
         @setoff_date, @remarks, @payment_type, @login_user, @real_date, @bank_name, @branch, @cheque_no, @other_payment_type, @status)
      `);

    res.json({ success: true, message: "Advance Payment saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error: " + err.message });
  }
};


exports.getAdvancePayments = async (req, res) => {
  const status = req.query.status || "All";

  let query = "SELECT * FROM Advance_Payment_Details";
  if (status !== "All") query += " WHERE status = @status";
   query += " ORDER BY advance_pay_id DESC";

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("status", sql.VarChar, status)
      .query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelAdvancePayment = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

   
    const existing = await pool.request()
      .input("id", sql.VarChar, id)
      .query(`
        SELECT status
        FROM Advance_Payment_Details
        WHERE advance_pay_id = @id
      `);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const currentStatus = existing.recordset[0].status;

    // Prevent deleting if not Pending
    if (currentStatus !== "Pending") {
      return res.status(400).json({
        message: `You cannot delete. This record is already ${currentStatus}`
      });
    }

    // 2. Update status to Cancelled
    await pool.request()
      .input("id", sql.VarChar, id)
      .query(`
        UPDATE Advance_Payment_Details
        SET status = 'Cancelled'
        WHERE advance_pay_id = @id
      `);

    res.json({ success: true, message: "Advance Payment Cancelled Successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
