const { sql, poolPromise } = require("../db");
const PDFDocument = require("pdfkit");
const moment = require("moment");

/* ================================
   🔹 1️⃣ Generate Next GRN Number
================================= */
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

/* ================================
   🔹 2️⃣ Supplier Search
================================= */
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

/* ================================
   🔹 3️⃣ Get Supplier by Code
================================= */
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

/* ================================
   🔹 4️⃣ Product Search
================================= */
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

/* ================================
   🔹 5️⃣ Get Product by Code
================================= */
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

/* ================================
   🔹 6️⃣ Save GRN Header
================================= */
exports.saveGrn = async (req, res) => {
  const {
    grn_no,
    supplier_code,
    supplier_name,
    supplier_invoice_number,
    supplier_invoice_date,
    login_user,
  } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .input("supplier_code", sql.VarChar, supplier_code)
      .input("supplier_name", sql.VarChar, supplier_name)
      .input("supplier_invoice_number", sql.VarChar, supplier_invoice_number)
      .input("supplier_invoice_date", sql.VarChar, supplier_invoice_date)
      .input("login_user", sql.VarChar, login_user)
      .query(`
        INSERT INTO GRN_Details
        (grn_no, supplier_code, supplier_name, supplier_invoice_number,
         supplier_invoice_date, login_user, real_date)
        VALUES (@grn_no, @supplier_code, @supplier_name, @supplier_invoice_number,
                @supplier_invoice_date, @login_user, GETDATE())
      `);

    res.json({ success: true, message: "GRN header saved successfully" });
  } catch (err) {
    console.error("❌ GRN save error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   🔹 7️⃣ Save GRN Grid Rows
================================= */
exports.saveGrnGrid = async (req, res) => {
  const { grn_no, product_code, product_name, invoice_qty, unit_price, amount } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .input("product_code", sql.VarChar, product_code)
      .input("product_name", sql.VarChar, product_name)
      .input("invoice_qty", sql.Float, invoice_qty)
      .input("unit_price", sql.Decimal(18, 2), unit_price)
      .input("amount", sql.Decimal(18, 2), amount)
      .query(`
        INSERT INTO GRN_Grid_Details
        (grn_no, product_code, product_name, invoice_qty, unit_price, amount)
        VALUES (@grn_no, @product_code, @product_name, @invoice_qty, @unit_price, @amount)
      `);

    res.json({ success: true, message: "Grid row saved successfully" });
  } catch (err) {
    console.error("❌ Error saving GRN grid:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   🔹 8️⃣ Generate GRN PDF
================================= */
exports.generateGrnPdf = async (req, res) => {
  const { grn_no } = req.params;
  try {
    const pool = await poolPromise;

    // Fetch header and grid data
    const header = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT TOP 1 * FROM GRN_Details WHERE grn_no = @grn_no`);

    const grid = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT * FROM GRN_Grid_Details WHERE grn_no = @grn_no`);

    if (header.recordset.length === 0)
      return res.status(404).json({ message: "GRN not found" });

    const grn = header.recordset[0];
    const items = grid.recordset;

    const doc = new PDFDocument();
    const filename = encodeURIComponent(`${grn_no}.pdf`);

    res.setHeader("Content-disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");

    doc.fontSize(18).text("Goods Receive Note", { align: "center" });
    doc.moveDown();
    doc.fontSize(12)
      .text(`GRN No: ${grn.grn_no}`)
      .text(`Supplier: ${grn.supplier_name}`)
      .text(`Invoice No: ${grn.supplier_invoice_number}`)
      .text(`Invoice Date: ${moment(grn.supplier_invoice_date).format("YYYY-MM-DD")}`)
      .moveDown();

    doc.fontSize(12).text("Items:", { underline: true });
    items.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.product_name} | Qty: ${item.invoice_qty} | Price: ${item.unit_price} | Amount: ${item.amount}`
      );
    });

    doc.end();
    doc.pipe(res);
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   🔹 9️⃣ Search GRNs
================================= */
exports.searchGrns = async (req, res) => {
  const { query } = req.query;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("query", sql.VarChar, `%${query}%`)
      .query(`
        SELECT TOP 50 *
        FROM GRN_Details
        WHERE grn_no LIKE @query OR supplier_name LIKE @query
        ORDER BY real_date DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ GRN search error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   🔹 🔟 Fetch Last GRNs
================================= */
exports.getLastGrns = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 10 * FROM GRN_Details ORDER BY real_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching last GRNs:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   🔹 Fetch Single GRN with Items
================================= */
exports.getGrnByNumber = async (req, res) => {
  const { grn_no } = req.params;
  try {
    const pool = await poolPromise;

    // fetch header
    const headerResult = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT * FROM GRN_Details WHERE grn_no = @grn_no`);

    if (headerResult.recordset.length === 0)
      return res.status(404).json({ message: "GRN not found" });

    const header = headerResult.recordset[0];

    // fetch items
    const itemsResult = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT product_code, product_name, invoice_qty, unit_price, amount FROM GRN_Grid_Details WHERE grn_no = @grn_no`);

    const items = itemsResult.recordset.map(item => ({
      productCode: item.product_code,
      productName: item.product_name,
      invoiceQty: item.invoice_qty,
      unitPrice: item.unit_price,
      totalAmount: item.amount,
    }));

    res.json({ header, items });
  } catch (err) {
    console.error("❌ Error fetching GRN:", err);
    res.status(500).json({ message: err.message });
  }
};

