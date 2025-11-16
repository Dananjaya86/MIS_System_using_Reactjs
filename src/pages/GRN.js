import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Menu from "../componants/Menu";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBox from "../componants/Alertboxre";
import "./grn.css";

export default function GRN() {
  const printRef = useRef();

  const defaultForm = {
    grnNo: "",
    supplierCode: "",
    supplierName: "",
    invoiceNo: "",
    date: "",
    productCode: "",
    productName: "",
    invoiceQty: "",
    unitPrice: "",
    totalAmount: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [rows, setRows] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [lastRecords, setLastRecords] = useState([]);
  const [mode, setMode] = useState("view");
  const [alert, setAlert] = useState({ show: false, type: "info", title: "", message: "" });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [rowLimit, setRowLimit] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [supplierList, setSupplierList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [readOnlyForm, setReadOnlyForm] = useState(false);

  const showAlert = (type, title, message) => setAlert({ show: true, type, title, message });

  // Generate new GRN number
  const fetchNextGrnNumber = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grn/new-number");
      const data = await res.json();
      setForm((prev) => ({ ...prev, grnNo: data.grn_no }));
    } catch {
      showAlert("error", "Error", "Unable to generate GRN number");
    }
  };

  // Supplier search
  const searchSuppliers = async (query) => {
    if (!query) return setSupplierList([]);
    try {
      const res = await fetch(`http://localhost:5000/api/grn/suppliers?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSupplierList(data);
    } catch (err) {
      console.error("Supplier search failed", err);
    }
  };

  // Product search
  const searchProducts = async (query) => {
    if (!query) return setProductList([]);
    try {
      const res = await fetch(`http://localhost:5000/api/grn/products?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setProductList(data);
    } catch (err) {
      console.error("Product search failed", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "supplierCode" || name === "supplierName") searchSuppliers(value);
    if (name === "productCode" || name === "productName") searchProducts(value);
  };

  const handleSelectSupplier = (sup) => {
    setForm((prev) => ({ ...prev, supplierCode: sup.sup_code, supplierName: sup.sup_name }));
    setSupplierList([]);
  };

  const handleSelectProduct = (prod) => {
    setForm((prev) => ({ ...prev, productCode: prod.product_code, productName: prod.product_name }));
    setProductList([]);
  };

  // Auto-calc totalAmount
  useEffect(() => {
    const qty = parseFloat(form.invoiceQty) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    setForm((prev) => ({ ...prev, totalAmount: (qty * price).toFixed(2) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.invoiceQty, form.unitPrice]);

  // Add new row
  const handleAddRow = () => {
    if (!form.productCode || !form.invoiceQty || !form.unitPrice) {
      showAlert("error", "Error", "Please enter product details first");
      return;
    }
    const newRow = { ...form, id: rows.length + 1 };
    setRows([...rows, newRow]);
    clearProductFields();
  };

  const handleRowClick = (row, index) => {
    if (readOnlyForm) return;
    setEditingIndex(index);
    setForm({ ...row });
    setMode("edit");
  };

  const handleUpdateRow = () => {
    const updated = [...rows];
    updated[editingIndex] = { ...form, id: updated[editingIndex].id };
    setRows(updated);
    setEditingIndex(null);
    clearProductFields();
    setMode("add");
  };

  const handleNew = () => {
    setMode("add");
    setRows([]);
    setDiscount(0);
    setForm(defaultForm);
    setReadOnlyForm(false);
    fetchNextGrnNumber();
  };

  const handleSave = async () => {
  if (rows.length === 0) {
    showAlert("error", "Error", "No rows to save");
    return;
  }

  try {
    const gross = Number(grossTotal) || 0;
    const disc = Number(discount) || 0;
    const net = Number(netTotal) || 0;
    const username = localStorage.getItem("username");

    // 1️⃣ Save GRN Header
    const saveHeaderRes = await fetch("http://localhost:5000/api/grn/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grn_no: form.grnNo,
        supplier_code: form.supplierCode,
        supplier_name: form.supplierName,
        supplier_invoice_number: form.invoiceNo,
        supplier_invoice_date: form.date,
        gross_amount: gross.toFixed(2),
        discount_amount: disc.toFixed(2),
        net_amount: net.toFixed(2),
        login_user: username || "Unknown",
      }),
    });
    const headerData = await saveHeaderRes.json();
    if (!headerData.success) throw new Error(headerData.message || "Failed to save GRN header");

    // 2️⃣ Save GRN Grid Rows
    for (let row of rows) {
      await fetch("http://localhost:5000/api/grn/save-grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grn_no: form.grnNo,
          product_code: row.productCode,
          product_name: row.productName,
          invoice_qty: Number(row.invoiceQty) || 0,
          unit_price: Number(row.unitPrice) || 0,
          amount: Number(row.totalAmount) || 0,
        }),
      });
    }

    // 3️⃣ Fetch latest pending payment balance
    const pendingRes = await fetch(`http://localhost:5000/api/grn/pending/${form.supplierCode}`);
    const pendingData = await pendingRes.json();
    const latestBalance = pendingData?.balance_payment || net;

    // 4️⃣ Show success alert with balance
    showAlert(
      "success",
      "GRN Saved",
      `GRN and details saved successfully!\nCurrent Pending Balance for ${form.supplierName}: ${latestBalance.toFixed(2)}`
    );

    // 5️⃣ Reset form & reload last records
    setRows([]);
    setMode("view");
    setForm(defaultForm);
    setDiscount(0);
    setReadOnlyForm(false);
    fetchLastRecords();
  } catch (err) {
    console.error("GRN Save Error:", err);
    showAlert("error", "Error", err.message || "Failed to save GRN");
  }
};


  const clearProductFields = () => {
    setForm({ ...form, productCode: "", productName: "", invoiceQty: "", unitPrice: "", totalAmount: "" });
  };

  const handleClear = () => {
    setForm(defaultForm);
    setRows([]);
    setDiscount(0);
    setReadOnlyForm(false);
  };

  const handleExit = () => {
    setMode("view");
    setForm(defaultForm);
    setRows([]);
    setReadOnlyForm(false);
  };

  const fetchLastRecords = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grn/search?query=");
      const data = await res.json();
      const sortedData = data.sort((a, b) => b.grn_no.localeCompare(a.grn_no));
      setLastRecords(sortedData.slice(0, rowLimit));
    } catch (err) {
      console.error("Failed to fetch latest GRNs", err);
    }
  };

  useEffect(() => {
    fetchLastRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowLimit]);

  const grossTotal = rows.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);
  const netTotal = grossTotal - parseFloat(discount || 0);

  const handleSearch = async (query) => {
    try {
      const res = await fetch(`http://localhost:5000/api/grn/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.sort((a, b) => b.grn_no.localeCompare(a.grn_no)));
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const handleViewPdf = (grn_no) => window.open(`http://localhost:5000/api/grn/pdf/${grn_no}`, "_blank");
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const handleLoadSavedGrn = async (grn_no) => {
    try {
      const res = await fetch(`http://localhost:5000/api/grn/${grn_no}`);
      const data = await res.json();

      if (!data.header) {
        showAlert("error", "Error", "GRN not found");
        return;
      }

      const header = data.header;
      const items = data.items || [];

      setForm({
        grnNo: header.grn_no,
        supplierCode: header.supplier_code,
        supplierName: header.supplier_name,
        invoiceNo: header.supplier_invoice_number,
        date: header.supplier_invoice_date,
        productCode: "",
        productName: "",
        invoiceQty: "",
        unitPrice: "",
        totalAmount: "",
      });
      setDiscount(Number(header.discount_amount) || 0);
      setRows(items);
      setMode("view");
      setReadOnlyForm(true);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", "Failed to load GRN");
    }
  };

  return (
    <div className="layout">
      <div className="menu-wrap"><Menu /></div>
      <div className="page">
        <Namewithdateacc />
        <h2 className="header">Goods Receive Note</h2>

        {/* FORM */}
        <div className="form-container">
          <div className="form-left">
            <label>GRN No</label>
            <input name="grnNo" value={form.grnNo} readOnly />
            <label>Supplier Code</label>
            <input name="supplierCode" value={form.supplierCode} onChange={handleChange} readOnly={readOnlyForm} />
            {supplierList.length > 0 && !readOnlyForm && (
              <ul className="dropdown-list">
                {supplierList.map((s, i) => (
                  <li key={i} onClick={() => handleSelectSupplier(s)}>
                    {s.sup_code} - {s.sup_name}
                  </li>
                ))}
              </ul>
            )}
            <label>Supplier Name</label>
            <input name="supplierName" value={form.supplierName} onChange={handleChange} readOnly={readOnlyForm} />
            <label>Invoice No</label>
            <input name="invoiceNo" value={form.invoiceNo} onChange={handleChange} readOnly={readOnlyForm} />
            <label>Invoice Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} readOnly={readOnlyForm} />
          </div>

          <div className="form-right">
            <label>Product Code</label>
            <input name="productCode" value={form.productCode} onChange={handleChange} readOnly={readOnlyForm} />
            {productList.length > 0 && !readOnlyForm && (
              <ul className="dropdown-list">
                {productList.map((p, i) => (
                  <li key={i} onClick={() => handleSelectProduct(p)}>
                    {p.product_code} - {p.product_name}
                  </li>
                ))}
              </ul>
            )}
            <label>Product Name</label>
            <input name="productName" value={form.productName} onChange={handleChange} readOnly={readOnlyForm} />
            <label>Invoice Qty</label>
            <input name="invoiceQty" value={form.invoiceQty} onChange={handleChange} readOnly={readOnlyForm} />
            <label>Unit Price</label>
            <input name="unitPrice" value={form.unitPrice} onChange={handleChange} readOnly={readOnlyForm} />
            <label>Total Amount</label>
            <input name="totalAmount" value={form.totalAmount} readOnly />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="button-bar">
          {mode === "view" && (
            <>
              <button className="btngrnnew" onClick={handleNew}>New</button>
              <button className="btngrnexit" onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "add" && !readOnlyForm && (
            <>
              <button className="btngrnsave" onClick={handleAddRow}>Add</button>

              {/* Save button only if rows exist */}
              {rows.length > 0 && (
                <button className="btngrnsave" onClick={() => setShowSaveConfirm(true)}>
                  Save
                </button>
              )}

              <button className="btngrnclear" onClick={handleClear}>Clear</button>
              <button className="btngrnexit" onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "edit" && !readOnlyForm && (
            <>
              <button className="btngrnsave" onClick={handleUpdateRow}>Update</button>
              <button className="btngrnclear" onClick={clearProductFields}>Cancel</button>
            </>
          )}
        </div>

        {/* FIRST GRID */}
        {rows.length > 0 && (
          <table className="data-grid">
            <thead>
              <tr>
                <th>ID</th><th>Product Code</th><th>Name</th><th>Qty</th><th>Unit Price</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} onClick={() => handleRowClick(r, i)}>
                  <td>{r.id}</td>
                  <td>{r.productCode}</td>
                  <td>{r.productName}</td>
                  <td>{r.invoiceQty}</td>
                  <td>{r.unitPrice}</td>
                  <td>{r.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="totals">
          <p>Gross Total: <b>{grossTotal.toFixed(2)}</b></p>
          <p>Discount:
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} readOnly={readOnlyForm} style={{ width: "100px", marginLeft: "10px" }} />
          </p>
          <p>Net Total: <b>{netTotal.toFixed(2)}</b></p>
        </div>

        {/* SEARCH BAR */}
        <div className="search-bar">
          <input placeholder="Search GRN..." onChange={(e) => handleSearch(e.target.value)} />
          <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)}>
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={30}>30 Rows</option>
          </select>
        </div>

        {/* SECOND GRID */}
        <h3>Latest GRNs</h3>
        <table className="data-grid">
          <thead>
            <tr>
              <th>GRN No</th><th>Supplier</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(searchResults.length > 0 ? searchResults : lastRecords).map((grn, i) => (
              <tr key={i}>
                <td>{grn.grn_no}</td>
                <td>{grn.supplier_name}</td>
                <td>{new Date(grn.real_date).toLocaleDateString()}</td>
                <td>
                  <button className="printgrid" onClick={() => handleViewPdf(grn.grn_no)}>View PDF</button>
                  <button className="printgrid" onClick={() => handleLoadSavedGrn(grn.grn_no)}>Load</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ALERT BOX */}
        <AlertBox {...alert} onClose={() => setAlert({ ...alert, show: false })} />

        {/* Save confirmation alert */}
        <AlertBox
          show={showSaveConfirm}
          type="question"
          title="Confirm Save"
          message="Do you really want to save this GRN?"
          onClose={() => setShowSaveConfirm(false)}
          onConfirm={() => {
            setShowSaveConfirm(false);
            handleSave();
          }}
        />
      </div>
    </div>
  );
}
