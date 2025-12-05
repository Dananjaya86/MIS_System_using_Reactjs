const PDFDocument = require("pdfkit");
const moment = require("moment");
const { sql, poolPromise } = require("../db");


const parseDateOrNull = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
 
  return d;
};

// ====================== CUSTOMER =========================
exports.getAllCustomers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT * FROM Customer_Details ORDER BY customer_code`);
    res.json(result.recordset);
  } catch (err) {
    console.error("getAllCustomers:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getCustomerPaymentInfo = async (req, res) => {
  const customerCode = req.params.code;

  try {
    const pool = await poolPromise;

    // Get customer details
    const customerResult = await pool.request()
      .input("code", sql.VarChar, customerCode)
      .query(`
        SELECT customer_code, name AS customer_name, credit_amount AS credit_limit
        FROM Customer_Details
        WHERE customer_code = @code
      `);

    if (customerResult.recordset.length === 0)
      return res.status(404).json({ success: false, message: "Customer not found" });

    const customer = customerResult.recordset[0];

    // Get last payment info from Payment table
    const paymentResult = await pool.request()
      .input("code", sql.VarChar, customerCode)
      .query(`
        SELECT TOP 1 balance_amount AS last_payment_amount, real_date AS last_payment_date
        FROM Payment
        WHERE party_code = @code 
        ORDER BY real_date DESC
      `);

    const lastPayment = paymentResult.recordset[0] || { last_payment_amount: 0, last_payment_date: null };

    // Get previous balance from pending_payment
    const pendingResult = await pool.request()
      .input("code", sql.VarChar, customerCode)
      .query(`
        SELECT TOP 1 balance_payment AS previous_balance
        FROM pending_payment
        WHERE party_code = @code and status='pending'
        ORDER BY real_time DESC
      `);

    const previous = pendingResult.recordset[0] || { previous_balance: 0 };

    res.json({
      success: true,
      customer: {
        customer_code: customer.customer_code,
        customer_name: customer.customer_name,
        credit_limit: customer.credit_limit || 0,
        previous_balance: previous.previous_balance || 0,
        last_payment_date: lastPayment.last_payment_date,
        last_payment_amount: lastPayment.last_payment_amount || 0,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




exports.getCustomerByCode = async (req, res) => {
  try {
    const pool = await poolPromise;
    const code = (req.params.code || "").trim();
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`SELECT * FROM Customer_Details WHERE customer_code=@code`);
    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error("getCustomerByCode:", err);
    res.status(500).json({ error: err.message });
  }
};

// ====================== PRODUCTS =========================
exports.getAllProducts = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT * FROM Product_Details ORDER BY product_code`);
    res.json(result.recordset);
  } catch (err) {
    console.error("getAllProducts:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProductByCode = async (req, res) => {
  try {
    const pool = await poolPromise;
    const code = (req.params.code || "").trim();
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`SELECT * FROM Product_Details WHERE product_code=@code`);
    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error("getProductByCode:", err);
    res.status(500).json({ error: err.message });
  }
};

