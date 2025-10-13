const { poolPromise, sql } = require("../db");


async function generateNextCustomerCode() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT TOP 1 customer_code FROM Customer_Details
    WHERE customer_code LIKE 'CUS%'
    ORDER BY customer_code DESC
  `);
  if (!result.recordset.length) return "CUS00001";
  const last = result.recordset[0].customer_code;
  return "CUS" + (parseInt(last.replace(/^CUS/, "")) + 1).toString().padStart(5, "0");
}

exports.getNextCustomerCode = async (req, res) => {
  try { const nextCode = await generateNextCustomerCode(); res.json({ success: true, nextCode }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

async function logLoginLedger(code, active, action, login_user, real_date) {
  const pool = await poolPromise;
  await pool.request()
    .input("code", sql.VarChar(50), code)
    .input("active", sql.VarChar(10), active)
    .input("action", sql.VarChar(20), action)
    .input("login_user", sql.VarChar(100), login_user)
    .input("date", sql.DateTime, real_date)
    .query(`INSERT INTO Login_Ledger (code, active, action, login_user, date) VALUES (@code, @active, @action, @login_user, @date)`);
}

exports.getAllCustomers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT customer_code, name, address, phone_number, contact_person, advance_payment,
             date, route, credit_amount, status, balance_amount, total_return
      FROM Customer_Details WHERE active='yes' ORDER BY date DESC, customer_code
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCustomerByCode = async (req, res) => {
  try {
    const code = req.params.customer_code;
    const pool = await poolPromise;
    const result = await pool.request().input("customer_code", sql.VarChar(50), code)
      .query("SELECT * FROM Customer_Details WHERE customer_code=@customer_code AND active='yes'");
    res.json({ success: true, data: result.recordset[0] || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addCustomer = async (req, res) => {
  try {
    const { name, address, phone_number, contact_person, advance_payment, date, route, credit_amount, status, balance_amount, total_return, login_user } = req.body;
    const pool = await poolPromise;
    const customer_code = await generateNextCustomerCode();
    const real_date = new Date();
    await pool.request()
      .input("customer_code", sql.VarChar(50), customer_code)
      .input("name", sql.VarChar(200), name || null)
      .input("address", sql.VarChar(500), address || null)
      .input("phone_number", sql.VarChar(100), phone_number || null)
      .input("contact_person", sql.VarChar(200), contact_person || null)
      .input("advance_payment", sql.Decimal(18,2), advance_payment || 0)
      .input("date", sql.Date, date ? new Date(date) : null)
      .input("route", sql.VarChar(200), route || null)
      .input("credit_amount", sql.Decimal(18,2), credit_amount || 0)
      .input("status", sql.VarChar(50), status || "Good")
      .input("balance_amount", sql.Decimal(18,2), balance_amount || 0)
      .input("total_return", sql.Decimal(18,2), total_return || 0)
      .input("login_user", sql.VarChar(200), login_user || "Unknown")
      .input("real_date", sql.DateTime, real_date)
      .input("active", sql.VarChar(10), "yes")
      .query(`
        INSERT INTO Customer_Details (customer_code, name, address, phone_number, contact_person, advance_payment, date, route, credit_amount, status, balance_amount, total_return, login_user, real_date, active)
        VALUES (@customer_code,@name,@address,@phone_number,@contact_person,@advance_payment,@date,@route,@credit_amount,@status,@balance_amount,@total_return,@login_user,@real_date,@active)
      `);
    await logLoginLedger(customer_code,"yes","save",login_user || "Unknown",real_date);
    res.json({ success: true, message: "Customer saved successfully", customer_code });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCustomer = async (req, res) => {
  try {
    const code = req.params.customer_code;
    const { name, address, phone_number, contact_person, advance_payment, date, route, credit_amount, status, balance_amount, total_return, login_user } = req.body;
    const pool = await poolPromise;
    const real_date = new Date();
    await pool.request()
      .input("customer_code", sql.VarChar(50), code)
      .input("name", sql.VarChar(200), name || null)
      .input("address", sql.VarChar(500), address || null)
      .input("phone_number", sql.VarChar(100), phone_number || null)
      .input("contact_person", sql.VarChar(200), contact_person || null)
      .input("advance_payment", sql.Decimal(18,2), advance_payment || 0)
      .input("date", sql.Date, date ? new Date(date) : null)
      .input("route", sql.VarChar(200), route || null)
      .input("credit_amount", sql.Decimal(18,2), credit_amount || 0)
      .input("status", sql.VarChar(50), status || "Good")
      .input("balance_amount", sql.Decimal(18,2), balance_amount || 0)
      .input("total_return", sql.Decimal(18,2), total_return || 0)
      .input("login_user", sql.VarChar(200), login_user || "Unknown")
      .input("real_date", sql.DateTime, real_date)
      .query(`
        UPDATE Customer_Details SET name=@name,address=@address,phone_number=@phone_number,contact_person=@contact_person,advance_payment=@advance_payment,date=@date,route=@route,credit_amount=@credit_amount,status=@status,balance_amount=@balance_amount,total_return=@total_return,login_user=@login_user,real_date=@real_date WHERE customer_code=@customer_code
      `);
    await logLoginLedger(code,"yes","edit",login_user || "Unknown",real_date);
    res.json({ success: true, message: "Customer updated successfully", customer_code: code });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const code = req.params.customer_code;
    const { login_user } = req.body || {};
    const pool = await poolPromise;
    const real_date = new Date();
    await pool.request()
      .input("customer_code", sql.VarChar(50), code)
      .input("active", sql.VarChar(10), "no")
      .input("login_user", sql.VarChar(200), login_user || "Unknown")
      .input("real_date", sql.DateTime, real_date)
      .query("UPDATE Customer_Details SET active=@active, login_user=@login_user, real_date=@real_date WHERE customer_code=@customer_code");
    await logLoginLedger(code,"no","delete",login_user || "Unknown",real_date);
    res.json({ success: true, message: "Customer deleted successfully", customer_code: code });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
