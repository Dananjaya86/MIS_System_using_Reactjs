const { sql, poolPromise } = require("../db");
const PDFDocument = require("pdfkit");
const moment = require("moment");

/* ================================
   STOCK UPDATE FUNCTION
================================= */
async function updateStock(product_code, product_name, qty, login_user = "Unknown") {
  const pool = await poolPromise;

  const last = await pool.request()
    .input("product_code", sql.VarChar, product_code)
    .query(`
      SELECT TOP 1 available_stock
      FROM Stock_Details
      WHERE product_code = @product_code
      ORDER BY real_date DESC
    `);

  let previousAvailable = 0;
  if (last.recordset.length > 0) previousAvailable = last.recordset[0].available_stock || 0;

  const newAvailable = previousAvailable + qty;

  await pool.request()
    .input("product_code", sql.VarChar, product_code)
    .input("product_name", sql.VarChar, product_name)
    .input("stock_in", sql.Float, qty)
    .input("stock_out", sql.Float, 0)
    .input("available_stock", sql.Float, newAvailable)
    .input("login_user", sql.VarChar, login_user)
    .query(`
      INSERT INTO Stock_Details
      (product_code, product_name, stock_in, stock_out, available_stock, login_user, real_date)
      VALUES
      (@product_code, @product_name, @stock_in, @stock_out, @available_stock, @login_user, GETDATE())
    `);
}

/* ================================
    Generate Next GRN Number
================================= */
exports.getNextGrnNumber = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 1 grn_no FROM GRN_Details
      WHERE grn_no LIKE 'GRN%'
      ORDER BY grn_no DESC
    `);

    if (result.recordset.length === 0) return res.json({ grn_no: "GRN00001" });

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
   Supplier Search
================================= */
exports.searchSuppliers = async (req, res) => {
  const q = req.query.query || "";
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("query", sql.VarChar, `%${q}%`)
      .query(`
        SELECT TOP 10 sup_code, sup_name
        FROM Supplier_Details
        WHERE sup_code LIKE @query OR sup_name LIKE @query
        ORDER BY sup_name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Supplier search error:", err);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
};

