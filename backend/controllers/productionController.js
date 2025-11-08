const { poolPromise, sql } = require("../db");

// ---------- FINISH GOODS ----------
exports.getFinishGoods = async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT DISTINCT p.product_code, 
      d.product_Name AS product_name, 
      p.unit_price FROM Product_Price AS p 
      INNER JOIN Product_Details AS d 
      ON p.product_code = d.product_code 
      WHERE p.product_code LIKE 'FG%' ORDER BY d.product_Name

    `;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error("❌ SQL Error (Finish Goods):", err);
    res.status(500).json({ error: "Failed to load finish goods" });
  }
};

// ---------- RAW MATERIALS ----------
exports.getRawMaterials = async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT DISTINCT
    p.product_code,
    d.product_Name AS product_name,
    p.unit_price,
    p.available_stock
FROM Product_Price AS p
INNER JOIN Product_Details AS d 
    ON p.product_code = d.product_code
WHERE p.product_code LIKE 'RM%'
  AND p.available_stock > 0
ORDER BY d.product_Name
    `;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error("❌ SQL Error (Raw Materials):", err);
    res.status(500).json({ error: "Failed to load raw materials" });
  }
};

// ---------- BATCH NUMBER ----------
exports.generateBatchNo = async (req, res) => {
  try {
    const productName = (req.query.productName || "").trim();
    if (!productName) {
      return res.status(400).json({ error: "productName query parameter is required" });
    }

    const prefix = (productName.replace(/\s+/g, "").substring(0, 3) || "PRD").toUpperCase();
    const date = new Date();
    const datePart = `${String(date.getDate()).padStart(2, "0")}${String(
      date.getMonth() + 1
    ).padStart(2, "0")}${String(date.getFullYear()).slice(-2)}`;

    const pool = await poolPromise;
    const request = pool.request();
    request.input("pattern", sql.NVarChar(50), `${prefix}${datePart}%`);

    const result = await request.query(`
      SELECT TOP 1 batch_no 
      FROM Production 
      WHERE batch_no LIKE @pattern
      ORDER BY batch_no DESC
    `);

    let nextNo = 1;
    if (result.recordset.length > 0) {
      const lastBatch = result.recordset[0].batch_no;
      const lastSeq = parseInt(lastBatch.split("-")[1]) || 0;
      nextNo = lastSeq + 1;
    }

    const newBatchNo = `${prefix}${datePart}-${nextNo}`;
    res.json({ batchNo: newBatchNo });
  } catch (err) {
    console.error("❌ Error generating batch number:", err.message);
    res.status(500).json({ error: "Failed to generate batch number", details: err.message });
  }
};

// ---------- SAVE ----------
exports.saveProduction = async (req, res) => {
  const {
    batch_no,
    production_date,
    expiry_date,
    product,
    total_cost,
    production_qty,
    unit_cost,
    details,
    user_login,
  } = req.body;

  if (!batch_no || !production_date || !product || !details?.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let pool;
  let transaction;

  try {
    pool = await poolPromise;
    transaction = pool.transaction();
    await transaction.begin();

    const request = transaction.request();
    await request
      .input("batch_no", sql.NVarChar(50), batch_no)
      .input("production_date", sql.DateTime, production_date)
      .input("expiry_date", sql.DateTime, expiry_date || null)
      .input("product", sql.NVarChar(200), product)
      .input("total_cost", sql.Decimal(18, 2), total_cost || 0)
      .input("production_qty", sql.Int, production_qty || 0)
      .input("unit_cost", sql.Decimal(18, 2), unit_cost || 0)
      .input("active", sql.NVarChar(10), "Yes")
      .input("user_login", sql.NVarChar(100), user_login || "system")
      .input("real_date", sql.DateTime, new Date())
      .query(`
        INSERT INTO Production 
        (batch_no, production_date, expiry_date, product, total_cost, production_qty, unit_cost, active, user_login, real_date)
        VALUES (@batch_no, @production_date, @expiry_date, @product, @total_cost, @production_qty, @unit_cost, @active, @user_login, @real_date)
      `);

    // Insert details
    for (const d of details) {
      const detReq = transaction.request();
      await detReq
        .input("batch_no", sql.NVarChar(50), batch_no)
        .input("product", sql.NVarChar(200), d.product)
        .input("raw_material", sql.NVarChar(200), d.raw)
        .input("unit_price", sql.Decimal(18, 2), d.price)
        .input("used_qty", sql.Decimal(18, 2), d.qty)
        .input("balance", sql.Decimal(18, 2), d.balance)
        .input("cost", sql.Decimal(18, 2), d.cost)
        .query(`
          INSERT INTO Production_Details 
          (batch_no, product, raw_material, unit_price, used_qty, balance, cost)
          VALUES (@batch_no, @product, @raw_material, @unit_price, @used_qty, @balance, @cost)
        `);
    }

    // Log Save (store batch_no in code column)
    const logReq = transaction.request();
    await logReq
      .input("code", sql.NVarChar(50), batch_no)
      .input("active", sql.NVarChar(10), "Yes")
      .input("action", sql.NVarChar(50), "Save")
      .input("login_user", sql.NVarChar(100), user_login || "system")
      .input("date", sql.DateTime, new Date())
      .query(`
        INSERT INTO Login_Ledger (code, active, action, login_user, date)
        VALUES (@code, @active, @action, @login_user, @date)
      `);

    await transaction.commit();
    res.json({ message: "Production saved successfully" });
  } catch (err) {
    console.error("❌ Error saving production:", err.message);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: "Failed to save production", details: err.message });
  }
};

