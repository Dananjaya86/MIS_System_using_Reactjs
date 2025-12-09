const PDFDocument = require("pdfkit");
const moment = require("moment");
const { poolPromise, sql } = require("../db");


function pad(n, width = 2) {
  return n.toString().padStart(width, "0");
}


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
      base = `${base}${Date.now().toString().slice(-4)}`; 
    }

    res.json({ dispatchNo: base });

  } catch (err) {
    console.error("generateDispatchNo error:", err);
    res.status(500).json({ error: "Failed to generate dispatch number." });
  }
};



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



exports.searchDispatches = async (req, res) => {
  const q = (req.query.q || "").trim();
  const field = (req.query.field || "all").toLowerCase();

  try {
    const pool = await poolPromise;

    let where = "";
    if (q) {
      const param = `%${q}%`;

      if (field === "vehicleno" || field === "vehicle" || field === "vehicleno") {
        where = `WHERE dn.vehicle_no LIKE @kw`;
      } else if (field === "salesrep" || field === "sales_person") {
        where = `WHERE dn.sales_person LIKE @kw`;
      } else {
       
        where = `WHERE dn.sales_person LIKE @kw OR dn.vehicle_no LIKE @kw`;
      }

      const result = await pool.request()
        .input("kw", sql.VarChar, param)
        .query(`
          SELECT DISTINCT
            dn.dispatch_no,
            dn.sales_person AS sales_person,
            dn.vehicle_no AS vehicle_no,
            CONVERT(VARCHAR(19), MIN(dn.real_date), 120) AS real_date
          FROM Dispatch_Notes dn
          ${where}
          GROUP BY dn.dispatch_no, dn.sales_person, dn.vehicle_no
          ORDER BY real_date DESC
        `);

      return res.json(result.recordset);
    } else {
      
      const result = await pool.request().query(`
        SELECT DISTINCT
          dn.dispatch_no,
          dn.sales_person AS sales_person,
          dn.vehicle_no AS vehicle_no,
          CONVERT(VARCHAR(19), MIN(dn.real_date), 120) AS real_date
        FROM Dispatch_Notes dn
        GROUP BY dn.dispatch_no, dn.sales_person, dn.vehicle_no
        ORDER BY real_date DESC
      `);
      return res.json(result.recordset);
    }

  } catch (err) {
    console.error("searchDispatches error:", err);
    res.status(500).json({ error: "Failed to search dispatches." });
  }
};




