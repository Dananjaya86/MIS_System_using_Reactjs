
import React, { useState, useEffect, useRef, useCallback } from "react";
import Menu from "../componants/Menu";
import AlertBox from "../componants/Alertboxre";
import Namewithdateacc from "../componants/Namewithdateacc";
import "./sales.css";


const API = "http://localhost:5000/api/invoice";

export default function SalesPage() {
  const [saleType, setSaleType] = useState("cash");
  const [formData, setFormData] = useState({});
  const [tempData, setTempData] = useState([]);
  const [isNew, setIsNew] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const [alertState, setAlertState] = useState({ show: false, type: "info", title: "", message: "", onConfirm: null });
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);

  
  const customersCacheRef = useRef(null);
  const productsCacheRef = useRef(null);

  const customerRef = useRef();
  const productRef = useRef();

  const [isSaving, setIsSaving] = useState(false);
const [saveCompleted, setSaveCompleted] = useState(false);

const [showInvoicePopup, setShowInvoicePopup] = useState(false);
const [isSaveDisabled, setIsSaveDisabled] = useState(true);

const returnAmount = Number(formData.returnAmount || 0);

const [isReadOnly, setIsReadOnly] = useState(false);

const openInvoicePopup = () => {
  setShowInvoicePopup(true);
};


