import React, { useEffect, useState } from "react";
import Menu from "../componants/Menu";
import "./report.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Namewithdateacc from "../componants/Namewithdateacc"

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportType, setReportType] = useState("customers");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all | range
const [searchText, setSearchText] = useState("");

const [products, setProducts] = useState([]);
const [customers, setCustomers] = useState([]);
const [suppliers, setSuppliers] = useState([]);



useEffect(() => {
  fetch("http://localhost:5000/api/products")
    .then(res => res.json())
    .then(data => setProducts(Array.isArray(data) ? data : data.products || []))
    .catch(() => setProducts([]));

  fetch("http://localhost:5000/api/customers")
    .then(res => res.json())
    .then(data => setCustomers(Array.isArray(data) ? data : data.customers || []))
    .catch(() => setCustomers([]));

  fetch("http://localhost:5000/api/suppliers")
    .then(res => res.json())
    .then(data => setSuppliers(Array.isArray(data) ? data : data.suppliers || []))
    .catch(() => setSuppliers([]));
}, []);

  // Column definitions matching your spec
  const REPORT_COLUMNS = {
    customers: [
      { key: "customerId", label: "Customer ID" },
      { key: "name", label: "Name" },
      { key: "town", label: "Town" },
      { key: "creditAmount", label: "Credit Amount" },
      { key: "status", label: "Status" },
      { key: "route", label: "Route" },
      { key: "outstanding", label: "Outstanding Amount" },
    ],
    suppliers: [
  { key: "supplierId", label: "Supplier Code" },
  { key: "name", label: "Supplier Name" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "advancePayment", label: "Advance Payment" },
  { key: "creditAmount", label: "Credit Amount" },
  { key: "status", label: "Status" },
  { key: "Date", label: "Date" },
],

    sales: [
  { key: "invoice_no", label: "Invoice No" },
  { key: "customer_name", label: "Customer Name" },
  { key: "advance_payment", label: "Advance Payment" },
  { key: "manual_bill_date", label: "Manual Bill Date" },
  { key: "manual_bill_no", label: "Manual Bill No" },
  { key: "status", label: "Status" },
  { key: "product_name", label: "Product Name" },
  { key: "qty", label: "Qty" },
  { key: "unit_price", label: "Unit Price" },
  { key: "amount", label: "Invoice Amount" },
  { key: "discount_amount", label: "Discount" },
  { key: "net_amount", label: "Net Amount" },
],
    expenses: [
  { key: "date", label: "Date" },
  { key: "expencess_type", label: "Expense Type" },
  { key: "sub_expencess", label: "Sub Expense" },
  { key: "amount", label: "Amount" },
  { key: "payment_mode", label: "Payment Mode" },
  { key: "account", label: "Account" },
  { key: "payment_made_by", label: "Paid By" },
  { key: "remarks", label: "Remarks" },
],

    product: [
      { key: "product_code", label: "Product Code" },
  { key: "product_name", label: "Product Name" },
  { key: "units", label: "Units" },
  { key: "supplier_code", label: "Supplier Code" },
  { key: "supplier_name", label: "Supplier Name" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "retail_price", label: "Retail Price" },
  { key: "whole_sale_price", label: "Whole Sale Price" },
  { key: "goods_type", label: "Goods Type" },
  { key: "available_stock", label: "Available Stock" },
  
    ],
    stock: [
  { key: "product_code", label: "Product Code" },
  { key: "product_name", label: "Product Name" },
  { key: "stock_in", label: "Stock In" },
  { key: "stock_out", label: "Stock Out" },
  { key: "available_stock", label: "Available Stock" },
  { key: "real_date", label: "Date" },
],

    profitloss: [
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount (Rs.)" },
  { key: "notes", label: "Notes" },
],
    bank: [
      { key: "date", label: "Date" },
      { key: "deposit", label: "Deposit" },
      { key: "type", label: "Type" },
      { key: "withdrawn", label: "Withdrawn" },
      { key: "balance", label: "Balance" },
    ],
    grn: [
      { key: "date", label: "Date" },
      { key: "supplierName", label: "Supplier Name" },
      { key: "productCode", label: "Product Code" },
      { key: "name", label: "Name" },
      { key: "stockInQty", label: "Stock In Qty" },
      { key: "amount", label: "Amount" },
    ],
    payment: [
      { key: "date", label: "Date" },
      { key: "vendorCode", label: "Vendor Code" },
      { key: "vendorName", label: "Vendor Name" },
      { key: "amount", label: "Amount" },
      { key: "mode", label: "Mode" },
      { key: "accountNumber", label: "Account Number" },
    ],
    returns: [
      { key: "date", label: "Date" },
      { key: "vendorCode", label: "Vendor Code" },
      { key: "vendorName", label: "Vendor Name" },
      { key: "itemCode", label: "Item Code" },
      { key: "name", label: "Name" },
      { key: "qty", label: "Qty" },
    ],
  };

  const columns = REPORT_COLUMNS[reportType] || [];

  const filteredRows = Array.isArray(rows)
  ? rows.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
    )
  : [];