// ---------- EDIT ----------
exports.editProduction = async (req, res) => {
  const { batch_no, production_date, expiry_date, product, total_cost, production_qty, unit_cost, user_login } = req.body;

  if (!batch_no) return res.status(400).json({ error: "Batch number is required" });

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("batch_no", sql.NVarChar(50), batch_no)
      .input("production_date", sql.DateTime, production_date)
      .input("expiry_date", sql.DateTime, expiry_date || null)
      .input("product", sql.NVarChar(200), product)
      .input("total_cost", sql.Decimal(18, 2), total_cost)
      .input("production_qty", sql.Int, production_qty)
      .input("unit_cost", sql.Decimal(18, 2), unit_cost)
      .query(`
        UPDATE Production 
        SET production_date=@production_date, expiry_date=@expiry_date, product=@product, 
            total_cost=@total_cost, production_qty=@production_qty, unit_cost=@unit_cost
        WHERE batch_no=@batch_no
      `);

    // Log Edit (batch_no stored in code column)
    await pool.request()
      .input("code", sql.NVarChar(50), batch_no)
      .input("active", sql.NVarChar(10), "Yes")
      .input("action", sql.NVarChar(50), "Edit")
      .input("login_user", sql.NVarChar(100), user_login || "system")
      .input("date", sql.DateTime, new Date())
      .query(`
        INSERT INTO Login_Ledger (code, active, action, login_user, date)
        VALUES (@code, @active, @action, @login_user, @date)
      `);

    res.json({ message: "Production updated successfully" });
  } catch (err) {
    console.error("❌ Error editing production:", err.message);
    res.status(500).json({ error: "Failed to update production" });
  }
};

// ---------- DELETE ----------
exports.deleteProduction = async (req, res) => {
  const { batch_no, user_login } = req.body;
  if (!batch_no) return res.status(400).json({ error: "Batch number is required" });

  try {
    const pool = await poolPromise;

    await pool.request()
      .input("batch_no", sql.NVarChar(50), batch_no)
      .query(`UPDATE Production SET active='No' WHERE batch_no=@batch_no`);

    // Log Delete (batch_no stored in code column)
    await pool.request()
      .input("code", sql.NVarChar(50), batch_no)
      .input("active", sql.NVarChar(10), "No")
      .input("action", sql.NVarChar(50), "Delete")
      .input("login_user", sql.NVarChar(100), user_login || "system")
      .input("date", sql.DateTime, new Date())
      .query(`
        INSERT INTO Login_Ledger (code, active, action, login_user, date)
        VALUES (@code, @active, @action, @login_user, @date)
      `);

    res.json({ message: "Production marked inactive (deleted)" });
  } catch (err) {
    console.error("❌ Error deleting production:", err.message);
    res.status(500).json({ error: "Failed to delete production" });
  }
};
