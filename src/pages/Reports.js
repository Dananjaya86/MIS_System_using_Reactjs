import React, { useEffect, useState } from "react";
import Menu from "../componants/Menu";
import "./report.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Column definitions matching your spec
  const REPORT_COLUMNS = {
    customers: [
      { key: "customerId", label: "Customer ID" },
      { key: "name", label: "Name" },
      { key: "town", label: "Town" },
      { key: "creditAmount", label: "Credit Amount" },
      { key: "status", label: "Status" },
      { key: "outstanding", label: "Outstanding Amount" },
    ],
    suppliers: [
      { key: "supplierId", label: "Supplier ID" },
      { key: "name", label: "Name" },
      { key: "creditAmount", label: "Credit Amount" },
      { key: "status", label: "Status" },
      { key: "outstanding", label: "Outstanding Amount" },
    ],
    sales: [
      { key: "date", label: "Date" },
      { key: "customerName", label: "Customer Name" },
      { key: "saleAmount", label: "Sale Amount" },
      { key: "returnAmount", label: "Return" },
      { key: "netSale", label: "Net Sale" },
    ],
    expenses: [
      { key: "date", label: "Date" },
      { key: "expenseType", label: "Expenses Type" },
      { key: "subExpenses", label: "Sub Expenses" },
      { key: "amount", label: "Amount" },
      { key: "user", label: "User" },
    ],
    product: [
      { key: "date", label: "Date" },
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "availableStock", label: "Available Stock" },
      { key: "salesAmount", label: "Sales Amount" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "wholeSalePrice", label: "Whole Sale Price" },
    ],
    stock: [
      { key: "date", label: "Date" },
      { key: "itemCode", label: "Item Code" },
      { key: "returnQty", label: "Return" },
      { key: "availableStock", label: "Available Stock" },
      { key: "stockIn", label: "Stock In" },
      { key: "stockOut", label: "Stock Out" },
      { key: "saleStock", label: "Sale Stock" },
    ],
    profitloss: [
      { key: "date", label: "Date" },
      { key: "sales", label: "Sales" },
      { key: "expenses", label: "Expenses" },
      { key: "profit", label: "Profit" },
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
    if (!fromDate || !toDate) {
      setError("Please select a valid date range.");
      return;
    }
    setLoading(true);
    try {
      // === CHANGE THIS URL TO YOUR BACKEND ENDPOINT ===
      // expected: GET /api/reports?type=<reportType>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>
      const url = `/api/reports?type=${encodeURIComponent(reportType)}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server ${res.status}: ${txt}`);
      }
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("API must return a JSON array.");
      setRows(json);
    } catch (err) {
      console.error("Fetch report error:", err);
      setError("Failed to load report — check console and API.");
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

  function printReport() {
    if (!rows.length) return;
    const w = window.open("", "_blank", "width=900,height=700");
    const title = `${reportType.toUpperCase()} report (${fromDate} → ${toDate})`;
    let html = `<html><head><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h3>${title}</h3>`;
    html += "<table><thead><tr>";
    columns.forEach(c => (html += `<th>${c.label}</th>`));
    html += "</tr></thead><tbody>";
    rows.forEach(r => {
      html += "<tr>";
      columns.forEach(c => (html += `<td>${r[c.key] ?? ""}</td>`));
      html += "</tr>";
    });
    html += "</tbody></table></body></html>";
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="reports-root-ad">
      <aside className="reports-left-ad">
        <Menu />
      </aside>

      <main className="reports-main-ad">
        <header className="reports-header-ad">
          <h1>Reports</h1>
        </header>

        <section className="reports-filters-ad">
          <div className="date-row-ad">
            <label>From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

            <label>To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Sales</option>
              <option value="expenses">Expenses</option>
              <option value="customers">Customers</option>
              <option value="suppliers">Suppliers</option>
              <option value="product">Product</option>
              <option value="stock">Stock</option>
              <option value="profitloss">Profit & Loss</option>
              <option value="bank">Bank Details</option>
              <option value="grn">GRN</option>
              <option value="payment">Payment</option>
              <option value="returns">Return</option>
            </select>

            <button className="btn-ad" onClick={handleGetReport} disabled={loading}>
              {loading ? "Loading..." : "Get Report"}
            </button>
          </div>

          <div className="preset-row-ad">
            <button
              className="btn-ghost-ad"
              onClick={() => {
                const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 7);
                setFromDate(from.toISOString().slice(0,10)); setToDate(to.toISOString().slice(0,10));
              }}
            >Last 7 days</button>

            <button
              className="btn-ghost-ad"
              onClick={() => {
                const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 30);
                setFromDate(from.toISOString().slice(0,10)); setToDate(to.toISOString().slice(0,10));
              }}
            >Last 30 days</button>

            <button
              className="btn-ghost-ad"
              onClick={() => {
                const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 90);
                setFromDate(from.toISOString().slice(0,10)); setToDate(to.toISOString().slice(0,10));
              }}
            >Last 90 days</button>

            <div className="msg-ad">{error}</div>
          </div>
        </section>

        <section className="reports-actions-ad">
          <button className="btn-ad" onClick={exportCSV} disabled={!rows.length}>Export CSV</button>
          <button className="btn-ad" onClick={exportExcel} disabled={!rows.length}>Export Excel</button>
          <button className="btn-ad" onClick={printReport} disabled={!rows.length}>Print</button>
        </section>

        <section className="reports-table-ad">
          {rows && rows.length ? (
            <div className="table-wrap-ad">
              <table>
                <thead>
                  <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx}>
                      {columns.map(c => <td key={c.key}>{r[c.key] ?? ""}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data-ad">No data. Click "Get Report" to load.</p>
          )}
        </section>
      </main>
    </div>
  );
}
