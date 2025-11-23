// src/pages/Sales.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import Menu from "../componants/Menu";
import AlertBox from "../componants/Alertboxre";
import Namewithdateacc from "../componants/Namewithdateacc";
import "./sales.css";

const API = "http://localhost:5000/api";

export default function SalesPage() {
  const [saleType, setSaleType] = useState("cash");
  const [formData, setFormData] = useState({});
  const [tempData, setTempData] = useState([]);
  const [isNew, setIsNew] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState("");

  const [alertState, setAlertState] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null
  });

  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [productSuggestions] = useState([]);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);

  const customerRef = useRef();
  const productRef = useRef();

  const showAlert = (type, title, message, onConfirm = null) =>
    setAlertState({ show: true, type, title, message, onConfirm });

  const handleCloseAlert = () =>
    setAlertState(prev => ({ ...prev, show: false }));

  // --------------------------
  // Helper: Recoverable Amount
  // --------------------------
  const calculateRecoverableAmount = (previousBalance, totalInvoice, returnAmount) => {
    return Number(previousBalance || 0) + Number(totalInvoice || 0) - Number(returnAmount || 0);
  };

  // --------------------------
  // Load Next Invoice No
  // --------------------------
  const loadInvoiceNo = useCallback(async (type = "cash") => {
    try {
      const res = await fetch(`${API}/invoice/next/${type}`);
      const data = await res.json();
      if (!data.invoiceNo) throw new Error("No invoice number returned");

      setInvoiceNo(data.invoiceNo);
      setFormData(prev => ({ ...prev, invoiceNo: data.invoiceNo }));

      if (data.temp) showAlert("warning", "Temporary Invoice", "Database not reachable.");
    } catch (err) {
      const now = new Date();
      const fallback = `${type === "cash" ? "INVCA" : "INVCR"}${now.getFullYear().toString().slice(-2)}${("0" + (now.getMonth() + 1)).slice(-2)}001`;
      setInvoiceNo(fallback);
      setFormData(prev => ({ ...prev, invoiceNo: fallback }));
      showAlert("warning", "Temporary Invoice", `Using fallback: ${fallback}`);
    }
  }, []);

  useEffect(() => {
    if (isNew) loadInvoiceNo(saleType);
  }, [saleType, isNew, loadInvoiceNo]);

  const handleSaleTypeChange = e => {
    setSaleType(e.target.value);
    setFormData({});
    setTempData([]);
    setIsNew(false);
    setIsModifyMode(false);
  };

  const handleNew = async () => {
    setIsNew(true);
    setFormData({});
    setTempData([]);
    await loadInvoiceNo(saleType);
  };

  // --------------------------
  // Input Change
  // --------------------------
  const handleChange = e => {
    if (!isNew) return;
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };

    // Update line amount
    if (["qty", "price", "discountInput"].includes(name)) {
      const qty = parseFloat(updatedForm.qty || 0);
      const price = parseFloat(updatedForm.price || 0);
      let discount = parseFloat(updatedForm.discountValue || 0);

      if (name === "discountInput") {
        const val = String(value || "").trim();
        if (val.endsWith("%")) {
          const perc = parseFloat(val.slice(0, -1));
          discount = !isNaN(perc) ? (qty * price * perc) / 100 : 0;
        } else {
          discount = parseFloat(val) || 0;
        }
      }

      updatedForm.discountValue = discount;
      updatedForm.lineAmount = qty * price - discount;
    }

    setFormData(updatedForm);
  };

  const handleDiscountChange = e =>
    handleChange({ target: { name: "discountInput", value: e.target.value } });

  // --------------------------
  // Customer Search
  // --------------------------
  const handleCustomerSearch = async e => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, customerCode: value }));
    if (!value) return setShowCustomerPopup(false);

    try {
      const res = await fetch(`${API}/sale/customers/search?query=${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      setCustomerSuggestions(Array.isArray(data) ? data : []);
      setShowCustomerPopup(Array.isArray(data) && data.length > 0);
    } catch (err) {
      console.error(err);
      setCustomerSuggestions([]);
      setShowCustomerPopup(false);
    }
  };

  const handleSelectCustomer = async cust => {
    try {
      setFormData(prev => ({
        ...prev,
        customerCode: cust.customer_code,
        customerName: cust.customer_name
      }));

      const res = await fetch(`${API}/sale/customers/details/${encodeURIComponent(cust.customer_code)}`);
      if (!res.ok) throw new Error("Network error while fetching customer details");

      const data = await res.json();
      const creditLimit = data.credit_limit ?? 0;
      const previousBalance = data.previous_balance ?? 0;
      const customerNameFromServer = data.customer_name ?? cust.customer_name;

      const tempTotal = tempData.reduce((s, r) => s + ((Number(r.qty) || 0) * (Number(r.price) || 0) - (Number(r.discountValue) || 0)), 0);
      const currentLine = (Number(formData.qty) || 0) * (Number(formData.price) || 0) - (Number(formData.discountValue) || 0);
      const invoiceTotal = tempTotal + currentLine;

      const recoverable = calculateRecoverableAmount(previousBalance, invoiceTotal, formData.returnAmount);

      let status = "GOOD";
      if (recoverable > creditLimit && creditLimit > 0) {
        status = "BAD";
        showAlert("warning", "Credit Limit Exceeded", "This customer reached credit amount");
      }

      setFormData(prev => ({
        ...prev,
        customerCode: cust.customer_code,
        customerName: customerNameFromServer,
        creditLimit,
        previousAmount: previousBalance,
        totalInvoice: invoiceTotal,
        recoverableAmount: recoverable,
        status
      }));

      setShowCustomerPopup(false);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", "Failed to load customer details");
    }
  };

  // --------------------------
  // Product Search
  // --------------------------
  const handleProductSearch = async value => {
    setProductSearchQuery(value || "");
    if (!value || !value.trim()) {
      setProductSearchResults([]);
      setShowProductPopup(false);
      return;
    }

    try {
      const res = await fetch(`${API}/sale/products/search?query=${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setProductSearchResults(Array.isArray(data) ? data : []);
      setShowProductPopup(true);
    } catch (err) {
      console.error(err);
      setProductSearchResults([]);
      setShowProductPopup(false);
    }
  };

  const handleSelectProduct = prod => {
    setFormData(prev => {
      const qty = Number(prev.qty) || 0;
      const discount = Number(prev.discountValue) || 0;
      const price = Number(prod.unit_cost || 0);
      return {
        ...prev,
        productCode: prod.product_code,
        productName: prod.product_name,
        price,
        lineAmount: qty * price - discount
      };
    });

    setProductSearchQuery(prod.product_code);
    setShowProductPopup(false);
  };

  // --------------------------
  // Recalculate Totals & Recoverable
  // --------------------------
  useEffect(() => {
    const tempTotal = tempData.reduce((s, r) => s + ((Number(r.qty) || 0) * (Number(r.price) || 0) - (Number(r.discountValue) || 0)), 0);
    const currentLine = (Number(formData.qty) || 0) * (Number(formData.price) || 0) - (Number(formData.discountValue) || 0);
    const invoiceTotal = tempTotal + currentLine;
    const prevBal = Number(formData.previousAmount) || 0;
    const returnAmt = Number(formData.returnAmount) || 0;
    const recoverable = calculateRecoverableAmount(prevBal, invoiceTotal, returnAmt);

    let status = "GOOD";
    if ((Number(formData.creditLimit) || 0) > 0 && recoverable > Number(formData.creditLimit)) {
      status = "BAD";
      showAlert("warning", "Credit Limit Exceeded", "This customer reached credit amount");
    }

    setFormData(prev => {
      const needUpdate =
        Number(prev.totalInvoice || 0) !== invoiceTotal ||
        Number(prev.recoverableAmount || 0) !== recoverable ||
        prev.status !== status;
      if (!needUpdate) return prev;
      return { ...prev, totalInvoice: invoiceTotal, recoverableAmount: recoverable, status };
    });
  }, [tempData, formData.qty, formData.price, formData.discountValue, formData.previousAmount, formData.returnAmount, formData.creditLimit]);

  // --------------------------
  // Click Outside to Close Popups
  // --------------------------
  useEffect(() => {
    const handleClickOutside = e => {
      if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerPopup(false);
      if (productRef.current && !productRef.current.contains(e.target)) setShowProductPopup(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // --------------------------
  // Add Line Item
  // --------------------------
  const handleAdd = () => {
    if (!formData.invoiceNo) {
      showAlert("error", "Required", "Invoice number missing");
      return;
    }

    const row = {
      ...formData,
      qty: Number(formData.qty) || 0,
      price: Number(formData.price) || 0,
      discountValue: Number(formData.discountValue) || 0,
      lineAmount: Number(formData.lineAmount) || ((Number(formData.qty) || 0) * (Number(formData.price) || 0) - (Number(formData.discountValue) || 0))
    };

    setTempData(prev => [...prev, row]);

    // Clear product line fields only
    setFormData(prev => ({
      ...prev,
      productCode: "",
      productName: "",
      price: "",
      qty: "",
      discountInput: "",
      discountValue: 0,
      lineAmount: 0
    }));

    setProductSearchQuery("");
    showAlert("success", "Added", "Item added");
  };

  // --------------------------
  // Save All
  // --------------------------
  const handleSaveAll = () => {
    if (tempData.length === 0) return showAlert("error", "Empty", "No rows to save");

    // TODO: implement backend save here
    setTempData([]);
    setFormData({});
    setIsNew(false);
    setProductSearchQuery("");
    showAlert("success", "Saved", "All saved");
  };

  const handleClear = () => {
    setFormData({});
    setTempData([]);
    setProductSearchQuery("");
  };

  // --------------------------
  // Totals
  // --------------------------
  const totalAmount = tempData.reduce((sum, row) => sum + ((Number(row.qty) || 0) * (Number(row.price) || 0)), 0);
  const totalDiscount = tempData.reduce((sum, row) => sum + (Number(row.discountValue) || 0), 0);
  const totalInvoice = totalAmount - totalDiscount;

  // --------------------------
  // Render
  // --------------------------
  return (
    <div className="sales-container">
      <Menu />
      <div className="sales-content">
        <Namewithdateacc />
        <h2>Sales Page</h2>

        <div className="sale-type">
          <label><input type="radio" value="cash" checked={saleType === "cash"} onChange={handleSaleTypeChange} /> Cash Sale</label>
          <label><input type="radio" value="credit" checked={saleType === "credit"} onChange={handleSaleTypeChange} /> Credit Sale</label>
        </div>

        <div className="form-grid">
          <div className="form-lefts">
            <label>Invoice No</label>
            <input name="invoiceNo" value={formData.invoiceNo || ""} readOnly />

            <label>Customer Code</label>
            <div ref={customerRef} style={{ position: "relative" }}>
              <input name="customerCode" value={formData.customerCode || ""} onChange={handleCustomerSearch} autoComplete="off" />
              {showCustomerPopup && (
                <ul className="autocomplete-popup">
                  {customerSuggestions.map((cust, idx) => (
                    <li key={idx} onClick={() => handleSelectCustomer(cust)}>
                      {cust.customer_code} - {cust.customer_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label>Customer Name</label>
            <input name="customerName" value={formData.customerName || ""} readOnly />

            <label>Product Code</label>
            <div ref={productRef} style={{ position: "relative" }}>
              <input name="productCode" value={productSearchQuery} onChange={e => handleProductSearch(e.target.value)} autoComplete="off" />
              {showProductPopup && (
                <ul className="autocomplete-popup">
                  {productSearchResults.map(prod => (
                    <li key={prod.product_code} onClick={() => handleSelectProduct(prod)}>
                      {prod.product_code} - {prod.product_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label>Product Name</label>
            <input name="productName" value={formData.productName || ""} readOnly />

            <label>Unit Price</label>
            <input type="number" name="price" value={formData.price || ""} readOnly />

            <label>Quantity</label>
            <input type="number" name="qty" value={formData.qty || ""} onChange={handleChange} />

            <label>Discount (% or amount)</label>
            <input type="text" name="discountInput" value={formData.discountInput || ""} onChange={handleDiscountChange} placeholder="5% or 100" />

            <p><strong>Line Amount:</strong> {(((Number(formData.qty) || 0) * (Number(formData.price) || 0) - (Number(formData.discountValue) || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          <div className="form-rights">
            <label>Manual Bill Date</label>
            <input type="date" name="date" value={formData.date || ""} onChange={handleChange} />

            <label>Manual Bill No</label>
            <input name="manualBillNo" value={formData.manualBillNo || ""} onChange={handleChange} />

            <label>Status</label>
            <input name="status" value={formData.status || ""} readOnly />

            <label>Credit Limit</label>
            <input name="creditLimit" value={formData.creditLimit ?? ""} readOnly />

            <label>Return Amount</label>
            <input type="number" name="returnAmount" value={formData.returnAmount || ""} onChange={handleChange} />

            <label>Previous Balance</label>
            <input type="number" name="previousAmount" value={formData.previousAmount ?? ""} readOnly />

            <label>Total Recoverable Amount</label>
            <input type="number" name="recoverableAmount" value={formData.recoverableAmount ?? ""} readOnly />

            {saleType === "credit" && (
              <>
                <label>Last Payment Date</label>
                <input type="date" name="lastPaymentDate" value={formData.lastPaymentDate || ""} onChange={handleChange} />
                <label>Last Payment Amount</label>
                <input type="number" name="lastPaymentAmount" value={formData.lastPaymentAmount || ""} onChange={handleChange} />
              </>
            )}

            {!isModifyMode && <button onClick={handleAdd}>Add</button>}
          </div>
        </div>

        <div className="button-group1">
          {!isNew ? (
            <button className="newbtn" onClick={handleNew}>New</button>
          ) : (
            <>
              {tempData.length > 0 && <button className="btnsave" onClick={handleSaveAll}>Save All</button>}
              <button className="btnclear" onClick={handleClear}>Clear</button>
              <button className="btnexit" onClick={() => window.location.reload()}>Exit</button>
            </>
          )}
        </div>

        <table className="grid-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Product Code</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {tempData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.invoiceNo}</td>
                <td>{row.customerName}</td>
                <td>{row.productCode}</td>
                <td>{row.productName}</td>
                <td>{row.qty}</td>
                <td>{row.price}</td>
                <td>{row.discountValue || 0}</td>
                <td>{((Number(row.lineAmount) || ((Number(row.qty) || 0) * (Number(row.price) || 0) - (Number(row.discountValue) || 0)))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid-totals" style={{ textAlign: "right" }}>
          <p><strong>Total Amount:</strong> {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Total Discount:</strong> {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Total Invoice Amount:</strong> {totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <AlertBox show={alertState.show} type={alertState.type} title={alertState.title} message={alertState.message} onClose={handleCloseAlert} onConfirm={alertState.onConfirm} />
    </div>
  );
}
