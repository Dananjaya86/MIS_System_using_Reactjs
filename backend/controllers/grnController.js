const { sql, poolPromise } = require("../db");


exports.getNextGrnNumber = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 1 grn_no FROM GRN_Details
      WHERE grn_no LIKE 'GRN%'
      ORDER BY grn_no DESC
    `);

    if (result.recordset.length === 0)
      return res.json({ grn_no: "GRN00001" });

    const last = result.recordset[0].grn_no;
    const next = parseInt(last.replace("GRN", ""), 10) + 1;
    const nextGrn = `GRN${next.toString().padStart(5, "0")}`;
    res.json({ grn_no: nextGrn });
  } catch (err) {
    console.error("❌ Error generating GRN:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.searchSuppliers = async (req, res) => {
  const { query } = req.query; 
  try {
    const pool = await poolPromise;
    const request = pool.request();

    if (query) {
      request.input("query", sql.VarChar, `%${query}%`);
      const result = await request.query(`
        SELECT TOP 10 sup_code, sup_name
        FROM Supplier_Details
        WHERE sup_code LIKE @query OR sup_name LIKE @query
        ORDER BY sup_name
      `);
      return res.json(result.recordset);
    } else {
      
      const result = await request.query(`
        SELECT TOP 10 sup_code, sup_name
        FROM Supplier_Details
        ORDER BY sup_name
      `);
      res.json(result.recordset);
    }
  } catch (err) {
    console.error("❌ Supplier search error:", err);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
};


exports.getSupplierByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT sup_code, sup_name
        FROM Supplier_Details
        WHERE sup_code = @code
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Supplier not found" });

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching supplier:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.searchProducts = async (req, res) => {
  const query = req.query.query || "";
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("query", sql.VarChar, `%${query}%`)
      .query(`
        SELECT TOP 10 product_code, product_name
        FROM Product_Details
        WHERE product_code LIKE @query OR product_name LIKE @query
        ORDER BY product_name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Product search error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

exports.getProductByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT product_code, product_name
        FROM Product_Details
        WHERE product_code = @code
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ message: err.message });
  }
};





exports.saveGrn = async (req, res) => {
  const {
    grn_no,
    supplier_code,
    supplier_name,
    supplier_invoice_number,
    supplier_invoice_date,
    product_code,
    product_name,
    invoice_qty,
    total_amount,
    login_user,
  } = req.body;

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    await request.query(`
      INSERT INTO GRN_Details (
        grn_no, supplier_code, supplier_name, supplier_invoice_number,
        supplier_invoice_date, product_code, product_name,
        invoice_qty, total_amount, login_user, real_date
      )
      VALUES (
        '${grn_no}', '${supplier_code}', '${supplier_name}', '${supplier_invoice_number}',
        '${supplier_invoice_date}', '${product_code}', '${product_name}',
        '${invoice_qty}', '${total_amount}', '${login_user}', GETDATE()
      )
    `);

    await transaction.commit();
    res.json({ success: true, message: "GRN saved successfully" });
  } catch (err) {
    console.error("❌ GRN save error:", err);
    res.status(500).json({ message: err.message });
  }
};