const closeInvoicePopup = () => {
  setShowInvoicePopup(false);
};

  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);


  const searchRef = useRef(null);



  const showAlert = (type, title, message, onConfirm = null) =>
    setAlertState({ show: true, type, title, message, onConfirm });
  const handleCloseAlert = () =>
    setAlertState((prev) => ({ ...prev, show: false }));

  const calculateRecoverableAmount = (prevBal, totalInvoice, returnAmt) =>
    Number(prevBal || 0) + Number(totalInvoice || 0) - Number(returnAmt || 0);

  
  const loadInvoiceNo = useCallback(async (type = "cash") => {
    try {
      const res = await fetch(`${API}/invoice/generate?type=${encodeURIComponent(type)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      
      const inv = data.invoice_no || data.invoiceNo || data.invoiceNo;
      if (!inv) throw new Error("No invoice number returned");
      setInvoiceNo(inv);
      setFormData((prev) => ({ ...prev, invoiceNo: inv }));
      if (data.temp) showAlert("warning", "Temporary Invoice", "Database not reachable.");
    } catch (err) {
      console.error("loadInvoiceNo:", err);
      const now = new Date();
      const fallback = `${type === "cash" ? "INVCA" : "INVCR"}${now.getFullYear().toString().slice(-2)}${("0" + (now.getMonth() + 1)).slice(-2)}001`;
      setInvoiceNo(fallback);
      setFormData((prev) => ({ ...prev, invoiceNo: fallback }));
      showAlert("warning", "Temporary Invoice", `Using fallback: ${fallback}`);
    }
  }, []);

  useEffect(() => {
    if (isNew) loadInvoiceNo(saleType);
  }, [saleType, isNew, loadInvoiceNo]);

  const handleSaleTypeChange = (e) => {
    setSaleType(e.target.value);
    setFormData({});
    setTempData([]);
    setIsNew(false);
    setIsModifyMode(false);
    setEditingIndex(null);
  };

  const handleNew = async () => {
    setIsNew(true);
    setFormData({});
    setTempData([]);
    setIsReadOnly(false);
    setEditingIndex(null);
    await loadInvoiceNo(saleType);

  };

  
  useEffect(() => {
    const creditLimit = Number(formData.creditLimit || 0);
    const recoverable = Number(formData.recoverableAmount || 0);

    if (recoverable > creditLimit && creditLimit > 0) {
      setFormData((prev) => ({ ...prev, status: "BAD" }));
      showAlert("error", "Credit Limit Exceeded", "This customer reached credit limit");
    } else {
      setFormData((prev) => ({ ...prev, status: "GOOD" }));
    }
  }, [formData.recoverableAmount, formData.creditLimit]);

  
  useEffect(() => {
    const prevBal = Number(formData.previousAmount || 0);
    const returnAmt = Number(formData.returnAmount || 0);
    const totalInvoice = tempData.reduce(
      (sum, r) => sum + ((Number(r.qty) || 0) * (Number(r.price) || 0) - (Number(r.discountValue) || 0)),
      0
    );
    const recoverable = calculateRecoverableAmount(prevBal, totalInvoice, returnAmt);
    setFormData((prev) => ({ ...prev, totalInvoice, recoverableAmount: recoverable }));
  }, [tempData, formData.previousAmount, formData.returnAmount]);

 
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    if (name === "qty" || name === "price" || name === "discountInput") {
      const qty = Number(updated.qty || 0);
      const price = Number(updated.price || 0);
      let discount = Number(updated.discountValue || 0);

      if (name === "discountInput") {
        const txt = String(value || "").trim();
        if (txt.endsWith("%")) {
          const perc = parseFloat(txt.slice(0, -1));
          discount = !isNaN(perc) ? (qty * price * perc) / 100 : 0;
        } else {
          discount = Number(txt) || 0;
        }
      }

      updated.discountValue = discount;
      updated.lineAmount = qty * price - discount;
    }

    setFormData(updated);
  };

  const handleDiscountChange = (e) =>
    handleChange({ target: { name: "discountInput", value: e.target.value } });

 
  const loadCustomersCache = useCallback(async () => {
    if (customersCacheRef.current) return customersCacheRef.current;
    try {
      const res = await fetch(`${API}/customers`);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      customersCacheRef.current = Array.isArray(data) ? data : [];
      return customersCacheRef.current;
    } catch (err) {
      console.error("loadCustomersCache:", err);
      customersCacheRef.current = [];
      return [];
    }
  }, []);

  const handleCustomerSearch = async (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customerCode: value }));
    if (!value) return setShowCustomerPopup(false);

    try {
      const all = await loadCustomersCache();
      const q = value.trim().toLowerCase();
      const filtered = all.filter(c =>
        (c.customer_code || "").toLowerCase().includes(q) ||
        (c.name || c.customer_name || "").toLowerCase().includes(q)
      ).slice(0, 50);
      setCustomerSuggestions(filtered.map(c => ({
        customer_code: c.customer_code,
        customer_name: c.name || c.customer_name || ""
      })));
      setShowCustomerPopup(filtered.length > 0);
    } catch (err) {
      console.error("Customer search:", err);
      setCustomerSuggestions([]);
      setShowCustomerPopup(false);
    }
  };

  const handleSelectCustomer = async (cust) => {
  try {
   
    setFormData((prev) => ({
      ...prev,
      customerCode: cust.customer_code,
      customerName: cust.customer_name,
    }));

  
    const res = await fetch(`${API}/customers/payment-info/${encodeURIComponent(cust.customer_code)}`);
    
    if (!res.ok) throw new Error("Failed to fetch customer payment info");
    
    const data = await res.json();
    
    if (!data.success || !data.customer) throw new Error("Customer data not found");

    
    setFormData((prev) => ({
      ...prev,
      creditLimit: data.customer.credit_limit ?? 0,
      previousAmount: data.customer.previous_balance ?? 0,
      lastPaymentDate: data.customer.last_payment_date ?? "", 
      lastPaymentAmount: data.customer.last_payment_amount ?? 0, 
    }));

    
    setShowCustomerPopup(false);

  } catch (err) {
    console.error("handleSelectCustomer:", err);
    showAlert("error", "Failed to load customer details or previous balance", err.message);
  }
};






  const loadProductsCache = useCallback(async () => {
    if (productsCacheRef.current) return productsCacheRef.current;
    try {
      const res = await fetch(`${API}/products`);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      productsCacheRef.current = Array.isArray(data) ? data : [];
      return productsCacheRef.current;
    } catch (err) {
      console.error("loadProductsCache:", err);
      productsCacheRef.current = [];
      return [];
    }
  }, []);

  const handleProductSearch = async (value) => {
    setProductSearchQuery(value || "");
    if (!value || !value.trim()) {
      setProductSearchResults([]);
      setShowProductPopup(false);
      return;
    }

    try {
      const all = await loadProductsCache();
      const q = value.trim().toLowerCase();
      const filtered = all.filter(p =>
        (p.product_code || "").toLowerCase().includes(q) ||
        (p.product_name || "").toLowerCase().includes(q)
      ).slice(0, 50);

      
      setProductSearchResults(filtered.map(p => ({
        product_code: p.product_code,
        product_name: p.product_name || "",
        unit_cost: p.unit_cost ?? p.unitPrice ?? 0,
      })));
      setShowProductPopup(filtered.length > 0);
    } catch (err) {
      console.error("product search:", err);
      setProductSearchResults([]);
      setShowProductPopup(false);
    }
  };

  const handleSelectProduct = (prod) => {
    setFormData((prev) => {
      const qty = Number(prev.qty) || 0;
      const discount = Number(prev.discountValue) || 0;
      const price = Number(prod.unit_cost || 0);
      return {
        ...prev,
        productCode: prod.product_code,
        productName: prod.product_name,
        price,
        lineAmount: qty * price - discount,
      };
    });
    setProductSearchQuery(prod.product_code);
    setShowProductPopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerPopup(false);
      if (productRef.current && !productRef.current.contains(e.target)) setShowProductPopup(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  
  const handleAdd = () => {
    if (!formData.productCode) {
      showAlert("error", "Required", "Product code is required");
      return;
    }

    const row = {
      invoiceNo: formData.invoiceNo || invoiceNo,
      customerCode: formData.customerCode || "",
      customerName: formData.customerName || "",
      productCode: formData.productCode,
      productName: formData.productName,
      qty: Number(formData.qty) || 0,
      price: Number(formData.price) || 0,
      discountValue: Number(formData.discountValue) || 0,
      lineAmount: Number(formData.lineAmount) || 0,
      returnAmount: Number(formData.returnAmount) || 0,
      previousAmount: Number(formData.previousAmount) || 0,
      creditLimit: Number(formData.creditLimit) || 0,
      status: formData.status || "GOOD",
      lastPaymentDate: formData.lastPaymentDate || "",
      lastPaymentAmount: formData.lastPaymentAmount || 0,
    };

    setTempData((prev) => [...prev, row]);

    setFormData((prev) => ({
      ...prev,
      productCode: "",
      productName: "",
      price: "",
      qty: "",
      discountInput: "",
      discountValue: 0,
      lineAmount: 0,
    }));
    setProductSearchQuery("");
    showAlert("success", "Added", "Item added");
    setIsSaveDisabled(false); 
    setIsReadOnly(false); 
  };

  
  const handleRowClick = (index) => {
  const row = tempData[index];
  if (!row) return;

  setEditingIndex(index);
  setIsModifyMode(true);

  
  setFormData({
    ...row,
    discountInput: row.discountValue ? String(row.discountValue) : "",
  });
  setProductSearchQuery(row.productCode || "");

  
  setTempData((prev) => prev.filter((_, idx) => idx !== index));
};



  
  const handleModifyRow = () => {
    if (editingIndex === null) {
      showAlert("error", "No selection", "Select a row to modify");
      return;
    }
    if (!formData.productCode) {
      showAlert("error", "Required", "Product code is required");
      return;
    }

    const qty = Number(formData.qty) || 0;
    const price = Number(formData.price) || 0;
    const discount = Number(formData.discountValue) || 0;
    const lineAmount = qty * price - discount;

    const updatedRow = { ...formData, qty, price, discountValue: discount, lineAmount };

    setTempData((prev) => {
      const arr = [...prev];
      arr[editingIndex] = updatedRow;
      return arr;
    });

    showAlert("success", "Updated", "Item updated successfully");
    setEditingIndex(null);
    setIsModifyMode(false);
    setFormData((prev) => ({
      ...prev,
      productCode: "",
      productName: "",
      qty: "",
      price: "",
      discountInput: "",
      discountValue: 0,
      lineAmount: 0,
    }));
    setProductSearchQuery("");
  };

  
  const handleDeleteRow = () => {
    if (editingIndex === null) {
      showAlert("error", "No selection", "Select a row to delete");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setTempData((prev) => prev.filter((_, idx) => idx !== editingIndex));
    setEditingIndex(null);
    setIsModifyMode(false);
    setFormData((prev) => ({
      ...prev,
      productCode: "",
      productName: "",
      qty: "",
      price: "",
      discountInput: "",
      discountValue: 0,
      lineAmount: 0,
    }));
    setProductSearchQuery("");
    showAlert("success", "Deleted", "Item removed");
  };

  
  const handleSaveAll = async () => {

      setIsSaving(true);
      setSaveCompleted(false);

      const invNoToSend = invoiceNo || formData.invoiceNo;
  if (!invNoToSend) {
    showAlert("error", "Error", "Invoice number missing");
    setIsSaving(false);
    return;
  }

    
    if (!tempData || tempData.length === 0) {
    showAlert("error", "Error", "No rows to save");
    setIsSaving(false);
    return;
  }

    try {
     
    
      const items = tempData.map(r => ({
        productCode: r.productCode,
        productName: r.productName,
        qty: r.qty,
        price: r.price,
        discountValue: r.discountValue,
        lineAmount: r.lineAmount,
      }));

      
      const invoiceData = {
        manualBillDate: formData.date || null,
        manualBillNo: formData.manualBillNo || null,
        returnAmount: Number(formData.returnAmount || 0),
        previousAmount: Number(formData.previousAmount || 0),
        creditLimit: Number(formData.creditLimit || 0),
        status: formData.status || "GOOD",
        lastPaymentDate: formData.lastPaymentDate || null,
        lastPaymentAmount: Number(formData.lastPaymentAmount || 0),
        customerName: formData.customerName || "",
        advancePayment: Number(formData.advancePayment || 0),
        totalDiscount: Number(totalDiscount || 0),
        totalInvoice: Number(totalInvoice || 0),
        totalAmount: Number(totalAmount || 0),
      };  

      const body = {
        invoice_no: invNoToSend,
        customer: formData.customerCode || "",
        total: Number(formData.totalInvoice || 0) || tempData.reduce((s, r) => s + (Number(r.lineAmount) || 0), 0),
        items,
        invoiceData,
        userLogin: localStorage.getItem("username") || "system",
      };

      const res = await fetch(`${API}/invoice/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    

  const data = await res.json().catch(() => ({}));

if (res.ok) {
  showAlert("success", "Success", data.message || "Invoice saved successfully");

  if (invNoToSend) {
    setTimeout(() => {
      AlertBox({
        type: "info",
        title: "Print Invoice",
        message: "Do you want to print this invoice?",
        buttons: [
          {
            label: "Yes",
            onClick: () => {
              printInvoice(invNoToSend);
              handleClear();
            },
          },
          {
            label: "No",
            onClick: () => handleClear(),
          },
        ],
      });
    }, 100);
  }
}



    }  catch (err) {
    console.error(err); 
    showAlert("error", "Error", "Network or server error");
  } finally {
    setIsSaving(false);
  }
  };

  
  const handleSearchInvoice = async (e) => {
  const value = e.target.value; 
  setSearchQuery(value);

  if (!value) {
    setInvoices([]);
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/invoice/search?q=${value}`);
    if (!response.ok) throw new Error("Network response not ok");

    const data = await response.json();
    setInvoices(data);
    setError(null);
  } catch (err) {
    console.error("Invoice search error:", err);
    setError(err.message);
    setInvoices([]);
  }
};




const handleSelectInvoice = async (invoiceNo) => {
  try {
    setShowSearchPopup(false);

    const res = await fetch(`${API}/details/${invoiceNo}`);
    if (!res.ok) throw new Error("Failed to load");

    const data = await res.json();
    const inv = data.master;

    if (!inv) {
      showAlert("error", "Error", "Invoice data not found");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      invoiceNo: inv.invoice_no,
      customerCode: inv.customer_code,
      customerName: inv.customer_name,

      date: inv.manual_bill_date ? inv.manual_bill_date.slice(0, 10) : "",
      manualBillNo: inv.manual_bill_no || "",

      advancePayment: Number(inv.advance_payment || 0),
      creditLimit: Number(inv.credit_limit || 0),

      
      previousAmount: Number(data.previousAmount || 0),

      returnAmount: Number(inv.return_amount || 0),

      totalAmount: Number(inv.total_amount || 0),
      totalDiscount: Number(inv.discount_amount || 0),
      totalInvoice: Number(inv.total_invoice_amount || 0),

      lastPaymentDate: data.lastPaymentDate ? data.lastPaymentDate.slice(0,10) : "",
      lastPaymentAmount: Number(inv.last_payment_amount || 0),

      status: inv.status || "GOOD",
    }));

    const rows = (data.items || []).map((i) => ({
      productCode: i.product_code,
      productName: i.product_name,
      qty: Number(i.qty),
      price: Number(i.unit_price || 0),
      discountValue: Number(i.discount_amount || 0),
      lineAmount: Number(i.amount || 0),
    }));

    setIsReadOnly(true);
    setIsSaveDisabled(true);

    setTempData(rows);

  } catch (err) {
    console.error("Load invoice error:", err);
    showAlert("error", "Error", "Failed to load invoice data");
  }
};

// Function to view invoice PDF
const viewInvoice = (invoiceNo) => {
  if (!invoiceNo) {
    showAlert("error", "Error", "Invoice number missing");
    return;
  }
  const url = `${API}/invoice/print/${invoiceNo}`;
  window.open(url, "_blank"); // Open PDF in a new tab
};

// Function to print invoice PDF
const printInvoice = (invoiceNo) => {
  if (!invoiceNo) {
    showAlert("error", "Error", "Invoice number missing");
    return;
  }
  const url = `${API}/invoice/print/${invoiceNo}`;
  const printWindow = window.open(url, "_blank");
  printWindow.addEventListener("load", () => {
    printWindow.print();
  });
};





useEffect(() => {
  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowSearchPopup(false);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);



  const handleClear = () => {
    setFormData({});
    setTempData([]);
    setEditingIndex(null);
    setIsModifyMode(false);
    setProductSearchQuery("");
    setInvoiceNo("");
    setShowInvoicePopup(false);
  };

  
  const totalAmount = tempData.reduce((sum, row) => sum + ((Number(row.qty) || 0) * (Number(row.price) || 0)), 0);
  const totalDiscount = tempData.reduce((sum, row) => sum + (Number(row.discountValue) || 0), 0);
  const totalInvoice = totalAmount - totalDiscount - returnAmount;

  
  useEffect(() => {
    setFormData(prev => ({ ...prev, totalInvoice }));
  }, [totalInvoice]);

  return (
    <div className="sales-container">
      <Menu />
      <div className="sales-content">
        <Namewithdateacc />
        <h2>Sales Page</h2>

        <div className="sale-type">
          <label>
            <input type="radio" value="cash" checked={saleType === "cash"} onChange={handleSaleTypeChange} /> Cash Sale
          </label>
          <label>
            <input type="radio" value="credit" checked={saleType === "credit"} onChange={handleSaleTypeChange} /> Credit Sale
          </label>
        </div>

        <div className="form-grid">
          <div className="form-lefts">
            <label>Invoice No</label>
            <input name="invoiceNo" value={formData.invoiceNo || invoiceNo || ""} readOnly />

            <label>Customer Code</label>
            <div ref={customerRef} style={{ position: "relative" }}>
              <input
                name="customerCode"
                value={formData.customerCode || ""}
                onChange={handleCustomerSearch}
                autoComplete="off"
              />
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
              <input
                name="productCode"
                value={productSearchQuery || formData.productCode || ""}
                readOnly={isReadOnly}
                onChange={(e) => {
                  const v = e.target.value;
                  setProductSearchQuery(v);
                  handleProductSearch(v);
                }}
                autoComplete="off"
              />
              {showProductPopup && (
                <ul className="autocomplete-popup">
                  {productSearchResults.map((prod) => (
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
            <input type="number" name="qty" value={formData.qty || ""} onChange={handleChange} readOnly={isReadOnly} />

            <label>Discount (% or amount)</label>
            <input type="text" name="discountInput" value={formData.discountInput || ""} readOnly={isReadOnly} onChange={handleDiscountChange} placeholder="5% or 100" />

            <p>
              <strong>Line Amount:</strong>{" "}
              {(((Number(formData.qty) || 0) * (Number(formData.price) || 0) - (Number(formData.discountValue) || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="form-rights">
            <label>Manual Bill Date</label>
            <input type="date" name="date" value={formData.date || ""} onChange={handleChange} readOnly={isReadOnly} />

            <label>Manual Bill No</label>
            <input name="manualBillNo" value={formData.manualBillNo || ""} onChange={handleChange} readOnly={isReadOnly} />

            <label>Status</label>
            <input name="status" value={formData.status || ""} readOnly className={formData.status === "BAD" ? "status-bad" : "status-good"} />

            <label>Credit Limit</label>
            <input name="creditLimit" value={formData.creditLimit ?? ""} readOnly />

            <label>Return Amount</label>
            <input type="number" name="returnAmount" value={formData.returnAmount || ""} onChange={handleChange} readOnly={isReadOnly} />

            <label>Previous Balance</label>
            <input type="number" name="previousAmount" value={formData.previousAmount ?? ""} readOnly />

            <label>Total Recoverable Amount</label>
            <input type="number" name="recoverableAmount" value={formData.recoverableAmount ?? ""} readOnly />

            {saleType === "credit" && (
              <>
                <label>Last Payment Date</label>
                <input type="date" name="lastPaymentDate" value={formData.lastPaymentDate || ""} readOnly />
                <label>Last Payment Amount</label>
                <input type="number" name="lastPaymentAmount" value={formData.lastPaymentAmount || ""} readOnly />
              </>
            )}
            {!isModifyMode && (
              <button onClick={handleAdd} disabled={formData.status === "BAD"}>Add</button>
            )}

            <div style={{ marginTop: 12 }}>
              {isModifyMode && <button className="btnmodify" onClick={handleModifyRow}>Edit</button>}
              {isModifyMode && <button className="btndelete" onClick={handleDeleteRow}>Delete</button>}
            </div>
          </div>
        </div>

    


        <div className="button-group1" style={{ marginTop: 12 }}>
          {!isNew ? (
            <button className="newbtn" onClick={handleNew}>New</button>
          ) : (
            <>
              {tempData.some(row => row.invoiceNo && row.invoiceNo.trim() !== "") && ( <button className="btnsave" onClick={handleSaveAll} disabled={isReadOnly} > Save All </button>)}        
              <button className="btnclear" onClick={handleClear}>Clear</button>
              <button className="btnexit" onClick={() => window.location.reload()}>Exit</button>
            </>
          )}
        </div>

        <button className="btnserch" onClick={openInvoicePopup}>Search Invoice</button>
        <div style={{ marginTop: 10 }}>
  {formData.invoiceNo && (
    <>
      <button onClick={() => viewInvoice(formData.invoiceNo)}>View</button>
      <button onClick={() => printInvoice(formData.invoiceNo)}>Print</button>
    </>
  )}
</div>


        {showInvoicePopup && (
  <div className="search-container" style={{ position: "relative", marginTop: 12 }}>
    <input
      type="text"
      placeholder="Search invoice..."
      value={searchQuery}
      onChange={(e) => handleSearchInvoice(e)}
      className="search-input"
    />

    {error && <p style={{ color: "red" }}>{error}</p>}

    {invoices.length > 0 && (
      <div
        className="invoice-search-table"
        style={{ maxHeight: 300, overflowY: "auto", marginTop: 6 }}
      >
        <table className="grid-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer Code</th>
              <th>Customer Name</th>
              <th>Total Amount</th>
              <th>Bill Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.invoice_no}
                onDoubleClick={() => {
                  handleSelectInvoice(inv.invoice_no); 
                  closeInvoicePopup(); 
                }}
                style={{ cursor: "pointer" }}
              >
                <td>{inv.invoice_no}</td>
                <td>{inv.customer_code}</td>
                <td>{inv.customer_name}</td>
                <td>{inv.total_invoice_amount}</td>
                <td>{new Date(inv.manual_bill_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

       
        <div style={{ marginTop: "10px", textAlign: "right" }}>
          <button onClick={closeInvoicePopup}>Close</button>
        </div>
      </div>
    )}
  </div>
)}










        <table className="grid-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {tempData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => handleRowClick(idx)}
                style={{ background: editingIndex === idx ? "#eef" : undefined, cursor: "pointer" }}
              >
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

        <div className="grid-totals" style={{ textAlign: "right", marginTop: 12 }}>

  <p><strong>Total Amount:</strong>
    {" "}
    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </p>

  <p><strong>Total Discount:</strong>
    {" "}
    {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </p>

  {Number(formData.returnAmount) > 0 && (
    <p style={{ color: "red" }}>
      <strong>Return Amount:</strong>
      {" "}
      {Number(formData.returnAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  )}

  <p><strong>Total Invoice Amount:</strong>
    {" "}
    {totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </p>

</div>

      </div>


      <AlertBox show={alertState.show} type={alertState.type} title={alertState.title} message={alertState.message} onClose={handleCloseAlert} onConfirm={alertState.onConfirm} />
    </div>
  );
}