// ====================== INVOICE =========================
exports.generateInvoiceNumber = async (req, res) => {
  try {
    const { type } = req.query; // cash or credit
    if (!type) return res.status(400).json({ error: "Missing invoice type" });

    const prefix = type === "cash" ? "INVCA" : "INVCR";
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    const pool = await poolPromise;
    const result = await pool.request()
      .input("prefix", sql.VarChar, prefix + year + month)
      .query(`
        SELECT TOP 1 invoice_no
        FROM Invoice
        WHERE invoice_no LIKE @prefix + '%'
        ORDER BY invoice_no DESC
      `);

    let serial = 1;
    if (result.recordset.length > 0) {
      const last = result.recordset[0].invoice_no;
      // assume serial is last 4 chars
      const lastSerial = parseInt(last.slice(-4));
      if (!isNaN(lastSerial)) serial = lastSerial + 1;
    }

    const newInv = `${prefix}${year}${month}${serial.toString().padStart(4, "0")}`;
    res.json({ invoice_no: newInv });
  } catch (err) {
    console.error("generateInvoiceNumber:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.saveInvoice = async (req, res) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    const {
      invoice_no,
      customer,
      total,
      items,
      invoiceData = {},
      userLogin = "system",
    } = req.body;

    if (!invoice_no || !customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing invoice data (invoice_no, customer, items required)" });
    }

    
    const customerName = invoiceData.customerName || req.body.customerName || "";
    const manualBillDate = parseDateOrNull(invoiceData.manualBillDate || invoiceData.date || null);
    const manualBillNo = invoiceData.manualBillNo || invoiceData.manualBillNo || null;
    const advancePayment = parseFloat(invoiceData.advancePayment || 0) || 0;
    const returnAmount = parseFloat(invoiceData.returnAmount || 0) || 0;
    const previousAmount = parseFloat(invoiceData.previousAmount || 0) || 0;
    const creditLimit = parseFloat(invoiceData.creditLimit || 0) || 0;
    const status = invoiceData.status || "GOOD";
    const lastPaymentDate = parseDateOrNull(invoiceData.lastPaymentDate || null);
    const lastPaymentAmount = parseFloat(invoiceData.lastPaymentAmount || 0) || 0;

    
    const computedTotalAmount = items.reduce((s, it) => s + ((Number(it.qty) || 0) * (Number(it.price) || 0)), 0);
    const computedDiscount = items.reduce((s, it) => s + (Number(it.discountValue) || 0), 0);
    const totalAmount = parseFloat(invoiceData.totalAmount || computedTotalAmount) || computedTotalAmount;
    const discountAmount = parseFloat(invoiceData.totalDiscount || computedDiscount) || computedDiscount;
    const totalInvoiceAmount = parseFloat(invoiceData.totalInvoice || total || (totalAmount - discountAmount)) || (totalAmount - discountAmount);

    
    const totalRecoverableAmount = parseFloat(invoiceData.totalRecoverableAmount ||
      (previousAmount + totalInvoiceAmount - returnAmount)) || (previousAmount + totalInvoiceAmount - returnAmount);

    
    await transaction.begin();
    const request = new sql.Request(transaction);

    
    await request
      .input("invoice_no", sql.VarChar, invoice_no)
      .input("customer_code", sql.VarChar, customer)
      .input("customer_name", sql.VarChar, customerName)
      .input("advance_payment", sql.Decimal(18, 2), advancePayment)
      .input("manual_bill_date", sql.Date, manualBillDate)
      .input("manual_bill_no", sql.VarChar, manualBillNo)
      .input("status", sql.VarChar, status)
      .input("credit_limit", sql.Decimal(18, 2), creditLimit)
      .input("return_amount", sql.Decimal(18, 2), returnAmount)
      .input("total_recovarable_amount", sql.Decimal(18, 2), totalRecoverableAmount)
      .input("last_payment_date", sql.Date, lastPaymentDate)
      .input("last_payment_amount", sql.Decimal(18, 2), lastPaymentAmount)
      .input("total_amount", sql.Decimal(18, 2), totalAmount)
      .input("discount_amount", sql.Decimal(18, 2), discountAmount)
      .input("total_invoice_amount", sql.Decimal(18, 2), totalInvoiceAmount)
      .input("user_login", sql.VarChar, userLogin)
      .input("real_date", sql.DateTime, new Date())
      .query(`
        INSERT INTO Invoice
          (invoice_no, customer_code, customer_name, advance_payment, manual_bill_date, manual_bill_no,
           status, credit_limit, return_amount, total_recovarable_amount, last_payment_date, last_payment_amount,
           total_amount, discount_amount, total_invoice_amount, user_login, real_date)
        VALUES
          (@invoice_no, @customer_code, @customer_name, @advance_payment, @manual_bill_date, @manual_bill_no,
           @status, @credit_limit, @return_amount, @total_recovarable_amount, @last_payment_date, @last_payment_amount,
           @total_amount, @discount_amount, @total_invoice_amount, @user_login, @real_date)
      `);

    
for (let item of items) {

  const pcode = item.productCode || item.product_code || "";
  const pname = item.productName || item.product_name || "";
  const qty = Number(item.qty || 0);
  const unitPrice = parseFloat(item.price || item.unit_price || item.unitPrice || 0) || 0;
  const discountAmt = parseFloat(item.discountValue || item.discount_amount || 0) || 0;
  const amount = parseFloat(item.lineAmount || item.amount || (qty * unitPrice - discountAmt)) || (qty * unitPrice - discountAmt);

  // IMPORTANT: NEW Request for each loop
  const req1 = new sql.Request(transaction);

  // Get latest stock
  const prevStockRes = await req1
    .input("pcode", sql.VarChar, pcode)
    .query(`
      SELECT TOP 1 available_stock
      FROM Stock_Details
      WHERE product_code = @pcode
      ORDER BY real_date DESC, product_code DESC
    `);

  let prevAvailable = 0;
  if (prevStockRes.recordset.length > 0) {
    prevAvailable = Number(prevStockRes.recordset[0].available_stock || 0);
  }

  if (qty > prevAvailable) {
    await transaction.rollback();
    return res.status(400).json({
      success: false,
      message: `No enough stock to issue for product ${pcode}. Available: ${prevAvailable}, requested: ${qty}`
    });
  }

  const newAvailable = prevAvailable - qty;

  // New request for insert detail
  const req2 = new sql.Request(transaction);
  await req2
    .input("inv_no", sql.VarChar, invoice_no)
    .input("cust_code", sql.VarChar, customer)
    .input("prod_code", sql.VarChar, pcode)
    .input("prod_name", sql.VarChar, pname)
    .input("unit_price", sql.Decimal(18, 2), unitPrice)
    .input("qty", sql.Float, qty)
    .input("discount_amount", sql.Decimal(18, 2), discountAmt)
    .input("amount", sql.Decimal(18, 2), amount)
    .query(`
      INSERT INTO Invoice_Details
        (invoice_no, customer_code, product_code, product_name, unit_price, qty, discount_amount, amount)
      VALUES
        (@inv_no, @cust_code, @prod_code, @prod_name, @unit_price, @qty, @discount_amount, @amount)
    `);

  // New request for stock movement
  const req3 = new sql.Request(transaction);
  await req3
    .input("sd_prod_code", sql.VarChar, pcode)
    .input("sd_prod_name", sql.VarChar, pname)
    .input("sd_stock_in", sql.Float, 0)
    .input("sd_stock_out", sql.Float, qty)
    .input("sd_available", sql.Float, newAvailable)
    .input("sd_login_user", sql.VarChar, userLogin)
    .input("sd_real_date", sql.DateTime, new Date())
    .query(`
      INSERT INTO Stock_Details
        (product_code, product_name, stock_in, stock_out, available_stock, login_user, real_date)
      VALUES
        (@sd_prod_code, @sd_prod_name, @sd_stock_in, @sd_stock_out, @sd_available, @sd_login_user, @sd_real_date)
    `);
}

    // 3) Insert into pending_payment (if recoverable > 0)
    if ((totalRecoverableAmount || 0) > 0) {
      await request
        .input("ref_number", sql.VarChar, invoice_no)
        .input("party_code", sql.VarChar, customer)
        .input("party_name", sql.VarChar, customerName)
        .input("payable_amount", sql.Decimal(18, 2), totalRecoverableAmount)
        .input("payment", sql.Decimal(18, 2), 0)
        .input("balance_payment", sql.Decimal(18, 2), totalRecoverableAmount)
        .input("payment_date", sql.Date, null)
        .input("pp_status", sql.VarChar, 'pending') 
        .input("login_user", sql.VarChar, userLogin)
        .input("real_time", sql.DateTime, new Date())
        .query(`
          INSERT INTO pending_payment
            (ref_number, party_code, party_name, payable_amount, payment, balance_payment, payment_date, status, login_user, real_time)
          VALUES
            (@ref_number, @party_code, @party_name, @payable_amount, @payment, @balance_payment, @payment_date, @pp_status, @login_user, @real_time)
        `);
    }

    // 4) Update Customer_Details.status (if provided)
    if (typeof status !== "undefined" && status !== null) {
      await request
        .input("cust_code_u", sql.VarChar, customer)
        .input("cust_status_u", sql.VarChar, status)
        .query(`
          UPDATE Customer_Details
          SET status = @cust_status_u
          WHERE customer_code = @cust_code_u
        `);
    }

    // 5) Insert into Login_Ledger
    await request
      .input("lg_code", sql.VarChar, invoice_no)
      .input("lg_active", sql.VarChar, "yes")
      .input("lg_action", sql.VarChar, "Save")
      .input("lg_login_user", sql.VarChar, userLogin)
      .input("lg_date", sql.DateTime, new Date())
      .query(`
        INSERT INTO Login_Ledger
          (code, active, action, login_user, date)
        VALUES
          (@lg_code, @lg_active, @lg_action, @lg_login_user, @lg_date)
      `);

    
    await transaction.commit();

    return res.json({ success: true, message: "Invoice saved successfully", invoice_no });
  } catch (err) {
    console.error("saveInvoice error:", err);
    try {
      await transaction.rollback();
    } catch (rbErr) {
      console.error("rollback error:", rbErr);
    }
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

exports.searchInvoices = async (req, res) => {
  const query = req.query.q || ""; 
  
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("query", sql.VarChar, `%${query}%`)
      .query(`
        SELECT invoice_no, customer_code, customer_name, total_invoice_amount, manual_bill_date
        FROM Invoice
        WHERE invoice_no LIKE @query OR customer_name LIKE @query
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Invoice search error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};




exports.getInvoiceDetails = async (req, res) => {
  const invoiceNo = req.params.invoiceNo;

  try {
    const pool = await poolPromise;

    // ------------------- 1. Load invoice master -------------------
    const masterResult = await pool.request()
      .input("invoiceNo", sql.VarChar, invoiceNo)
      .query(`
        SELECT *
        FROM Invoice
        WHERE invoice_no = @invoiceNo
      `);

    const master = masterResult.recordset[0];

    if (!master) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }


    // ------------------- 2. Load invoice items -------------------
    const itemsResult = await pool.request()
      .input("invoiceNo", sql.VarChar, invoiceNo)
      .query(`
        SELECT *
        FROM Invoice_Details
        WHERE invoice_no = @invoiceNo
      `);


    // ------------------- 3. Load previous pending balance -------------------
    const pendingResult = await pool.request()
      .input("invoiceNo", sql.VarChar, invoiceNo)
      .query(`
        SELECT TOP 1 balance_payment, payment_date
        FROM pending_payment
        WHERE ref_number = @invoiceNo
        ORDER BY payment_date DESC
      `);

    const pending = pendingResult.recordset[0] || { balance_payment: 0, payment_date: null };

    const previousAmount = pending.balance_payment || 0;
    const lastPaymentDate = pending.payment_date || null;

    // ------------------- 4. Send final -------------------
    res.json({
      master,
      items: itemsResult.recordset,

      
      previousAmount,
      lastPaymentDate,
    });

  } catch (err) {
    console.error("getInvoiceDetails ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateInvoicePdf = async (req, res) => {
  const { invoiceNo } = req.params;

  try {
    const pool = await poolPromise;

    // Fetch invoice master data
    const headerRes = await pool.request()
      .input("invoiceNo", sql.VarChar, invoiceNo)
      .query(`SELECT TOP 1 * FROM Invoice WHERE invoice_no = @invoiceNo`);

    if (!headerRes.recordset.length)
      return res.status(404).json({ message: "Invoice not found" });

    const invoice = headerRes.recordset[0];

    // Fetch invoice details (grid)
    const gridRes = await pool.request()
      .input("invoiceNo", sql.VarChar, invoiceNo)
      .query(`SELECT * FROM Invoice_Details WHERE invoice_no = @invoiceNo`);

    const items = gridRes.recordset;

    // Fetch customer info
    const customerRes = await pool.request()
      .input("customerCode", sql.VarChar, invoice.customer_code)
      .query(`SELECT TOP 1 * FROM Customer_Details WHERE customer_code = @customerCode`);

    const customer = customerRes.recordset[0] || {};

    // Initialize PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const filename = encodeURIComponent(`${invoiceNo}.pdf`);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const checkPageBreak = (currentY, rowHeight = 20) => {
      if (currentY + rowHeight > doc.page.height - 80) {
        doc.addPage();
        return doc.y;
      }
      return currentY;
    };

    // Header
    doc.fontSize(20).text("MILKEE FOODS PRODUCT", { align: "center" }).moveDown(0.3);
    doc.fontSize(12).text("Halpita, Polgasowita", { align: "center" });
    doc.text("+94 778 608 207", { align: "center" }).moveDown(1);
    doc.fontSize(16).text("SALES INVOICE", { align: "center", underline: true }).moveDown(1);

    // Customer Box
    const boxX = 40, boxWidth = 250, padding = 8;
    const startY = doc.y;

    doc.fontSize(12).text("Customer Details", boxX + padding, startY, { underline: true });

    const customerFields = [
      { label: "Customer Code", value: invoice.customer_code || "" },
      { label: "Customer Name", value: invoice.customer_name || "" },
      { label: "Address", value: customer.address || "" },
      { label: "Phone", value: customer.phone || "" },
      { label: "Route", value:customer.route || ""},
    ];

    let currentY = startY + 20;
    let totalHeight = 0;
    customerFields.forEach(f =>
      totalHeight += doc.heightOfString(`${f.label}: ${f.value}`, {
        width: boxWidth - padding * 2
      }) + 4
    );

    doc.roundedRect(boxX, startY - 5, boxWidth, totalHeight + 10, 6).stroke();

    currentY = startY + 20;
    customerFields.forEach(f => {
      const h = doc.heightOfString(`${f.label}: ${f.value}`, { width: boxWidth - padding * 2 });
      doc.fontSize(10).text(`${f.label}: ${f.value}`, boxX + padding, currentY, {
        width: boxWidth - padding * 2
      });
      currentY += h + 4;
    });

    // Invoice Details (Right Box)
    const rightBoxX = 320, rightBoxWidth = 250;
    doc.fontSize(12).text("Invoice Details", rightBoxX + padding, startY, { underline: true });

    const invoiceFields = [
      { label: "Invoice No", value: invoice.invoice_no },
      { label: "Invoice Date", value: moment(invoice.manual_bill_date).format("YYYY-MM-DD") },
      { label: "Manual Bill No", value: invoice.manual_bill_no || "" },
    ];

    let rightY = startY + 20;
    invoiceFields.forEach(f => {
      const h = doc.heightOfString(`${f.label}: ${f.value}`, { width: rightBoxWidth - padding * 2 });
      doc.fontSize(10).text(`${f.label}: ${f.value}`, rightBoxX + padding, rightY, {
        width: rightBoxWidth - padding * 2
      });
      rightY += h + 4;
    });

    doc.roundedRect(rightBoxX, startY - 5, rightBoxWidth, rightY - startY + 10, 6).stroke();

    // Table Header
    let tableY = Math.max(currentY, rightY) + 10;
    const tableX = 40;
    const columnWidths = {
      productCode: 90,
      productName: 140,
      qty: 60,
      price: 80,
      amount: 80
    };

    const headers = ["Product Code", "Product Name", "Qty", "Unit Price", "Amount"];
    const positions = [
      tableX,
      tableX + columnWidths.productCode,
      tableX + columnWidths.productCode + columnWidths.productName,
      tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty,
      tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty + columnWidths.price
    ];

    headers.forEach((header, i) => {
      doc.fontSize(10).font("Helvetica-Bold")
        .text(header, positions[i] + 2, tableY, {
          width: Object.values(columnWidths)[i],
          align: "left"
        });
    });

    doc.rect(tableX, tableY - 2, Object.values(columnWidths).reduce((a, b) => a + b, 0), 20).stroke();
    tableY += 22;

    // Table Rows
    items.forEach((item, index) => {
      tableY = checkPageBreak(tableY, 20);
      const rowHeight = Math.max(
        doc.heightOfString(item.product_name || "", { width: columnWidths.productName }) + 8,
        20
      );

      if (index % 2 === 0) {
        doc.fillColor("#f0f0f0")
          .rect(tableX, tableY, Object.values(columnWidths).reduce((a, b) => a + b, 0), rowHeight)
          .fill();
        doc.fillColor("#000");
      }

      let colX = tableX;
      Object.keys(columnWidths).forEach(col => {
        doc.rect(colX, tableY, columnWidths[col], rowHeight).stroke();
        colX += columnWidths[col];
      });

      doc.font("Helvetica")
        .text(item.product_code, tableX + 2, tableY + 2, { width: columnWidths.productCode - 4 })
        .text(item.product_name, tableX + columnWidths.productCode + 2, tableY + 2, {
          width: columnWidths.productName - 4
        })
        .text(String(item.qty), tableX + columnWidths.productCode + columnWidths.productName + 2, tableY + 2, {
          width: columnWidths.qty - 4,
          align: "right"
        })
        .text((item.unit_price || 0).toFixed(2), tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty + 2, tableY + 2, {
          width: columnWidths.price - 4,
          align: "right"
        })
        .text((item.amount || 0).toFixed(2), tableX + columnWidths.productCode + columnWidths.productName + columnWidths.qty + columnWidths.price + 2, tableY + 2, {
          width: columnWidths.amount - 4,
          align: "right"
        });

      tableY += rowHeight + 2;
    });

    //  Totals Section (Updated)
    tableY = checkPageBreak(tableY, 80);

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text(`Total Amount        : ${Number(invoice.total_amount || 0).toFixed(2)}`, 350, tableY, { align: "right" });

    tableY += 18;
    doc.text(`Discount Amount  : ${Number(invoice.discount_amount || 0).toFixed(2)}`, 350, tableY, { align: "right" });

    tableY += 18;
    doc.text(  `Return Amount  : ${Number(invoice.return_amount || 0).toFixed(2)}`,350, tableY, { align: "right" });

    tableY += 18;
    doc.text(`Invoice Total Amount : ${Number(invoice.total_invoice_amount || 0).toFixed(2)}`, 350, tableY, { align: "right" });

    tableY += 30;

    //  Recoverable Amount Message
    doc.fontSize(12).font("Helvetica");
    doc.text(
      `You have pay Total recoverable amount is : ${Number(invoice.total_recovarable_amount || 0).toFixed(2)}. Please settle this amount on next visit.`,
      40,
      tableY,
      { width: 500 }
    );

    tableY += 40;

    //  Cheque Message
    doc.fontSize(12).font("Helvetica-Oblique");
    doc.text(
      `If you made payment by cheque please draw in favour of "Milkee Foods Products"`,
      40,
      tableY,
      { width: 500 }
    );

    tableY += 50;

    // Signatures
    doc.fontSize(12).font("Helvetica");
    doc.text(`Prepared By : ${invoice.user_login || "Unknown"}`, 40, tableY);
    doc.text("Checked By : ...................", 220, tableY);
    doc.text("Authorized By : ................", 400, tableY);

    // END PDF
    doc.end();

  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).json({ message: err.message });
  }
};






