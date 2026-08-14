
const { poolPromise, sql } = require("../db");

console.log("🔥 REPORT CONTROLLER FILE LOADED 🔥");

exports.getReports = async (req, res) => {

  console.log("🔥🔥🔥 GET REPORTS CALLED 🔥🔥🔥");

  console.log("TYPE =", req.query.type);
  console.log("FILTER MODE =", req.query.filterMode);
  console.log("FROM =", req.query.from);
  console.log("TO =", req.query.to);

  const { type, from, to, search, filterMode } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = "";
    let dateColumn = "";
    let nameColumn = "";

    /* ================= BASE QUERIES ================= */

    if (type === "customers") {
      query = `
        SELECT 
          customer_code AS customerId,
          name,
          address AS town,
          credit_amount AS creditAmount,
          status,
          route,
          balance_amount AS outstanding,
          [date]
        FROM Customer_Details
        WHERE active = 'Yes'
      `;
      dateColumn = "[date]";
      nameColumn = "name";
    }

    else if (type === "suppliers") {
      query = `
        SELECT
          sup_code AS supplierId,
          sup_name AS name,
          address,
          phone,
          advance_payment AS advancePayment,
          credit_amount AS creditAmount,
          status,
          [date]
        FROM Supplier_Details
        WHERE active = 'Yes'
      `;
      dateColumn = "[date]";
      nameColumn = "sup_name";
    }

    else if (type === "product") {
      query = `
        SELECT
          product_code,
          product_name,
          units,
          supplier_code,
          supplier_name,
          unit_cost,
          retail_price,
          whole_sale_price,
          goods_type,
          available_stock,
          real_date
        FROM Product_Details
        WHERE active = 'Yes'
      `;
      dateColumn = "real_date";
      nameColumn = "product_name";
    }

    else if (type === "sales") {
      query = `
        SELECT 
          i.invoice_no,
          i.customer_name,
          i.advance_payment,
          i.manual_bill_date,
          i.manual_bill_no,
          i.status,
          d.product_name,
          d.qty,
          d.unit_price,
          d.amount,
          d.discount_amount,
          (d.amount - d.discount_amount) AS net_amount,
          i.real_date
        FROM Invoice i
        INNER JOIN Invoice_Details d 
          ON i.invoice_no = d.invoice_no
        WHERE 1=1
      `;
      dateColumn = "i.real_date";
      nameColumn = "i.customer_name";
    }

    else if (type === "expenses") {
  query = `
    SELECT
      expencess_type,
      sub_expencess,
      [date],
      amount,
      payment_mode,
      account,
      payment_made_by,
      remarks
    FROM Expencess_Details
    WHERE 1=1
  `;
  dateColumn = "[date]";
  nameColumn = "expencess_type";
}
else if (type === "stock") {
  query = `
    SELECT
      product_code,
      product_name,
      stock_in,
      stock_out,
      available_stock,
      real_date
    FROM Stock_Details
    WHERE 1=1
  `;
  dateColumn = "real_date";
  nameColumn = "product_name";
}

else if (type === "profitloss") {

  if (!from || !to) {
    return res.status(400).json({ message: "Date range required for Profit & Loss" });
  }

  request.input("from", sql.DateTime, new Date(from + "T00:00:00"));
  request.input("to", sql.DateTime, new Date(to + "T23:59:59"));

  const result = await request.query(`

    SELECT
      -- Invoice Sales
      (SELECT ISNULL(SUM(d.amount - d.discount_amount),0)
       FROM Invoice i
       INNER JOIN Invoice_Details d ON i.invoice_no = d.invoice_no
       WHERE i.real_date BETWEEN @from AND @to) AS SalesRevenue,

      -- Customer Advance Payments
      (SELECT ISNULL(SUM(advance_payment_amount),0)
       FROM Advance_Payment_Details
       WHERE status <> 'Cancelled'
       AND real_date BETWEEN @from AND @to) AS AdvancePayments,

      -- Cheque Returns
      (SELECT ISNULL(SUM(total_amount),0)
       FROM Cheque_Return_Details
       WHERE type = 'deposit'
       AND realdate BETWEEN @from AND @to) AS ChequeReturns,

      -- Raw Materials (GRN Total)
      (SELECT ISNULL(SUM(net_amount),0)
       FROM GRN_Details
       WHERE real_date BETWEEN @from AND @to) AS RawMaterials,

      -- Operating Expenses
      (SELECT ISNULL(SUM(amount),0)
       FROM Expencess_Details
       WHERE [date] BETWEEN @from AND @to) AS TotalExpenses

  `);

  const data = result.recordset[0];

  const totalSales =
    data.SalesRevenue +
    data.AdvancePayments +
    data.ChequeReturns;

  const grossProfit = totalSales - data.RawMaterials;
  const netProfit = grossProfit - data.TotalExpenses;

  return res.json({
    salesRevenue: data.SalesRevenue,
    advancePayments: data.AdvancePayments,
    chequeReturns: data.ChequeReturns,
    rawMaterials: data.RawMaterials,
    totalSales,
    grossProfit,
    totalExpenses: data.TotalExpenses,
    netProfit
  });
}


else if (type === "bank") {

  if (filterMode === "range" && from && to) {
    request.input("from", sql.DateTime, new Date(from + "T00:00:00"));
    request.input("to", sql.DateTime, new Date(to + "T23:59:59"));
  }

  // ===== BANK TRANSACTIONS =====
  const bankResult = await request.query(`
    SELECT 
      transaction_type,
      date,
      reference_no,
      account_number,
      payment_mode,
      amount,
      description,
      status,
      bank,
      branch,
      chque_number
    FROM Bank_Details
    ${filterMode === "range" ? "WHERE realdate BETWEEN @from AND @to" : ""}
    ORDER BY realdate DESC
  `);

  // ===== BANK STATEMENT =====
  const statementResult = await request.query(`
    SELECT 
      statment_date,
      statment_reference,
      statment_amount,
      payment_mode,
      status
    FROM Bank_Statment_Details
    ${filterMode === "range" ? "WHERE realdate BETWEEN @from AND @to" : ""}
    ORDER BY realdate DESC
  `);

  // ===== CHEQUE RETURNS =====
  const chequeResult = await request.query(`
    SELECT
      cheque_no,
      date,
      bank,
      branch,
      type,
      cheque_amount,
      return_amount,
      total_amount,
      payee,
      reason,
      status,
      balance_amount
    FROM Cheque_Return_Details
    ${filterMode === "range" ? "WHERE realdate BETWEEN @from AND @to" : ""}
    ORDER BY realdate DESC
  `);

  return res.json({
    bank: bankResult.recordset,
    statement: statementResult.recordset,
    cheques: chequeResult.recordset
  });
}

else if (type === "grn") {
  query = `
    SELECT
      g.grn_no AS grn_no,
      g.supplier_code AS supplier_code,
      g.supplier_name AS supplier_name,
      g.supplier_invoice_number AS supplier_invoice_number,
      g.supplier_invoice_date AS supplier_invoice_date,

      gd.product_code AS product_code,
      gd.product_name AS product_name,
      gd.invoice_qty AS invoice_qty,
      gd.unit_price AS unit_price,
      gd.amount AS amount,

      g.gross_amount AS gross_amount,
      g.discount_amount AS discount_amount,
      g.net_amount AS net_amount,

      g.login_user AS login_user,
      g.real_date AS real_date

    FROM GRN_Details AS g

    INNER JOIN GRN_Grid_Details AS gd
      ON g.grn_no = gd.grn_no

    WHERE 1 = 1
  `;

  dateColumn = "g.real_date";
  nameColumn = "g.supplier_name";
}

else if (type === "payment") {

  query = `
    SELECT
      ps.payment_id,
      ps.ref_no AS ref_number,
      ps.paid_amount AS payment,
      ps.real_date AS setoff_real_date,
      ISNULL(ps.advance_payment, 0) AS advance_payment,

      pp.party_code,
      pp.party_name,
      pp.payable_amount,
      pp.balance_payment,
      pp.payment_date,
      pp.status

    FROM Payment_setoff AS ps

    LEFT JOIN pending_payment AS pp
      ON LTRIM(RTRIM(ps.ref_no)) =
         LTRIM(RTRIM(pp.ref_number))

    WHERE 1 = 1
  `;

  dateColumn = "ps.real_date";
  nameColumn = "pp.party_name";
}

else if (type === "returns") {

  query = `
    SELECT
      return_number,
      return_type,
      product_code,
      product_name,
      qty,
      amount,
      ref_no,
      return_date,
      reason,
      reason_other,
      remaks,
      party_code,
      party_name,
      user_name,
      real_date

    FROM Return_Details

    WHERE 1 = 1
  `;

  dateColumn = "real_date";
  nameColumn = "product_name";
}


else if (type === "employees") {

  query = `
    SELECT
      employeeNo,
      firstName,
      lastName,
      callingName,
      address,
      position,
      login_user,
      phoneNumber,
      birthday,
      active,

      LTRIM(
        STUFF(
          CASE WHEN customer_details = 1
            THEN ', Customer Details' ELSE '' END +
          CASE WHEN supplier_details = 1
            THEN ', Supplier Details' ELSE '' END +
          CASE WHEN product_details = 1
            THEN ', Product Details' ELSE '' END +
          CASE WHEN production = 1
            THEN ', Production' ELSE '' END +
          CASE WHEN grn = 1
            THEN ', GRN' ELSE '' END +
          CASE WHEN sale = 1
            THEN ', Sales' ELSE '' END +
          CASE WHEN advance_payment = 1
            THEN ', Advance Payment' ELSE '' END +
          CASE WHEN material_order = 1
            THEN ', Material Order' ELSE '' END +
          CASE WHEN goods_dispatch_note = 1
            THEN ', Goods Dispatch Note' ELSE '' END +
          CASE WHEN stock_control = 1
            THEN ', Stock Control' ELSE '' END +
          CASE WHEN payment_setoff = 1
            THEN ', Payment Setoff' ELSE '' END +
          CASE WHEN expenses = 1
            THEN ', Expenses' ELSE '' END +
          CASE WHEN bank = 1
            THEN ', Bank' ELSE '' END +
          CASE WHEN return_items = 1
            THEN ', Return' ELSE '' END +
          CASE WHEN report = 1
            THEN ', Reports' ELSE '' END +
          CASE WHEN admin = 1
            THEN ', Admin' ELSE '' END,
          1,
          2,
          ''
        )
      ) AS access

    FROM Admin_Panel

    WHERE 1 = 1
  `;

  dateColumn = "[date]";
  nameColumn = "callingName";
}


    else 
      {
      return res.status(400).json({ message: "Invalid report type" });
    }

    /* ================= DATE RANGE ================= */

 if (filterMode === "range" && from && to) {

  console.log("DATE FILTER REQUEST");
  console.log("TYPE:", type);
  console.log("FROM:", from);
  console.log("TO:", to);

  request.input(
    "fromDate",
    sql.Date,
    from
  );

  request.input(
    "toDate",
    sql.Date,
    to
  );

  query += `
    AND ${dateColumn} >= @fromDate
    AND ${dateColumn} < DATEADD(day, 1, @toDate)
  `;
}



    /* ================= SEARCH ================= */

    if (search && search.trim() !== "") {
  if (type === "sales") {
    query += ` 
      AND (i.customer_name LIKE '%' + @search + '%' 
       OR i.invoice_no LIKE '%' + @search + '%')
    `;
  } 
  else if (type === "expenses") {
    query += `
      AND (
        expencess_type LIKE '%' + @search + '%' OR
        sub_expencess LIKE '%' + @search + '%' OR
        remarks LIKE '%' + @search + '%'
      )
    `;
  }
  else if (type === "stock") {
    query += ` AND (COALESCE(product_code,'') LIKE '%' + @search + '%' 
                   OR COALESCE(product_name,'') LIKE '%' + @search + '%')`;
    
  }

  else if (type === "grn") {
  query += `
      AND (
        COALESCE(g.grn_no, '') LIKE '%' + @search + '%'
        OR COALESCE(g.supplier_code, '') LIKE '%' + @search + '%'
        OR COALESCE(g.supplier_name, '') LIKE '%' + @search + '%'
        OR COALESCE(g.supplier_invoice_number, '') LIKE '%' + @search + '%'
        OR COALESCE(gd.product_code, '') LIKE '%' + @search + '%'
        OR COALESCE(gd.product_name, '') LIKE '%' + @search + '%'
      )
    `;
}

else if (type === "returns") {

  query += `
    AND (
      COALESCE(return_number, '') LIKE '%' + @search + '%'
      OR COALESCE(return_type, '') LIKE '%' + @search + '%'
      OR COALESCE(product_code, '') LIKE '%' + @search + '%'
      OR COALESCE(product_name, '') LIKE '%' + @search + '%'
      OR COALESCE(ref_no, '') LIKE '%' + @search + '%'
      OR COALESCE(reason, '') LIKE '%' + @search + '%'
      OR COALESCE(reason_other, '') LIKE '%' + @search + '%'
      OR COALESCE(party_code, '') LIKE '%' + @search + '%'
      OR COALESCE(party_name, '') LIKE '%' + @search + '%'
      OR COALESCE(user_name, '') LIKE '%' + @search + '%'
    )
  `;
}

else if (type === "payment") {

  query += `
    AND (
      COALESCE(ps.ref_no, '') LIKE '%' + @search + '%'
      OR COALESCE(pp.party_code, '') LIKE '%' + @search + '%'
      OR COALESCE(pp.party_name, '') LIKE '%' + @search + '%'
      OR COALESCE(ps.payment_id, '') LIKE '%' + @search + '%'
    )
  `;
}


else if (type === "employees") {

  query += `
    AND (
      COALESCE(employeeNo, '') LIKE '%' + @search + '%'
      OR COALESCE(firstName, '') LIKE '%' + @search + '%'
      OR COALESCE(lastName, '') LIKE '%' + @search + '%'
      OR COALESCE(callingName, '') LIKE '%' + @search + '%'
      OR COALESCE(address, '') LIKE '%' + @search + '%'
      OR COALESCE(position, '') LIKE '%' + @search + '%'
      OR COALESCE(login_user, '') LIKE '%' + @search + '%'
      OR COALESCE(phoneNumber, '') LIKE '%' + @search + '%'
      OR COALESCE(active, '') LIKE '%' + @search + '%'
    )
  `;
}


  else {
    query += ` AND ${nameColumn} LIKE '%' + @search + '%'`;
  }

  request.input("search", sql.VarChar(100), search.trim());
}
    /* ================= ORDER ================= */

    query += ` ORDER BY ${dateColumn} DESC`;

console.log("FINAL SQL:", query);

const result = await request.query(query);

return res.json(result.recordset || []);

  } catch (err) {
    console.error("Report Error:", err);
    return res.status(500).json({ message: err.message });
  }

  
};