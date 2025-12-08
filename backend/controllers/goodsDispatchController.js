// controllers/goodsDispatchController.js
const { poolPromise, sql } = require("../db");

/* Pad numbers */
function pad(n, width = 2) {
  return n.toString().padStart(width, "0");
}

/* ------------------------------------------------------------------
   1. DISPATCH NUMBER AUTO GENERATOR (DIS + yy + MM + dd + HHmmss)
-------------------------------------------------------------------*/
exports.generateDispatchNo = async (req, res) => {
  try {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const MM = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());

    let base = `DIS${yy}${MM}${dd}${HH}${mm}${ss}`;

    const pool = await poolPromise;
    const check = await pool.request()
      .input("dispatch_no", sql.VarChar(50), base)
      .query(`
        SELECT COUNT(1) AS cnt 
        FROM Dispatch_Notes 
        WHERE dispatch_no = @dispatch_no
      `);

    if (check.recordset[0].cnt > 0) {
      base = `${base}${Date.now().toString().slice(-4)}`; // avoid duplicate
    }

    res.json({ dispatchNo: base });

  } catch (err) {
    console.error("generateDispatchNo error:", err);
    res.status(500).json({ error: "Failed to generate dispatch number." });
  }
};


/* ------------------------------------------------------------------
   2. PRODUCT LIST WITH LATEST AVAILABLE STOCK
-------------------------------------------------------------------*/
exports.getProducts = async (req, res) => {
  const q = (req.query.q || "").trim();

  try {
    const pool = await poolPromise;
    const request = pool.request();

    let sqlText = `
      SELECT
        pd.product_code,
        pd.product_name,
        ISNULL(pp.unit_price, 0) AS unit_price,
        ISNULL(ls.available_stock, 0) AS available_stock
      FROM Product_Details pd
      LEFT JOIN product_price pp 
        ON pp.product_code = pd.product_code

      /* Get latest stock using MAX(real_date) */
      LEFT JOIN (
        SELECT sd1.product_code, sd1.available_stock
        FROM Stock_Details sd1
        INNER JOIN (
            SELECT product_code, MAX(real_date) AS lastDate
            FROM Stock_Details
            GROUP BY product_code
        ) x
        ON x.product_code = sd1.product_code
        AND x.lastDate = sd1.real_date
      ) ls 
      ON ls.product_code = pd.product_code
    `;

    if (q) {
      sqlText += `
        WHERE pd.product_code LIKE @kw
        OR pd.product_name LIKE @kw
      `;
      request.input("kw", sql.VarChar, `%${q}%`);
    }

    const result = await request.query(sqlText);
    res.json(result.recordset);

  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
};


/* ------------------------------------------------------------------
   3. GET SINGLE PRODUCT BY CODE
-------------------------------------------------------------------*/
exports.getProductByCode = async (req, res) => {
  const code = (req.params.code || "").trim();
  if (!code) return res.status(400).json({ error: "Product code required" });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT
          pd.product_code,
          pd.product_name,
          ISNULL(pp.unit_price, 0) AS unit_price,
          ISNULL(ls.available_stock, 0) AS available_stock
        FROM Product_Details pd
        LEFT JOIN product_price pp 
          ON pp.product_code = pd.product_code
        LEFT JOIN (
          SELECT sd1.product_code, sd1.available_stock
          FROM Stock_Details sd1
          INNER JOIN (
              SELECT product_code, MAX(real_date) AS lastDate
              FROM Stock_Details
              GROUP BY product_code
          ) x
          ON x.product_code = sd1.product_code
          AND x.lastDate = sd1.real_date
        ) ls 
        ON ls.product_code = pd.product_code
        WHERE pd.product_code = @code
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json(result.recordset[0]);

  } catch (err) {
    console.error("getProductByCode error:", err);
    res.status(500).json({ error: "Failed to fetch product." });
  }
};


/* ------------------------------------------------------------------
   4. SAVE DISPATCH NOTES (MULTIPLE ROWS)
-------------------------------------------------------------------*/
exports.saveDispatchNotes = async (req, res) => {
  const payload = req.body;

  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    return res.status(400).json({ error: "No items to save." });
  }

  const items = payload.items;
  const dispatchNo = payload.dispatchNo || items[0].dispatchNo || "";
  const userLogin = payload.user_login || "unknown";

  try {
    const pool = await poolPromise;
    const trx = await pool.transaction();

    try {
      await trx.begin();

      for (const it of items) {
        const availableStock =
          (it.availableStock ?? it.available_stock ?? 0); // fixed mixed op

        await trx.request()
          .input("dispatch_no", sql.VarChar(50), dispatchNo)
          .input("product_code", sql.VarChar(50), it.product_code || it.productCode)
          .input("product_name", sql.VarChar(200), it.product_name || it.productName)
          .input("qty", sql.Float, Number(it.qty))
          .input("available_stock", sql.Float, Number(availableStock))
          .input("unit_price", sql.Decimal(18, 2), Number(it.unit_price ?? it.unitPrice ?? 0))
          .input("total_amount", sql.Decimal(18, 2), Number(it.total_amount ?? it.totalAmount ?? 0))
          .input("sales_person", sql.VarChar(100), it.sales_person || it.salesRep || "")
          .input("route", sql.VarChar(100), it.route || "")
          .input("vehicle_no", sql.VarChar(50), it.vehicle_no || it.vehicleno || "")
          .input("user_login", sql.VarChar(50), userLogin)
          .input("real_date", sql.DateTime, new Date(it.realDate || it.date || Date.now()))
          .query(`
            INSERT INTO Dispatch_Notes (
              dispatch_no, product_coe, product_name, qty, available_stock,
              unit_price, total_amount, sales_person, route, vehicle_no,
              user_login, real_date
            )
            VALUES (
              @dispatch_no, @product_code, @product_name, @qty, @available_stock,
              @unit_price, @total_amount, @sales_person, @route, @vehicle_no,
              @user_login, @real_date
            )
          `);
      }

      await trx.commit();
      res.json({
        success: true,
        message: `Saved ${items.length} item(s) under ${dispatchNo}`,
      });

    } catch (innerErr) {
      await trx.rollback();
      console.error("saveDispatchNotes transaction error:", innerErr);
      res.status(500).json({ error: "Failed to save dispatch notes." });
    }

  } catch (err) {
    console.error("saveDispatchNotes error:", err);
    res.status(500).json({ error: "Database connection error." });
  }
};