const buildProfitLossRows = (data) => {
  if (!data) return [];

  return [
    { description: "Sales Revenue", amount: data.salesRevenue },
    { description: "Customer Advance Payments", amount: data.advancePayments },
    { description: "Cheque Returns", amount: data.chequeReturns },

    { description: "Total Sales Revenue", amount: data.totalSales },

    { description: "Less: Cost of Goods Sold", amount: "" },
    { description: "Raw Materials", amount: data.rawMaterials },
    { description: "Total Cost of Sales", amount: data.rawMaterials },

    { description: "Gross Profit", amount: data.grossProfit },

    { description: "Operating Expenses", amount: data.totalExpenses },

    { description: "Net Profit for the Period", amount: data.netProfit },
  ];
};

const displayRows =
  reportType === "profitloss"
    ? buildProfitLossRows(rows[0]) || []
    : Array.isArray(rows)
      ? rows.filter(row =>
          Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchText.toLowerCase())
          )
        )
      : [];

  // Optional: set default last 30 days on mount (frontend convenience)
  useEffect(() => {
    if (!fromDate && !toDate) {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      setFromDate(from.toISOString().slice(0, 10));
      setToDate(to.toISOString().slice(0, 10));
    }
    // eslint-disable-next-line
  }, []);

  // Fetch data only when user clicks
  async function handleGetReport() {
  setError("");
  setRows([]);
  setLoading(true);

  try {
    // Validate P&L date range
    if (reportType.toLowerCase() === "profitloss") {
      if (!fromDate || !toDate) {
        setError("Please select date range for Profit & Loss");
        setLoading(false);
        return;
      }
      setFilterMode("range"); // force range mode for P&L
    }

    // Build API URL
    let url = `/api/reports?type=${reportType.toLowerCase()}&filterMode=${filterMode}`;

    if (filterMode === "range") {
      if (!fromDate || !toDate) {
        setError("Please select date range");
        setLoading(false);
        return;
      }
      url += `&from=${fromDate}&to=${toDate}`;
    }

    if (searchText.trim()) {
      url += `&search=${encodeURIComponent(searchText.trim())}`;
    }

    const res = await fetch(`http://localhost:5000${url}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      setError(errData.message || "Server error");
      setRows([]);
      setLoading(false);
      return;
    }

    const data = await res.json();

    // ✅ Fix: set rows properly
    if (reportType.toLowerCase() === "bank") {
  setRows(data); // NOT array
} else if (reportType.toLowerCase() === "profitloss") {
  setRows([data]);
} else {
  setRows(data || []);
}

  } catch (err) {
    setError(err.message || "Server error");
  } finally {
    setLoading(false);
  }
}

  // Excel export using xlsx + file-saver
  function exportExcel() {
    if (!rows.length) return;
    // for neat headers, transform rows to include labels (optional)
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${reportType}-report-${fromDate}_to_${toDate}.xlsx`);
  }

  function setPreset(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);

  setFromDate(from.toISOString().slice(0, 10));
  setToDate(to.toISOString().slice(0, 10));
  setFilterMode("range");
}

  // Simple CSV export
  function exportCSV() {
    if (!rows.length) return;
    const keys = columns.length ? columns.map(c => c.key) : Object.keys(rows[0] || {});
    const header = columns.length ? columns.map(c => `"${c.label}"`).join(",") : keys.join(",");
    const csvRows = rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report-${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  const formatNumber = (val) => {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "number")
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // If backend sends numbers as strings
  if (!isNaN(val))
    return Number(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return val;
};
  

 function printReport() {


  if (reportType === "bank") {
  if (!rows?.bank?.length && !rows?.statement?.length && !rows?.cheques?.length) {
    return;
  }
} else {
  if (!rows.length) return;
}

  
  const doc = new jsPDF("l", "pt", "a4"); // landscape 
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.text("Milkee Foods Products", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(12);
  doc.text("Halpita, Polgasowita. T.P.0778608207", pageWidth / 2, 60, { align: "center" });

  // Title with date range
  let reportTitle = `${reportType.toUpperCase()} REPORT`;
  if (filterMode === "range" && fromDate && toDate) {
    reportTitle += ` (${fromDate} - ${toDate})`;
  } else {
    reportTitle += " (All Data)";
  }

  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(reportTitle, pageWidth - 40);
  doc.text(titleLines, pageWidth / 2, 80, { align: "center" });

  // Handle Profit & Loss separately
  if (reportType === "profitloss") {
    const data = rows[0];
    if (!data) return;

    const plRows = buildProfitLossRows(data).map(r => [
      r.description,
      r.amount ? formatNumber(r.amount) : "",
      r.notes
    ]);

    autoTable(doc, {
      startY: 110,
      head: [["Description", "Amount (Rs.)", "Notes"]],
      body: plRows,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [43, 116, 228], textColor: 255 },
    });

    doc.save(`ProfitLoss-${fromDate}-to-${toDate}.pdf`);
    return;
  }


  // ================= BANK PRINT =================
if (reportType === "bank") {

  let startY = 110;

  // LEFT TABLE
  autoTable(doc, {
    startY: startY,
    head: [["Date", "Type", "Ref No", "Account", "Amount"]],
    body: (rows.bank || []).map(r => [
      new Date(r.date).toLocaleDateString(),
      r.transaction_type,
      r.reference_no,
      r.account_number,
      formatNumber(r.amount)
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [43, 116, 228] },
    margin: { left: 20 },
    tableWidth: 350
  });

  // RIGHT TABLE
  autoTable(doc, {
    startY: startY,
    head: [["Date", "Reference", "Amount", "Mode"]],
    body: (rows.statement || []).map(r => [
      new Date(r.statment_date).toLocaleDateString(),
      r.statment_reference,
      formatNumber(r.statment_amount),
      r.payment_mode
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [43, 116, 228] },
    margin: { left: 400 },
    tableWidth: 350
  });

  // CHEQUE RETURNS
  const nextY = doc.lastAutoTable.finalY + 20;
const pageHeight = doc.internal.pageSize.getHeight();

// if near bottom → go to new page
const safeStartY  = nextY > pageHeight - 100 ? 40 : nextY;

autoTable(doc, {
  startY: safeStartY ,
  head: [["Date", "Cheque No", "Bank", "Amount", "Return", "Balance", "Reason"]],
  body: (rows.cheques || []).map(r => [
    new Date(r.date).toLocaleDateString(),
    r.cheque_no,
    r.bank,
    formatNumber(r.cheque_amount),
    formatNumber(r.return_amount),
    formatNumber(r.balance_amount),
    r.reason
  ]),
  styles: { fontSize: 9 },
  headStyles: { fillColor: [43, 116, 228] },
  theme: "grid",
  pageBreak: "auto",
  rowPageBreak: "auto"
});

  doc.save(`Bank-Report-${fromDate || "all"}_to_${toDate || "all"}.pdf`);
  return;
}



  // Prepare table
  const tableColumns = columns.map(c => ({ header: c.label, dataKey: c.key }));
  const tableRows = rows.map(r =>
    tableColumns.map(c => {
      const val = r[c.dataKey];
      // Format numbers nicely
      if (typeof val === "number") return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      // Format date if Date object or string in YYYY-MM-DD
      if (c.dataKey.toLowerCase().includes("date") && val) {
        const d = new Date(val);
        return isNaN(d) ? val : d.toLocaleDateString();
      }
      return val ?? "";
    })
  );

  autoTable(doc, {
    startY: 100,
    head: [tableColumns.map(c => c.header)],
    body: tableRows,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [43, 116, 228], textColor: 255 },
    theme: "grid",
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      // Footer
      const username = localStorage.getItem("username") || "Unknown User";
      const footerText = `Printed by: ${username} | ${new Date().toLocaleString()}`;
      doc.setFontSize(9);
      doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
    }
  });

  doc.save(`${reportType}-report-${fromDate || "all"}_to_${toDate || "all"}.pdf`);
}



  return (
    <div className="reports-root-ad">
      <aside className="reports-left-ad">
        <Menu />
      </aside>

      <main className="reports-main-ad">
        <Namewithdateacc/>
        <header className="reports-header-ad">
          <h1>Reports</h1>
        </header>

        <section className="reports-filters-ad">
  <div className="date-row-ad">

   

    {/* Dynamic label + input */}
    <label>{reportType.toUpperCase()}</label>
    <input
      type="text"
      placeholder={`Search ${reportType}`}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />

    <select
      value={reportType}
      onChange={(e) => {
        setReportType(e.target.value);
        setSearchText("");
      }}
    >
      <option value="customers">Customers</option>
      <option value="suppliers">Supplier Details</option>
      <option value="product">Product</option>
      <option value="sales">Sales</option>
      <option value="expenses">Expenses</option>
      <option value="stock">Stock</option>
      <option value="profitloss">Profit & Loss</option>
      <option value="bank">Bank Details</option>
      <option value="grn">GRN</option>
      <option value="payment">Payment</option>
      <option value="returns">Return</option>
      <option value="employees">Employees</option>
    </select>

    {/* Mode Buttons */}
    <button
      className={`btn-ghost-ad ${filterMode === "all" ? "active" : ""}`}
      onClick={() => setFilterMode("all")}
    >
      Show All
    </button>

    <button
      className={`btn-ghost-ad ${filterMode === "range" ? "active" : ""}`}
      onClick={() => setFilterMode("range")}
    >
      Date Range
    </button>

    {/* Date Inputs */}
    {filterMode === "range" && (
      <>
        <label>From</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <label>To</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </>
    )}

    <button className="btn-ad" onClick={handleGetReport} disabled={loading}>
      {loading ? "Loading..." : "Get Report"}
    </button>
  </div>

          

          <div className="preset-row-ad">
            <button onClick={() => setPreset(7)}>Last 7 days</button>
<button onClick={() => setPreset(30)}>Last 30 days</button>
<button onClick={() => setPreset(90)}>Last 90 days</button>

          </div>
        </section>

        <section className="reports-actions-ad">
          <button className="btn-ad" onClick={exportCSV} disabled={!rows.length}>Export CSV</button>
          <button className="btn-ad" onClick={exportExcel} disabled={!rows.length}>Export Excel</button>
          <button
  className="btn-ad"
  onClick={printReport}
  disabled={
    reportType === "bank"
      ? !rows?.bank?.length && !rows?.statement?.length && !rows?.cheques?.length
      : !rows.length
  }
>
  Print
</button>
        </section>

        <section className="reports-table-ad">

  {reportType === "bank" && rows?.bank ? (
    <>
      <div style={{ display: "flex", gap: "20px" }}>

        {/* LEFT - BANK DETAILS */}
        <div style={{ width: "50%" }}>
          <h3>Bank Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Ref No</th>
                <th>Account</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.bank.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.transaction_type}</td>
                  <td>{r.reference_no}</td>
                  <td>{r.account_number}</td>
                  <td>{formatNumber(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT - BANK STATEMENT */}
        <div style={{ width: "50%" }}>
          <h3>Bank Statement</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {rows.statement.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.statment_date).toLocaleDateString()}</td>
                  <td>{r.statment_reference}</td>
                  <td>{formatNumber(r.statment_amount)}</td>
                  <td>{r.payment_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* CHEQUE RETURNS */}
      <div style={{ marginTop: "30px" }}>
        <h3>Cheque Returns</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Cheque No</th>
              <th>Bank</th>
              <th>Amount</th>
              <th>Return</th>
              <th>Balance</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.cheques.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.cheque_no}</td>
                <td>{r.bank}</td>
                <td>{formatNumber(r.cheque_amount)}</td>
                <td>{formatNumber(r.return_amount)}</td>
                <td>{formatNumber(r.balance_amount)}</td>
                <td>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (

    // ✅ DEFAULT TABLE (OTHER REPORTS)
    rows && rows.length ? (
      <div className="table-wrap-ad">
        <table>
          <thead>
            <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {displayRows.map((r, idx) => (
              <tr key={idx}>
                {columns.map(c => (
                  <td key={c.key}>{formatNumber(r[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="no-data-ad">{error || "No data. Click Get Report."}</p>
    )

  )}

</section>
      </main>
    </div>
  );
}
