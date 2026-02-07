import React, { useEffect, useState, useRef } from "react";
import Menu from "../componants/Menu";
import "./return.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AlertBox from "../componants/Alertboxre";
import Namewithdateacc from "../componants/Namewithdateacc";

export default function ReturnItems() {
  const [returnType, setReturnType] = useState("select");
  const [gridData, setGridData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddClear, setShowAddClear] = useState(false);
  const [reasonType, setReasonType] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [popupProducts, setPopupProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();
  const [lockReturnType, setLockReturnType] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [loading, setLoading] = useState(false); 
  const [isReadOnly, setIsReadOnly] = useState(false); 

  const [returnNumber, setReturnNumber] = useState("");
const [returnNoLoading, setReturnNoLoading] = useState(true);

const [pdfReturnNumber, setPdfReturnNumber] = useState("");
const [pdfData, setPdfData] = useState([]);

  const [popupCustomers, setPopupCustomers] = useState([]);
const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
const customerDropdownRef = useRef();


  const [formData, setFormData] = useState({
    productCode: "",
    productName: "",
    qty: "",
    dispatchNo: "",
    amount: "",
    reason: "",
    remark: "",
    customerSupplierName: "",
    returnDate: "",
  });

const loadNextReturnNumber = async () => {
  try {
    setReturnNoLoading(true);
    const res = await fetch("http://localhost:5000/api/returns/next-return-number");
    const data = await res.json();
    setReturnNumber(data.returnNumber); 
  } catch (err) {
    console.error("Return number error:", err);
  } finally {
    setReturnNoLoading(false);
  }
};


useEffect(() => {
  loadNextReturnNumber();
}, []);



const handlePrintPDF = () => {
  if (gridData.length === 0) {
    return showAlert("info", "No Data", "No return items to print.");
  }

  const doc = new jsPDF();

  
  doc.setFontSize(16);
  doc.text("Return Items Report", 14, 20);

  
  doc.setFontSize(11);
  doc.text(`Return No: ${returnNumber}`, 14, 30);
  doc.text(`Return Type: ${returnType}`, 14, 36);
  if (returnType === "fromCustomer" || returnType === "toSupplier") {
    doc.text(`Party: ${formData.customerSupplierName || "-"}`, 14, 42);
  }
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);

  
  const columns = [
    "Product Code",
    "Product Name",
    "Qty",
    returnType === "toStock" ? "Dispatch No" : "Invoice No",
    "Amount",
    "Reason",
    "Remark"
  ];

  if (returnType === "fromCustomer" || returnType === "toSupplier") {
    columns.push(returnType === "fromCustomer" ? "Customer Name" : "Supplier Name");
  }

  
  const rows = gridData.map(item => {
    const base = [
      item.productCode,
      item.productName,
      item.qty,
      item.dispatchNo,
      item.amount,
      item.reason + (item.reason_other ? ` (${item.reason_other})` : ""),
      item.remark || ""
    ];
    if (returnType === "fromCustomer" || returnType === "toSupplier") {
      base.push(item.customerSupplierName || "");
    }
    return base;
  });

  doc.autoTable({
    startY: 55,
    head: [columns],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 }
  });

  doc.save(`${returnNumber}_Return_Report.pdf`);
};



