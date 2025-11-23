// backend/controllers/invoiceController.js
const { sql, poolPromise } = require("../db");

// GET NEXT INVOICE NUMBER
exports.getNextInvoiceNo = async (req, res) => {
  const saleType = req.params.type; // "cash" or "credit"
  try {
    const pool = await poolPromise;
    const prefix = saleType === "cash" ? "INVCA" : "INVCR";

    const result = await pool.request()
      .query(`
        SELECT TOP 1 invoice_no
        FROM Invoice
        WHERE invoice_no LIKE '${prefix}%'
        ORDER BY invoice_no DESC
      `);

    let nextId = "001";
    if (result.recordset.length > 0) {
      const last = result.recordset[0].invoice_no;
      const numMatch = String(last).match(/(\d+)$/);
      const lastNum = numMatch ? parseInt(numMatch[1]) : 0;
      nextId = (lastNum + 1).toString().padStart(3, "0");
    }

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);

    const invoiceNo = `${prefix}${year}${month}${nextId}`;
    res.json({ invoiceNo });
  } catch (err) {
    console.error("getNextInvoiceNo error:", err);
    res.status(500).json({ invoiceNo: "TEMP001", temp: true });
  }
};

// PRODUCT SEARCH (autocomplete) - returns unit_cost too
exports.searchProducts = async (req, res) => {
  const q = `%${(req.query.query || "").trim()}%`;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("query", sql.VarChar, q)
      .query(`
        SELECT TOP 10 product_code, product_name, ISNULL(unit_cost,0) AS unit_cost
        FROM Product_Details
        WHERE product_code LIKE @query OR product_name LIKE @query
        ORDER BY product_name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("searchProducts error:", err);
    res.status(500).json([]);
  }
};

// GET PRODUCT BY CODE (optional)
exports.getProductByCode = async (req, res) => {
  const code = (req.params.code || "").trim();
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT product_code, product_name, ISNULL(unit_cost,0) AS unit_cost, units, available_stock
        FROM Product_Details
        WHERE product_code = @code
      `);
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, ...result.recordset[0] });
  } catch (err) {
    console.error("getProductByCode error:", err);
    res.status(500).json({ success: false, message: "Failed to get product" });
  }
};

// CUSTOMER SEARCH (autocomplete)
exports.searchCustomers = async (req, res) => {
  const q = `%${(req.query.query || "").trim()}%`;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("query", sql.VarChar, q)
      .query(`
        SELECT TOP 10 customer_code, name AS customer_name, credit_amount
        FROM Customer_Details
        WHERE customer_code LIKE @query OR name LIKE @query
        ORDER BY name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("searchCustomers error:", err);
    res.status(500).json([]);
  }
};

// GET CUSTOMER DETAILS (correct join to pending_payment)
// This returns top-level fields for frontend convenience.
exports.getCustomerByCode = async (req, res) => {
  const code = (req.params.code || "").trim();
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT
          c.customer_code,
          c.name AS customer_name,
          ISNULL(c.credit_amount, 0) AS credit_amount,
          ISNULL(p.balance_payment, 0) AS previous_balance
        FROM Customer_Details c
        LEFT JOIN pending_payment p
          ON c.customer_code = p.party_code
        WHERE c.customer_code = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // send both top-level fields and customer object (some frontends expect either)
    const row = result.recordset[0];
    res.json({
      success: true,
      customer_code: row.customer_code,
      customer_name: row.customer_name,
      credit_limit: row.credit_amount,
      previous_balance: row.previous_balance,
      customer: row
    });
  } catch (err) {
    console.error("getCustomerByCode error:", err);
    res.status(500).json({ success: false, message: "Failed to get customer details" });
  }
};