exports.generateDispatchPdf = async (req, res) => {
  const { dispatchNo } = req.params;
  if (!dispatchNo)
    return res.status(400).json({ message: "dispatchNo is required" });

  try {
    const pool = await poolPromise;

  
    const rowsRes = await pool
      .request()
      .input("dispatchNo", sql.VarChar, dispatchNo)
      .query(`
        SELECT *
        FROM Dispatch_Notes
        WHERE dispatch_no = @dispatchNo
        ORDER BY real_date, product_coe
      `);

    const items = rowsRes.recordset;
    if (!items.length) {
      return res
        .status(404)
        .json({ message: "No records found for this dispatch number" });
    }

    const master = items[0];

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const filename = encodeURIComponent(`${dispatchNo}.pdf`);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const usableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const checkPageBreak = (y, height = 30) => {
      if (y + height >= doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        return doc.y;
      }
      return y;
    };

    // HEADER
    doc.fontSize(18).font("Helvetica-Bold").text("MILKEE FOODS PRODUCTS", {
      align: "center",
    });
    doc.fontSize(11).text("Halpita, Polgasowita", { align: "center" });
    doc.text("+94 778 608 207", { align: "center" });
    doc.moveDown(1);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("GOODS DISPATCH NOTE", { align: "center", underline: true });

    doc.moveDown(1);

    // INFO BOXES
    const halfWidth = usableWidth / 2;
    const startY = doc.y;

    // LEFT BOX
    doc.font("Helvetica-Bold").fontSize(11).text("Sales Info", doc.x, startY);
    const leftFields = [
      ["Sales Representative", master.sales_person || ""],
      ["Route", master.route || ""],
      ["Vehicle No", master.vehicle_no || ""],
    ];

    let y = startY + 18;
    leftFields.forEach(([label, value]) => {
      doc.font("Helvetica").fontSize(10).text(`${label}: ${value}`, doc.x, y, { width: halfWidth - 10 });
      y += 14;
    });

    doc.roundedRect(doc.x - 4, startY - 4, halfWidth, y - startY + 6, 4).stroke();

    // RIGHT BOX
    const dispatchDate = moment(master.real_date).format("YYYY-MM-DD");
    const dispatchTime = moment(master.real_date).format("HH:mm:ss");

    const rightX = doc.page.margins.left + halfWidth + 10;
    let ry = startY;

    doc.font("Helvetica-Bold").fontSize(11).text("Dispatch Info", rightX, ry);
    ry += 18;

    const rightFields = [
      ["Dispatch No", dispatchNo],
      ["Date", dispatchDate],
      ["Time", dispatchTime],
    ];

    rightFields.forEach(([label, value]) => {
      doc.font("Helvetica").fontSize(10).text(`${label}: ${value}`, rightX, ry, { width: halfWidth - 10 });
      ry += 14;
    });

    doc.roundedRect(rightX - 4, startY - 4, halfWidth, ry - startY + 6, 4).stroke();

    // TABLE HEADER
    doc.moveDown(2);
    let tableY = Math.max(y, ry) + 10;
    const tableX = doc.page.margins.left;

    const colWidths = {
      code: 80,
      name: 200,
      avail: 60,
      price: 60,
      qty: 50,
      amount: 70,
    };

    const totalTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
    doc.font("Helvetica-Bold").fontSize(10);

    let cx = tableX;
    const headers = [
      ["Product Code", colWidths.code],
      ["Product Name", colWidths.name],
      ["Avail", colWidths.avail, "right"],
      ["Unit Price", colWidths.price, "right"],
      ["Qty", colWidths.qty, "right"],
      ["Amount", colWidths.amount, "right"],
    ];

    headers.forEach(([label, width, align]) => {
      doc.text(label, cx + 2, tableY, { width: width - 4, align: align || "left" });
      cx += width;
    });

    doc.rect(tableX - 2, tableY - 4, totalTableWidth + 4, 18).stroke();
    tableY += 20;

    // TABLE ROWS
    doc.font("Helvetica").fontSize(10);
    let totalAmount = 0;

    items.forEach((item, idx) => {
      tableY = checkPageBreak(tableY);

      const amt = Number(item.total_amount) || Number(item.qty || 0) * Number(item.unit_price || 0);
      totalAmount += amt;

      const rowHeight = 18;
      if (idx % 2 === 0) {
        doc.fillColor("#f3f3f3").rect(tableX - 2, tableY - 2, totalTableWidth + 4, rowHeight).fill();
        doc.fillColor("#000");
      }

      let colX = tableX;
      const row = [
        [item.product_coe || "", colWidths.code],
        [item.product_name || "", colWidths.name],
        [String(item.available_stock || 0), colWidths.avail, "right"],
        [Number(item.unit_price || 0).toFixed(2), colWidths.price, "right"],
        [String(item.qty || ""), colWidths.qty, "right"],
        [amt.toFixed(2), colWidths.amount, "right"],
      ];

      row.forEach(([text, width, align]) => {
        doc.text(text, colX + 2, tableY, { width: width - 4, align: align || "left" });
        colX += width;
      });

      doc.rect(tableX - 2, tableY - 2, totalTableWidth + 4, rowHeight).stroke();
      tableY += rowHeight + 4;
    });

    // TOTALS
    tableY = checkPageBreak(tableY, 40);
    doc.moveTo(tableX, tableY).lineTo(tableX + totalTableWidth, tableY).stroke();
    tableY += 8;
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Dispatch Amount:", tableX + totalTableWidth - 180, tableY, { width: 120, align: "right" });
    doc.text(totalAmount.toFixed(2), tableX + totalTableWidth - 60, tableY, { width: 60, align: "right" });

    // FOOTER
    tableY += 40;
    doc.font("Helvetica").fontSize(11);
    doc.text(`Prepared By: ${master.user_login || "Unknown"}`, tableX, tableY);
    doc.text("Checked By: -----------------", tableX + 220, tableY);
    doc.text("Authorised By: ------------", tableX + 420, tableY);

    doc.end();
  } catch (err) {
    console.error("generateDispatchPdf error:", err);
    res.status(500).json({ message: "PDF generation failed", error: err.message });
  }
};


