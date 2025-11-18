import React, { useState } from "react";
import Menu from "../componants/Menu";
import AlertBox from "../componants/Alertboxre";
import Namewithdateacc from "../componants/Namewithdateacc";
import "./sales.css";

const SalesPage = () => {
  const [saleType, setSaleType] = useState("cash");
  const [formData, setFormData] = useState({});
  const [tempData, setTempData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isNew, setIsNew] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [modifyIndex, setModifyIndex] = useState(null);

  // Alert state
  const [alertState, setAlertState] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const showAlert = (type, title, message, onConfirm = null) => {
    setAlertState({ show: true, type, title, message, onConfirm });
  };

  const handleCloseAlert = () => {
    setAlertState((prev) => ({ ...prev, show: false }));
  };

  const handleSaleTypeChange = (e) => {
    setSaleType(e.target.value);
    setFormData({});
    setTempData([]);
    setGridData([]);
    setSelectedRows([]);
    setIsNew(false);
    setIsModifyMode(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value.trim();
    let newForm = { ...formData, discountInput: value };

    // Calculate discountValue for this row
    if (value.endsWith("%")) {
      const perc = parseFloat(value.slice(0, -1));
      newForm.discountValue = !isNaN(perc) ? (parseFloat(formData.price || 0) * parseFloat(formData.qty || 0) * perc) / 100 : 0;
    } else {
      const amt = parseFloat(value);
      newForm.discountValue = !isNaN(amt) ? amt : 0;
    }
    setFormData(newForm);
  };

  const handleNew = () => {
    setFormData({});
    setTempData([]);
    setGridData([]);
    setIsNew(true);
    setIsModifyMode(false);
    setSelectedRows([]);
  };

  const handleAdd = () => {
    if (!formData.invoiceNo) {
      showAlert("error", "Validation Error", "Invoice No is required!");
      return;
    }
    const newRow = { ...formData, discountValue: formData.discountValue || 0, discountInput: formData.discountInput || "" };
    setTempData([...tempData, newRow]);
    setFormData({});
    showAlert("success", "Added", "Record added successfully!");
  };

  const handleRowSelect = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter((i) => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
      const allRows = [...tempData, ...gridData];
      setFormData(allRows[index]);
      setIsModifyMode(true);
      setModifyIndex(index);
    }
  };

  const handleModify = () => {
    if (modifyIndex === null) {
      showAlert("error", "Selection Error", "Select a row to modify!");
      return;
    }
    let allRows = [...tempData, ...gridData];
    allRows[modifyIndex] = { ...formData, discountValue: formData.discountValue || 0 };
    const newTemp = allRows.slice(0, tempData.length);
    const newGrid = allRows.slice(tempData.length);

    setTempData(newTemp);
    setGridData(newGrid);
    setSelectedRows([]);
    setFormData({});
    setIsModifyMode(false);
    setModifyIndex(null);
    showAlert("success", "Modified", "Record modified successfully!");
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      showAlert("error", "Selection Error", "Select at least one row to delete!");
      return;
    }

    showAlert(
      "question",
      "Confirm Delete",
      "Are you sure you want to delete selected row(s)?",
      () => {
        let allRows = [...tempData, ...gridData];
        const newRows = allRows.filter((_, i) => !selectedRows.includes(i));
        setTempData(newRows.slice(0, tempData.length));
        setGridData(newRows.slice(tempData.length));
        setSelectedRows([]);
        setFormData({});
        setIsModifyMode(false);
        handleCloseAlert();
        showAlert("success", "Deleted", "Selected row(s) deleted successfully!");
      }
    );
  };

  const handleSaveAll = () => {
    if ([...tempData, ...gridData].length === 0) {
      showAlert("error", "No Data", "No data to save!");
      return;
    }

    setTempData([]);
    setGridData([]);
    setFormData({});
    setSelectedRows([]);
    setIsNew(false);
    setIsModifyMode(false);
    setModifyIndex(null);
    showAlert("success", "Saved", "All records saved and grid cleared!");
  };

  const handleClear = () => {
    setFormData({});
    setTempData([]);
    setGridData([]);
    setSelectedRows([]);
    setIsModifyMode(false);
    showAlert("info", "Cleared", "Form cleared!");
  };

  // Totals calculations with per-row discount
  const totalAmount = [...tempData, ...gridData].reduce(
    (sum, row) => sum + (parseFloat(row.price || 0) * parseFloat(row.qty || 0)),
    0
  );

  const totalDiscount = [...tempData, ...gridData].reduce(
    (sum, row) => sum + (parseFloat(row.discountValue || 0)),
    0
  );

  const invoiceAmount = totalAmount - totalDiscount;

  return (
    <div className="sales-container">
      <Menu />
      <div className="sales-content">
        <Namewithdateacc />
        <h2>Sales Page</h2>

        {/* Sale Type */}
        <div className="sale-type">
          <label>
            <input
              type="radio"
              value="cash"
              checked={saleType === "cash"}
              onChange={handleSaleTypeChange}
            />
            Cash Sale
          </label>
          <label>
            <input
              type="radio"
              value="credit"
              checked={saleType === "credit"}
              onChange={handleSaleTypeChange}
            />
            Credit Sale
          </label>
        </div>

        {/* Form */}
        <div className="form-grid">
          <div className="form-lefts">
            <label>Invoice No</label>
            <input name="invoiceNo" value={formData.invoiceNo || ""} onChange={handleChange} />
            <label>Customer Code</label>
            <input name="customerCode" value={formData.customerCode || ""} onChange={handleChange} />
            <label>Customer Name</label>
            <input name="customerName" value={formData.customerName || ""} onChange={handleChange} />
            <label>Product Code</label>
            <input name="productCode" value={formData.productCode || ""} onChange={handleChange} />
            <label>Product Name</label>
            <input name="productName" value={formData.productName || ""} onChange={handleChange} />
            <label>Advance Pay</label>
            <input type="number" name="advancePay" value={formData.advancePay || ""} onChange={handleChange} />
            <label>Unit Price</label>
            <input type="number" name="price" value={formData.price || ""} onChange={handleChange} />
            <label>Quantity</label>
            <input type="number" name="qty" value={formData.qty || ""} onChange={handleChange} />
            <label>Discount (% or amount)</label>
            <input
              type="text"
              name="discountInput"
              value={formData.discountInput || ""}
              onChange={handleDiscountChange}
              placeholder="5% or 100"
            />
          </div>

         {saleType === "cash" ? (
            <div className="form-rights">
              <label>Manual Bill Date</label>
              <input type="date" name="date" value={formData.date || ""} onChange={handleChange} />
              <label>Manual Bill No</label>
              <input name="manualBillNo" value={formData.manualBillNo || ""} onChange={handleChange} />
              <label>Status</label>
              <input name="status" value={formData.status || ""} onChange={handleChange} />
              <label>Credit Limit</label>
              <input type="number" name="creditAmount" value={formData.creditAmount || ""} onChange={handleChange} />
              <label>Return Amount</label>
              <input type="number" name="returnAmount" value={formData.returnAmount || ""} onChange={handleChange} />
              <label>Previous Balance</label>
              <input type="number" name="previousAmount" value={formData.previousAmount || ""} onChange={handleChange} />
              <label>Total Recoverable Amount</label>
              <input type="number" name="recoverableAmount" value={formData.recoverableAmount || ""} onChange={handleChange} />
              {!isModifyMode && <button onClick={handleAdd}>Add</button>}

            </div>
          ) : (
            <div className="form-rights">
              <label>Manual Bill Date</label>
              <input type="date" name="date" value={formData.date || ""} onChange={handleChange} />
              <label>Manual Bill No</label>
              <input name="manualBillNo" value={formData.manualBillNo || ""} onChange={handleChange} />
              <label>Status</label>
              <input name="status" value={formData.status || ""} onChange={handleChange} />
              <label>Credit Limit</label>
              <input type="number" name="creditAmount" value={formData.creditAmount || ""} onChange={handleChange} />
              <label>Return Amount</label>
              <input type="number" name="returnAmount" value={formData.returnAmount || ""} onChange={handleChange} />
              <label>Previous Balance</label>
              <input type="number" name="previousBalance" value={formData.previousBalance || ""} onChange={handleChange} />
              <label>Total Recoverable Amount</label>
              <input type="number" name="recoverableAmount" value={formData.recoverableAmount || ""} onChange={handleChange} />
              <label>Last Payment Date</label>
              <input type="date" name="lastPaymentDate" value={formData.lastPaymentDate || ""} onChange={handleChange} />
              <label>Last Payment Amount</label>
              <input type="number" name="lastPaymentAmount" value={formData.lastPaymentAmount || ""} onChange={handleChange} />
              {!isModifyMode && <button onClick={handleAdd}>Add</button>}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="button-group1">
          {!isNew ? <button className="newbtn" onClick={handleNew}>New</button> : <button className="btnsave" onClick={handleSaveAll}>Save All</button>}
          <button className="btnclear" onClick={handleClear}>Clear</button>
          <button className="btnexit" onClick={() => { setFormData({}); setTempData([]); setGridData([]); setSelectedRows([]); setIsNew(false); setIsModifyMode(false); }}>Exit</button>
        </div>

        {/* Gridview */}
        <table className="grid-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Discount</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {[...tempData, ...gridData].map((row, index) => (
              <tr key={index} className={selectedRows.includes(index) ? "selected" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(index)}
                    onChange={() => handleRowSelect(index)}
                  />
                </td>
                <td>{row.invoiceNo}</td>
                <td>{row.customerName}</td>
                <td>{row.productName}</td>
                <td>{row.price}</td>
                <td>{row.qty}</td>
                <td>{row.discountValue.toFixed(2)}</td>
                <td>{((row.price * row.qty) - (row.discountValue || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedRows.length > 0 && (
          <div className="button-group1">
            <button className="btnmodify" onClick={handleModify}>Modify</button>
            <button className="btndelete" onClick={handleDelete}>Delete</button>
          </div>
        )}

        {/* Totals */}
        <div className="totals">
          <p>Total Amount: Rs {totalAmount.toFixed(2)}</p>
          <p>Total Discount: Rs {totalDiscount.toFixed(2)}</p>
          <p><b>Total Invoice Amount: Rs {invoiceAmount.toFixed(2)}</b></p>
        </div>

        {/* Print/View */}
        <div className="button-group1">
          <button className="btnprint" onClick={() => showAlert("info", "Print", "Print triggered")}>Print</button>
          <button className="btnview" onClick={() => showAlert("info", "View", "View details")}>View</button>
        </div>
      </div>

      {/* AlertBox */}
      <AlertBox
        show={alertState.show}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={handleCloseAlert}
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
};

export default SalesPage;