/* ================================
    Get Supplier by Code
================================= */
exports.getSupplierByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT sup_code, sup_name, address, phone, contact_person
        FROM Supplier_Details
        WHERE sup_code = @code
      `);
    if (result.recordset.length === 0) return res.status(404).json({ message: "Supplier not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching supplier:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
    Product Search
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
    Get Product by Code
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
    if (result.recordset.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   Save GRN Header + Pending Payment
================================= */
exports.saveGrn = async (req, res) => {
  const {
    grn_no,
    supplier_code,
    supplier_name,
    supplier_invoice_number,
    supplier_invoice_date,
    gross_amount,
    discount_amount,
    net_amount,
    login_user
  } = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .input("supplier_code", sql.VarChar, supplier_code)
      .input("supplier_name", sql.VarChar, supplier_name)
      .input("supplier_invoice_number", sql.VarChar, supplier_invoice_number)
      .input("supplier_invoice_date", sql.VarChar, supplier_invoice_date)
      .input("gross_amount", sql.Decimal(18, 2), gross_amount)
      .input("discount_amount", sql.Decimal(18, 2), discount_amount)
      .input("net_amount", sql.Decimal(18, 2), net_amount)
      .input("login_user", sql.VarChar, login_user || "Unknown")
      .query(`
        INSERT INTO GRN_Details
        (grn_no, supplier_code, supplier_name, supplier_invoice_number,
         supplier_invoice_date, gross_amount, discount_amount, net_amount,
         login_user, real_date)
        VALUES 
        (@grn_no, @supplier_code, @supplier_name, @supplier_invoice_number,
         @supplier_invoice_date, @gross_amount, @discount_amount, @net_amount,
         @login_user, GETDATE())
      `);

    const prevBalanceRes = await pool.request()
      .input("supplier_code", sql.VarChar, supplier_code)
      .query(`
        SELECT TOP 1 balance_payment
        FROM Pending_Payment
        WHERE party_code = @supplier_code
        ORDER BY real_time DESC
      `);

    let previousBalance = 0;
    if (prevBalanceRes.recordset.length > 0) previousBalance = prevBalanceRes.recordset[0].balance_payment || 0;

    const newBalance = previousBalance + parseFloat(net_amount || 0);

    await pool.request()
      .input("ref_number", sql.VarChar, grn_no)
      .input("party_code", sql.VarChar, supplier_code)
      .input("party_name", sql.VarChar, supplier_name)
      .input("payable_amount", sql.Decimal(18, 2), net_amount)
      .input("payment", sql.Decimal(18, 2), 0)
      .input("balance_payment", sql.Decimal(18, 2), newBalance)
      .input("status", sql.VarChar, "pending")
      .input("login_user", sql.VarChar, login_user || "Unknown")
      .query(`
        INSERT INTO Pending_Payment
        (ref_number, party_code, party_name, payable_amount, payment, balance_payment, payment_date, status, login_user, real_time)
        VALUES
        (@ref_number, @party_code, @party_name, @payable_amount, @payment, @balance_payment, NULL, @status, @login_user, GETDATE())
      `);

    res.json({ success: true, message: "GRN header and pending payment saved successfully" });
  } catch (err) {
    console.error("❌ GRN save error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
    Save GRN Grid Rows + Update Stock
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

    const headerRes = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT TOP 1 login_user FROM GRN_Details WHERE grn_no = @grn_no`);

    const login_user = (headerRes.recordset[0] && headerRes.recordset[0].login_user) || "Unknown";

    await updateStock(product_code, product_name, Number(invoice_qty), login_user);

    res.json({ success: true, message: "Grid row saved & stock updated successfully" });
  } catch (err) {
    console.error("❌ Error saving GRN grid:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   GET PENDING PAYMENT
================================= */
exports.getPendingPayment = async (req, res) => {
  const { supplier_code } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("supplier_code", sql.VarChar, supplier_code)
      .query(`
        SELECT TOP 1 balance_payment
        FROM Pending_Payment
        WHERE party_code = @supplier_code
        ORDER BY real_time DESC
      `);
    res.json(result.recordset[0] || { balance_payment: 0 });
  } catch (err) {
    console.error("❌ Error fetching pending payment:", err);
    res.status(500).json({ message: err.message });
  }
};




/* ================================
    Generate GRN PDF
================================= */
exports.generateGrnPdf = async (req, res) => {
  const { grn_no } = req.params;

  try {
    const pool = await poolPromise;

   
    const headerRes = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT TOP 1 * FROM GRN_Details WHERE grn_no = @grn_no`);
    if (!headerRes.recordset.length) return res.status(404).json({ message: "GRN not found" });
    const grn = headerRes.recordset[0];

    const gridRes = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT * FROM GRN_Grid_Details WHERE grn_no = @grn_no`);
    const items = gridRes.recordset;

    const supplierRes = await pool.request()
      .input("supplier_code", sql.VarChar, grn.supplier_code)
      .query(`SELECT TOP 1 * FROM Supplier_Details WHERE sup_code = @supplier_code`);
    const supplier = supplierRes.recordset[0] || {};

    
    // INIT PDF
    
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const filename = encodeURIComponent(`${grn_no}.pdf`);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Helper functions
    const checkPageBreak = (currentY, rowHeight = 20) => {
      if (currentY + rowHeight > doc.page.height - 80) {
        doc.addPage();
        return doc.y;
      }
      return currentY;
    };
    const drawRoundedRect = (x, y, w, h, r = 5) => { doc.roundedRect(x, y, w, h, r).stroke(); };

    // Header
    doc.fontSize(20).text("MILKEE FOODS PRODUCT", { align: "center" }).moveDown(0.3);
    doc.fontSize(12).text("Halpita, Polgasowita", { align: "center" })
       .text("+94 778 608 207", { align: "center" }).moveDown(1);
    doc.fontSize(16).text("GOODS RECEIVE NOTE", { align: "center", underline: true }).moveDown(1);

    // Supplier Box (dynamic height)
    const boxX = 40;
    const boxWidth = 250;
    const padding = 8;
    const startY = doc.y;

    doc.fontSize(12).text("Supplier Details", boxX + padding, startY, { underline: true });

    const supplierFields = [
      { label: "Supplier Code", value: supplier.sup_code || grn.supplier_code },
      { label: "Supplier Name", value: supplier.sup_name || grn.supplier_name },
      { label: "Address", value: supplier.address || "" },
      { label: "Phone", value: supplier.phone || "" },
      { label: "Contact Person", value: supplier.contact_person || "" },
    ];

    // Calculate total supplier box height
    let currentY = startY + 20;
    let totalHeight = 0;
    supplierFields.forEach(field => {
      const h = doc.heightOfString(`${field.label}: ${field.value}`, { width: boxWidth - padding * 2 }) + 4;
      totalHeight += h;
    });

    drawRoundedRect(boxX, startY - 5, boxWidth, totalHeight + 10, 6);

    // Render supplier text
    currentY = startY + 20;
    supplierFields.forEach(field => {
      const h = doc.heightOfString(`${field.label}: ${field.value}`, { width: boxWidth - padding * 2 });
      doc.fontSize(10).text(`${field.label}: ${field.value}`, boxX + padding, currentY, { width: boxWidth - padding * 2 });
      currentY += h + 4;
    });

    // GRN Details (right)
    const rightBoxX = 320;
    const rightBoxWidth = 250;
    doc.fontSize(12).text("GRN Details", rightBoxX + padding, startY, { underline: true });

    const grnFields = [
      { label: "GRN No", value: grn.grn_no },
      { label: "GRN Date", value: moment(grn.real_date).format("YYYY-MM-DD") },
      { label: "Invoice Number", value: grn.supplier_invoice_number },
      { label: "Invoice Date", value: moment(grn.supplier_invoice_date).format("YYYY-MM-DD") },
    ];

    let rightY = startY + 20;
    grnFields.forEach(field => {
      const h = doc.heightOfString(`${field.label}: ${field.value}`, { width: rightBoxWidth - padding * 2 });
      doc.fontSize(10).text(`${field.label}: ${field.value}`, rightBoxX + padding, rightY, { width: rightBoxWidth - padding * 2 });
      rightY += h + 4;
    });

    drawRoundedRect(rightBoxX, startY - 5, rightBoxWidth, rightY - startY + 10, 6);

    // Table header
    let tableY = Math.max(currentY, rightY) + 10;
    const tableX = 40;
    const columnWidths = { productCode: 90, productName: 140, qty: 60, price: 80, amount: 80 };
    const headers = ["Product Code", "Product Name", "Qty", "Unit Price", "Amount"];
    const positions = [
      tableX,
      tableX + columnWidths.productCode,
      tableX + columnWidths.productCode + columnWidths.productName,
      tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty,
      tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty + columnWidths.price
    ];

    headers.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold')
         .text(header, positions[i] + 2, tableY, { width: Object.values(columnWidths)[i], align: "left" });
    });

    doc.rect(tableX, tableY - 2, Object.values(columnWidths).reduce((a, b) => a + b, 0), 20).stroke();
    tableY += 22;

    // Table rows
    items.forEach((item, index) => {
      tableY = checkPageBreak(tableY, 20);

      const rowHeight = Math.max(doc.heightOfString(item.product_name || "", { width: columnWidths.productName }) + 8, 20);

      if (index % 2 === 0) {
        doc.fillColor('#f0f0f0')
           .rect(tableX, tableY, Object.values(columnWidths).reduce((a, b) => a + b, 0), rowHeight)
           .fill();
        doc.fillColor('#000');
      }

      let colX = tableX;
      Object.keys(columnWidths).forEach(col => {
        doc.rect(colX, tableY, columnWidths[col], rowHeight).stroke();
        colX += columnWidths[col];
      });

      doc.font('Helvetica')
         .text(item.product_code, tableX + 2, tableY + 2, { width: columnWidths.productCode - 4 })
         .text(item.product_name, tableX + columnWidths.productCode + 2, tableY + 2, { width: columnWidths.productName - 4 })
         .text(String(item.invoice_qty), tableX + columnWidths.productCode + columnWidths.productName + 2, tableY + 2, { width: columnWidths.qty - 4, align: "right" })
         .text((item.unit_price || 0).toFixed(2), tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty + 2, tableY + 2, { width: columnWidths.price - 4, align: "right" })
         .text((item.amount || 0).toFixed(2), tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty + columnWidths.price + 2, tableY + 2, { width: columnWidths.amount - 4, align: "right" });

      tableY += rowHeight + 2;
    });

    // Totals & signatures
    tableY = checkPageBreak(tableY, 60);
    doc.fontSize(12)
       .text(`Gross Amount : ${Number(grn.gross_amount || 0).toFixed(2)}`, 350, tableY, { align: "right" })
       .moveDown(0.5)
       .text(`Discount     : ${Number(grn.discount_amount || 0).toFixed(2)}`, { align: "right" })
       .moveDown(0.5)
       .text(`Net Amount   : ${Number(grn.net_amount || 0).toFixed(2)}`, { align: "right" });

    tableY = doc.y + 40;
    tableY = checkPageBreak(tableY, 60);

    doc.fontSize(12)
       .text(`Prepared By : ${grn.login_user || "Unknown"}`, 40, tableY)
       .text("Checked By : ...................", 200, tableY)
       .text("Authorized By : ................", 380, tableY);

    doc.end();
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================================
Search GRNs
================================= */
exports.searchGrns = async (req, res) => {
  const q = req.query.query || "";
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("query", sql.VarChar, `%${q}%`)
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
   Fetch Last GRNs
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
    Fetch Single GRN with Items
================================= */
exports.getGrnByNumber = async (req, res) => {
  const { grn_no } = req.params;
  try {
    const pool = await poolPromise;

    // fetch header
    const headerResult = await pool.request()
      .input("grn_no", sql.VarChar, grn_no)
      .query(`SELECT * FROM GRN_Details WHERE grn_no = @grn_no`);

    if (headerResult.recordset.length === 0) return res.status(404).json({ message: "GRN not found" });

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