const handlePrintPDFByNumber = async () => {
  if (!pdfReturnNumber.trim())
    return showAlert("warning", "Missing", "Enter Return Number");

  try {
    const res = await fetch(`http://localhost:5000/api/returns/${pdfReturnNumber}`);
    const data = await res.json();

    if (data.length === 0)
      return showAlert("info", "No Data", "No return found for this number");

    const doc = new jsPDF();
    const first = data[0];

    const isCustomer = first.return_type === "fromCustomer";
    const isSupplier = first.return_type === "toSupplier";
    const isStock = first.return_type === "toStock";

    // ---------- HEADER ----------
    doc.setFontSize(14);
    doc.setFont("helvetica");
    doc.text("Milkee Foods Products", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Halpita, Polgasowita", 105, 21, { align: "center" });
    doc.text("T.P. 0778608207", 105, 26, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica");
    doc.text(isStock ? "RETURN TO STOCK NOTE" : "RETURN NOTE", 105, 35, { align: "center" });

    // ---------- LEFT BLOCK ----------
    const leftX = 14;
    let y = 45;

    if (isStock) {
      doc.text("Return To:", leftX, y);
      doc.text("STOCK", leftX + 45, y);
      y += 6;
    }

    if (isCustomer) {
      doc.text("Customer Code:", leftX, y);
      doc.text(first.party_code || "-", leftX + 45, y);
      y += 6;

      doc.text("Customer Name:", leftX, y);
      doc.text(first.party_name || "-", leftX + 45, y);
      y += 6;
    }

    if (isSupplier) {
      doc.text("Supplier Code:", leftX, y);
      doc.text(first.party_code || "-", leftX + 45, y);
      y += 6;

      doc.text("Supplier Name:", leftX, y);
      doc.text(first.party_name || "-", leftX + 45, y);
      y += 6;
    }

    // ---------- RIGHT BLOCK ----------
    const rightX = 130;
    let ry = 45;

    doc.text("Return Number:", rightX, ry);
    doc.text(first.return_number, rightX + 40, ry);

    ry += 6;
    doc.text("Return Date:", rightX, ry);
    doc.text(new Date(first.return_date).toLocaleDateString(), rightX + 40, ry);

    ry += 6;
    doc.text("Ref Number:", rightX, ry);
    doc.text(first.ref_no || "-", rightX + 40, ry);

    // ---------- TABLE ----------
    const columns = ["Product Code", "Product Name", "Reason", "Return Amount", "Remarks"];
    const rows = data.map(item => [
      item.product_code,
      item.product_name,
      item.reason_other ? `${item.reason} (${item.reason_other})` : item.reason,
      Number(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // formatted
      item.remaks || ""
    ]);

    autoTable(doc, {
      startY: 80,
      head: [columns],
      body: rows,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 102, 204] }
    });

    // ---------- TOTAL AMOUNT ----------
    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Total Return Amount:", 120, totalY);
    doc.text(
      totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // formatted
      170,
      totalY,
      { align: "right" }
    );

    // ---------- FOOTER ----------
    const endY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.text(`Printed By: ${first.user_name}`, 14, endY);
    doc.text(`Printed On: ${new Date().toLocaleString()}`, 130, endY);

    doc.save(`${pdfReturnNumber}_Return_Note.pdf`);
  } catch (err) {
    console.error(err);
    showAlert("error", "Error", "Failed to fetch return details");
  }
};







  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPopupProducts = async (value) => {
    if (value.length < 1) {
      setPopupProducts([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/returns/products/search?q=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setPopupProducts(data);
      setShowDropdown(true);
    } catch (err) {
      console.error("Popup search error:", err);
    }
  };

  const selectProduct = (p) => {
    setFormData((prev) => ({
      ...prev,
      productCode: p.product_code,
      productName: p.product_name,
    }));
    setPopupProducts([]);
  };


  useEffect(() => {
  const handleClickOutsideCustomer = (e) => {
    if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
      setShowCustomerDropdown(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutsideCustomer);
  return () => document.removeEventListener("mousedown", handleClickOutsideCustomer);
}, []);

  
  const showAlert = (type, title, message, onConfirm = null) => {
    setAlertConfig({ show: true, type, title, message, onConfirm });
  };
  const closeAlert = () => setAlertConfig({ ...alertConfig, show: false });


  const searchCustomerSupplier = async (value) => {
  if (value.length < 1) {
    setPopupCustomers([]);
    setShowCustomerDropdown(false);
    return;
  }
  try {
    const type = returnType === "fromCustomer" ? "customers" : "suppliers";
    const res = await fetch(`http://localhost:5000/api/returns/${type}/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setPopupCustomers(data);
    setShowCustomerDropdown(true);
  } catch (err) {
    console.error("Customer/Supplier search error:", err);
  }
};

  const handleCustomerInputChange = (e) => {
  const { value } = e.target;
  setFormData(prev => ({ ...prev, customerSupplierName: value }));
  searchCustomerSupplier(value);
};

const selectCustomerSupplier = (item) => {
  setFormData(prev => ({
    ...prev,
    customerSupplierCode: item.code,   
    customerSupplierName: item.name,   
  }));
  setPopupCustomers([]);
  setShowCustomerDropdown(false);
};


  
  const handleReturnTypeChange = (e) => {
  const type = e.target.value;
  if (type === "select") return;

  setReturnType(type);
  setLockReturnType(true);
  setShowAddClear(true);

  
  const resetForm = {
    productCode: "",
    productName: "",
    qty: "",
    dispatchNo: "",
    amount: "",
    reason: "",
    remark: "",
    customerSupplierName: "",
    returnDate: "",
  };

  
  if (type === "toStock") {
    setReasonType("Return to Stock");
    setCustomReason("");
    setFormData({
      ...resetForm,
      reason: "Return to Stock",
    });
  } else {
    setReasonType("");
    setCustomReason("");
    setFormData(resetForm);
  }

  setEditingIndex(null);
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "productCode" || name === "productName") {
      searchPopupProducts(value);
      setShowDropdown(true);
    }
  };

  const handleNew = () => {
  
  setIsReadOnly(false);
  setLockReturnType(false);

  
  setShowAddClear(true);

  
  setReturnType("select");
  setEditingIndex(null);
  setReasonType("");
  setCustomReason("");

  
  setGridData([]);

  
  setFormData({
    productCode: "",
    productName: "",
    qty: "",
    dispatchNo: "",
    amount: "",
    reason: "",
    remark: "",
    customerSupplierName: "",
    returnDate: "",
  });

  
  loadNextReturnNumber();
};


  const handleClear = () => {
    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      reason: "",
      remark: "",
      customerSupplierName: "",
      returnDate: "",
    });
    setEditingIndex(null);
    setReasonType("");
    setCustomReason("");
    setLockReturnType(false);
    setIsReadOnly(false);
  };

  const handleAdd = () => {
    if (returnType === "select") return showAlert("warning", "Missing", "Select return type");
    if (!formData.productCode.trim()) return showAlert("warning", "Missing", "Enter product code");
    if (!formData.productName.trim()) return showAlert("warning", "Missing", "Enter product name");
    if (!formData.qty || Number(formData.qty) <= 0) return showAlert("warning", "Missing", "Enter valid quantity");
    if (!formData.amount || Number(formData.amount) <= 0) return showAlert("warning", "Missing", "Enter valid amount");
    if (!formData.dispatchNo.trim()) return showAlert("warning", "Missing", "Enter invoice/dispatch no");
    if (!formData.returnDate) return showAlert("warning", "Missing", "Select return date");
    if (!reasonType) return showAlert("warning", "Missing", "Select reason");
    if ((returnType === "fromCustomer" || returnType === "toSupplier") && !formData.customerSupplierName.trim())
      return showAlert("warning", "Missing", returnType === "fromCustomer" ? "Enter customer name" : "Enter supplier name");
    if ((reasonType === "Other" || reasonType === "Replace with other product") && !customReason.trim())
      return showAlert("warning", "Missing", reasonType === "Other" ? "Enter other reason" : "Enter replace products");

    const finalReasonOther = (reasonType === "Other" || reasonType === "Replace with other product") ? customReason : null;

    const newRow = {
  ...formData,
  reason: reasonType,          
  reason_other: finalReasonOther,  
};

    if (editingIndex !== null) {
      const updatedData = [...gridData];
      updatedData[editingIndex] = newRow;
      setGridData(updatedData);
      setEditingIndex(null);
      showAlert("success", "Updated", "Row updated successfully!");
    } else {
      setGridData([...gridData, newRow]);
      showAlert("success", "Added", "Item added to grid!");
    }

    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      reason: "",
      remark: "",
      customerSupplierName: "",
      returnDate: "",
    });
    if (returnType === "toStock") {
  setReasonType("Return to Stock");
} else {
  setReasonType("");
}
setCustomReason("");
    
  };

  const handleEditRow = (index) => {
    setFormData(gridData[index]);
    setEditingIndex(index);
    setShowAddClear(true);
    setIsReadOnly(false);
  };

  const handleDeleteRow = (index) => {
    showAlert("question", "Confirm Delete", "Are you sure you want to delete this row?", () => {
      const updatedData = gridData.filter((_, i) => i !== index);
      setGridData(updatedData);
      if (editingIndex === index) setEditingIndex(null);
      if (updatedData.length === 0) setIsReadOnly(false);
    });
  };

const handleSave = async () => {
  if (gridData.length === 0)
    return showAlert("warning", "Missing", "No data to save");

  try {
    setLoading(true);

    const payload = {
      returnNumber,
      returnType,
      username: localStorage.getItem("username"),
      rows: gridData.map(row => ({
    ...row,
    reason: row.reason,
    reason_other: row.reason_other,
  })),
    };

    const res = await fetch("http://localhost:5000/api/returns/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showAlert("success", "Saved", "Saved successfully!");

    setGridData([]);
    setShowAddClear(false);
    setReturnType("select");
    setLockReturnType(false);
    setIsReadOnly(true);
    setReasonType("");
    setCustomReason("");
    loadNextReturnNumber();

  } catch (err) {
    console.error(err);
    showAlert("error", "Save Failed", err.message);
  } finally {
    setLoading(false);
  }
};


  const handleExit = () => {
    setShowAddClear(false);
    setEditingIndex(null);
    setLockReturnType(false);
    setReturnType("select");
    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      reason: "",
      remark: "",
      customerSupplierName: "",
      returnDate: "",
    });
    setReasonType("");
    setCustomReason("");
    setIsReadOnly(false);
  };

  
  return (
    <div className="return-items-container">
      <Menu />
      <div className="return-items-content">
        <Namewithdateacc />
        <h2>Return Items</h2>

        <div className="return-number-box">
  <label>Return No</label>
  <input
    type="text"
    value={returnNoLoading ? "Loading..." : returnNumber}
    readOnly
  />
</div>

        <select
          value={returnType}
          onChange={handleReturnTypeChange}
          disabled={lockReturnType || isReadOnly}
        >
          <option value="select">Select One</option>
          <option value="toStock">To Stock</option>
          <option value="fromCustomer">From Customer</option>
          <option value="toSupplier">To Supplier</option>
        </select>

        
        <div className="form-box">
          <div className="form-section">
            <div className="form-column">
              <label>Product Code</label>
              <input type="text" name="productCode" value={formData.productCode} onChange={handleInputChange} placeholder="Type to search..." readOnly={isReadOnly} />
              <label>Product Name</label>
              <input type="text" name="productName" value={formData.productName} onChange={handleInputChange} placeholder="Type to search..." readOnly={isReadOnly} />
              {showDropdown && popupProducts.length > 0 && (
                <div className="autocomplete-dropdown">
                  {popupProducts.map((p) => (
                    <div key={p.product_code} className="autocomplete-item" onClick={() => selectProduct(p)}>
                      {p.product_code} - {p.product_name}
                    </div>
                  ))}
                </div>
              )}
              <label>Quantity</label>
              <input type="number" name="qty" value={formData.qty} onChange={handleInputChange} readOnly={isReadOnly} />
              <label>Amount</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} readOnly={isReadOnly} />
              <label>{returnType === "toStock" ? "Dispatch No" : "Invoice No"}</label>
              <input type="text" name="dispatchNo" value={formData.dispatchNo} onChange={handleInputChange} readOnly={isReadOnly} />
            </div>

            <div className="form-column">
              <label>Return Date</label>
              <input type="date" name="returnDate" value={formData.returnDate} onChange={handleInputChange} readOnly={isReadOnly} />

              <label>Reason</label>
<select
  value={reasonType}
  onChange={(e) => {
    setReasonType(e.target.value);
    setCustomReason("");
    setFormData({ ...formData, reason: e.target.value });
  }}
  disabled={!returnType || isReadOnly}
>
  {returnType === "toStock" ? (
    <option value="Return to Stock">Return to Stock</option>
  ) : (
    <>
      <option value="">Select Reason</option>
      <option value="Expire">Expire</option>
      <option value="Spoile">Spoile</option>
      <option value="Rejected">Rejected</option>
      <option value="Fungus">Fungus</option>
      <option value="Quality Loss">Quality Loss</option>
      <option value="Replace with other product">Replace with other product</option>
      <option value="Other">Other</option>
    </>
  )}
</select>

              {reasonType === "Other" && <input type="text" value={customReason} onChange={(e) => setCustomReason(e.target.value)} readOnly={isReadOnly} />}
              {reasonType === "Replace with other product" && <input type="text" value={customReason} onChange={(e) => setCustomReason(e.target.value)} readOnly={isReadOnly} />}

              <label>Remark</label>
              <textarea name="remark" value={formData.remark} onChange={handleInputChange} readOnly={isReadOnly} />

              {(returnType === "fromCustomer" || returnType === "toSupplier") && (
  <>
    <label>{returnType === "fromCustomer" ? "Customer Code" : "Supplier Code"}</label>
    <input
      type="text"
      name="customerSupplierCode"
      value={formData.customerSupplierCode || ""}
      onChange={handleCustomerInputChange}
      readOnly={isReadOnly}
    />

    <label>{returnType === "fromCustomer" ? "Customer Name" : "Supplier Name"}</label>
    <input
      type="text"
      name="customerSupplierName"
      value={formData.customerSupplierName}
      onChange={handleCustomerInputChange}
      readOnly={isReadOnly}
    />

    {showCustomerDropdown && popupCustomers.length > 0 && (
      <div className="autocomplete-dropdown" ref={customerDropdownRef}>
        {popupCustomers.map(c => (
          <div
            key={c.code}
            className="autocomplete-item"
            onClick={() => selectCustomerSupplier(c)}
          >
            {c.code} - {c.name}
          </div>
        ))}
      </div>
    )}
  </>
)}
            </div>
          </div>
        </div>

        
        {!showAddClear ? (
          <div className="button-group">
            <button className="new-btn" onClick={handleNew}>New</button>
            <button className="exit-btn" onClick={handleExit}>Exit</button>
          </div>
        ) : (
          <div className="button-group">
            <button className="add-btn" onClick={handleAdd}>{editingIndex !== null ? "Update" : "Add"}</button>
            <button className="clear-btn" onClick={handleClear}>Clear</button>
            <button className="exit-btn" onClick={handleExit}>Exit</button>
            <button className="save-btn" onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        )}

        
        {gridData.length > 0 && (
          <table className="data-grid">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Qty</th>
                <th>{returnType === "toStock" ? "Dispatch No" : "Invoice No"}</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Remark</th>
                {(returnType === "fromCustomer" || returnType === "toSupplier") && <th>{returnType === "fromCustomer" ? "Customer Name" : "Supplier Name"}</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((item, index) => (
                <tr key={index} className={editingIndex === index ? "editing-row" : ""}>
                  <td>{item.productCode}</td>
                  <td>{item.productName}</td>
                  <td>{item.qty}</td>
                  <td>{item.dispatchNo}</td>
                  <td>{item.amount}</td>
                  <td>{item.reason} {item.reason_other && ` (${item.reason_other})`}</td>
                  <td>{item.remark}</td>
                  {(returnType === "fromCustomer" || returnType === "toSupplier") && <td>{item.customerSupplierName}</td>}
                  <td>
                    <button className="edit-btn" onClick={() => handleEditRow(index)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDeleteRow(index)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="button-group">
  <div className="print-pdf-section">
  <input
    type="text"
    placeholder="Enter Return Number"
    value={pdfReturnNumber}
    onChange={(e) => setPdfReturnNumber(e.target.value)}
  />
  <button className="print-btn" onClick={handlePrintPDFByNumber}>
    Print PDF
  </button>
</div>
  <button className="view-btn">View</button>
</div>
      </div>

      {alertConfig.show && (
        <AlertBox
          show={alertConfig.show}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
          onConfirm={alertConfig.onConfirm}
        />
      )}
    </div>
  );
}
