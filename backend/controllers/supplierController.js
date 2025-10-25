const { poolPromise, sql } = require("../db");

// ========== Helper Function: Generate Next Supplier Code ==========
async function generateNextSupplierCode() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT TOP 1 sup_code 
    FROM Supplier_Details 
    WHERE sup_code LIKE 'SUP%'
    ORDER BY sup_code DESC
  `);

  if (!result.recordset.length) return "SUP0001";
  const last = result.recordset[0].sup_code;
  const num = parseInt(last.replace(/^SUP/, ""), 10) || 0;
  return "SUP" + (num + 1).toString().padStart(4, "0");
}

// ========== Ledger Logger ==========
async function logLoginLedger(code, active, action, login_user, real_date) {
  const pool = await poolPromise;
  await pool.request()
    .input("code", sql.VarChar(50), code)
    .input("active", sql.VarChar(10), active)
    .input("action", sql.VarChar(20), action)
    .input("login_user", sql.VarChar(100), login_user)
    .input("date", sql.DateTime, real_date)
    .query(`
      INSERT INTO Login_Ledger (code, active, action, login_user, date)
      VALUES (@code, @active, @action, @login_user, @date)
    `);
}

// ========== Create Ledger Entry ==========
exports.createLedgerEntry = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { sup_code, amount, description } = req.body;

    await pool.request()
      .input("sup_code", sql.VarChar, sup_code)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("description", sql.VarChar, description)
      .query(`
        INSERT INTO Supplier_Ledger (sup_code, amount, description, entry_date)
        VALUES (@sup_code, @amount, @description, GETDATE())
      `);

    res.json({ success: true, message: "Ledger entry added" });
  } catch (err) {
    console.error("❌ Error creating ledger entry:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== Get Next Supplier Code ==========
exports.getNextSupplierCode = async (req, res) => {
  try {
    const nextCode = await generateNextSupplierCode();
    res.json({ success: true, nextCode });
  } catch (err) {
    console.error("getNextSupplierCode error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========== Get All Suppliers ==========
exports.getAllSuppliers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * 
      FROM Supplier_Details 
      WHERE active='Yes'
      ORDER BY sup_code DESC
    `);
    res.json({ success: true, data: result.recordset || [] });
  } catch (err) {
    console.error("getAllSuppliers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== Get Supplier by Code ==========
exports.getSupplierByCode = async (req, res) => {
  try {
    const code = req.params.sup_code;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("sup_code", sql.VarChar(50), code)
      .query(`
        SELECT * 
        FROM Supplier_Details 
        WHERE sup_code=@sup_code AND active='Yes'
      `);

    res.json({ success: true, data: result.recordset[0] || null });
  } catch (err) {
    console.error("getSupplierByCode error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== Add Supplier ==========
// ========== Add Supplier (with debug logs) ==========
exports.addSupplier = async (req, res) => {
  try {
    console.log("📩 Incoming supplier data:", req.body); // Debug incoming data

    const {
      sup_name, address, phone, contact_person,
      advance_payment, date, credit_amount, status,
      balance_payment, total_return, login_user
    } = req.body;

    const pool = await poolPromise;
    const sup_code = await generateNextSupplierCode();
    const real_date = new Date();

    console.log("✅ Generated Supplier Code:", sup_code);

    await pool.request()
      .input("sup_code", sql.VarChar(50), sup_code)
      .input("sup_name", sql.VarChar(100), sup_name || null)
      .input("address", sql.VarChar(500), address || null)
      .input("phone", sql.VarChar(12), phone || null)
      .input("contact_person", sql.VarChar(200), contact_person || null)
      .input("advance_payment", sql.Decimal(18,2), advance_payment || 0)
      .input("date", sql.Date, date ? new Date(date) : null)
      .input("credit_amount", sql.Decimal(18,2), credit_amount || 0)
      .input("status", sql.VarChar(50), status || "Active")
      .input("balance_payment", sql.Decimal(18,2), balance_payment || 0)
      .input("total_return", sql.Decimal(18,2), total_return || 0)
      .input("login_user", sql.VarChar(200), login_user || "Unknown")
      .input("real_date", sql.DateTime, real_date)
      .input("active", sql.VarChar(10), "Yes")
      .query(`
        INSERT INTO Supplier_Details (
          sup_code, sup_name, address, phone, contact_person, advance_payment, date,
          credit_amount, status, balance_payment, total_return, login_user, real_date, active
        )
        VALUES (
          @sup_code, @sup_name, @address, @phone, @contact_person, @advance_payment, @date,
          @credit_amount, @status, @balance_payment, @total_return, @login_user, @real_date, @active
        )
      `);

    await logLoginLedger(sup_code, "Yes", "save", login_user || "Unknown", real_date);

    res.json({ success: true, message: "Supplier saved successfully", sup_code });
  } catch (err) {
    console.error("❌ addSupplier ERROR DETAILS:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ========== Update Supplier ==========
exports.updateSupplier = async (req, res) => {
  try {
    const code = req.params.sup_code;
    const {
      sup_name, address, phone, contact_person,
      advance_payment, date, credit_amount, status,
      balance_payment, total_return, login_user
    } = req.body;

    const pool = await poolPromise;
    const real_date = new Date();

    await pool.request()
      .input("sup_code", sql.VarChar(50), code)
      .input("sup_name", sql.VarChar(200), sup_name || null)
      .input("address", sql.VarChar(500), address || null)
      .input("phone", sql.VarChar(100), phone || null)
      .input("contact_person", sql.VarChar(200), contact_person || null)
      .input("advance_payment", sql.Decimal(18,2), advance_payment || 0)
      .input("date", sql.Date, date ? new Date(date) : null)
      .input("credit_amount", sql.Decimal(18,2), credit_amount || 0)
      .input("status", sql.VarChar(50), status || "Active")
      .input("balance_payment", sql.Decimal(18,2), balance_payment || 0)
      .input("total_return", sql.Decimal(18,2), total_return || 0)
      .input("login_user", sql.VarChar(200), login_user || "Unknown")
      .input("real_date", sql.DateTime, real_date)
      .query(`
        UPDATE Supplier_Details
        SET sup_name=@sup_name, address=@address, phone=@phone,
            contact_person=@contact_person, advance_payment=@advance_payment,
            date=@date, credit_amount=@credit_amount, status=@status,
            balance_payment=@balance_payment, total_return=@total_return,
            login_user=@login_user, real_date=@real_date
        WHERE sup_code=@sup_code
      `);

    await logLoginLedger(code, "Yes", "edit", login_user || "Unknown", real_date);

    res.json({ success: true, message: "Supplier updated successfully", sup_code: code });
  } catch (err) {
    console.error("updateSupplier error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== Delete Supplier (Soft Delete) ==========
exports.deleteSupplier = async (req, res) => {
  try {
    const code = req.params.sup_code;
    const { login_user } = req.body || {};
    const pool = await poolPromise;
    const real_date = new Date();

    await pool.request()
      .input("sup_code", sql.VarChar(50), code)
      .input("active", sql.VarChar(10), "no")
      .input("login_user", sql.VarChar(200), login_user || "Unknown")
      .input("real_date", sql.DateTime, real_date)
      .query(`
        UPDATE Supplier_Details
        SET active=@active, login_user=@login_user, real_date=@real_date
        WHERE sup_code=@sup_code
      `);

    await logLoginLedger(code, "no", "delete", login_user || "Unknown", real_date);

    res.json({ success: true, message: "Supplier deleted successfully", sup_code: code });
  } catch (err) {
    console.error("deleteSupplier error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
