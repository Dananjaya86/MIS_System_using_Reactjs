const { poolPromise, sql } = require("../db");

exports.getReports = async (req, res) => {
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

    else 
      {
      return res.status(400).json({ message: "Invalid report type" });
    }

    /* ================= DATE RANGE ================= */

    if (filterMode === "range" && from && to) {
      query += ` AND ${dateColumn} BETWEEN @from AND @to`;
      request.input("from", sql.Date, new Date(from));
      request.input("to", sql.Date, new Date(to));
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