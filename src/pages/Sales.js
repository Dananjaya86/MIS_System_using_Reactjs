import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./sales.css";

const SalesPage = () => {
  const [saleType, setSaleType] = useState("cash");
  const [formData, setFormData] = useState({});
  const [tempData, setTempData] = useState([]); // Temporary rows
  const [gridData, setGridData] = useState([]); // Saved rows
  const [selectedRows, setSelectedRows] = useState([]);
  const [isNew, setIsNew] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [modifyIndex, setModifyIndex] = useState(null);

  const handleSaleTypeChange = (e) => {
    setSaleType(e.target.value);
    setFormData({});
    setTempData([]);
    setSelectedRows([]);
    setIsNew(false);
    setIsModifyMode(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNew = () => {
    setFormData({});
    setTempData([]);
    setIsNew(true);
    setIsModifyMode(false);
    setSelectedRows([]);
  };

  const handleAdd = () => {
    if (!formData.invoiceNo) {
      alert("Invoice No is required!");
      return;
    }
    setTempData([...tempData, formData]);
    setFormData({});
  };

  const handleRowSelect = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter((i) => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
      // Fill form for modify mode
      const allRows = [...tempData, ...gridData];
      setFormData(allRows[index]);
      setIsModifyMode(true);
      setModifyIndex(index);
    }
  };

  const handleModify = () => {
    if (modifyIndex === null) {
      alert("Select a row to modify!");
      return;
    }
    let allRows = [...tempData, ...gridData];
    allRows[modifyIndex] = formData;

    // Separate back to tempData and gridData
    const newTemp = allRows.slice(0, tempData.length);
    const newGrid = allRows.slice(tempData.length);

    setTempData(newTemp);
    setGridData(newGrid);
    setSelectedRows([]);
    setFormData({});
    setIsModifyMode(false);
    setModifyIndex(null);
    alert("Record modified!");
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert("Select at least one row to delete!");
      return;
    }
    let allRows = [...tempData, ...gridData];
    const newRows = allRows.filter((_, i) => !selectedRows.includes(i));
    setTempData(newRows.slice(0, tempData.length));
    setGridData(newRows.slice(tempData.length));
    setSelectedRows([]);
    setFormData({});
    setIsModifyMode(false);
    alert("Selected row(s) deleted!");
  };

  const handleSaveAll = () => {
  if ([...tempData, ...gridData].length === 0) {
    alert("No data to save!");
    return;
  }
  // Optionally, you can save data to server here

  // Clear all grids and form after save
  setTempData([]);
  setGridData([]);
  setFormData({});
  setSelectedRows([]);
  setIsNew(false);
  setIsModifyMode(false);
  setModifyIndex(null);
  alert("All records saved and grid cleared!");
};

  const handleClear = () => {
    setFormData({});
    setTempData([]);
    setSelectedRows([]);
    setIsModifyMode(false);
    alert("Form cleared!");
  };

  const totalAmount = [...tempData, ...gridData].reduce(
    (sum, row) => sum + (parseFloat(row.price || 0) * parseFloat(row.qty || 0)),
    0
  );
  const discount = totalAmount * 0.05;
  const invoiceAmount = totalAmount - discount;

  return (
    <div className="sales-container">
      <Menu />
      <div className="sales-content">
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
            <label>Price</label>
            <input type="number" name="price" value={formData.price || ""} onChange={handleChange} />
            <label>Quantity</label>
            <input type="number" name="qty" value={formData.qty || ""} onChange={handleChange} />
          </div>

          {saleType === "cash" ? (
            <div className="form-rights">
              <label>Date</label>
              <input type="date" name="date" value={formData.date || ""} onChange={handleChange} />
              <label>Manual Bill No</label>
              <input name="manualBillNo" value={formData.manualBillNo || ""} onChange={handleChange} />
              
              <label>Status</label>
              <input name="status" value={formData.status || ""} onChange={handleChange} />
              <label>Credit Limit</label>
              <input type="number" name="creditAmount" value={formData.creditAmount || ""} onChange={handleChange} />
              <label>Return Amount</label>
              <input type="number" name="returnAmount" value={formData.returnAmount || ""} onChange={handleChange} />
              <label>Previous Amount</label>
              <input type="number" name="previousAmount" value={formData.previousAmount || ""} onChange={handleChange} />
              {!isModifyMode && <button onClick={handleAdd}>Add</button>}
            </div>
          ) : (
            <div className="form-rights">
              <label>Date</label>
              <input type="date" name="date" value={formData.date || ""} onChange={handleChange} />
              <label>Manual Bill No</label>
              <input name="manualBillNo" value={formData.manualBillNo || ""} onChange={handleChange} />
              <label>Last Payment Date</label>
              <input type="date" name="lastPaymentDate" value={formData.lastPaymentDate || ""} onChange={handleChange} />
              <label>Last Payment Amount</label>
              <input type="number" name="lastPaymentAmount" value={formData.lastPaymentAmount || ""} onChange={handleChange} />
              <label>Return Amount</label>
              <input type="number" name="returnAmount" value={formData.returnAmount || ""} onChange={handleChange} />
              <label>Status</label>
              <input name="status" value={formData.status || ""} onChange={handleChange} />
              <label>Credit Amount</label>
              <input type="number" name="creditAmount" value={formData.creditAmount || ""} onChange={handleChange} />
              <label>Previous Balance</label>
              <input type="number" name="previousBalance" value={formData.previousBalance || ""} onChange={handleChange} />
              <label>Total Recoverable Amount</label>
              <input type="number" name="recoverableAmount" value={formData.recoverableAmount || ""} onChange={handleChange} />
              {!isModifyMode && <button onClick={handleAdd}>Add</button>}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="button-group1">
          {!isNew ? <button className="newbtn" onClick={handleNew}>New</button> : <button className="btnsave" onClick={handleSaveAll} >Save All</button>}
          <button className="btnclear" onClick={handleClear}>Clear</button>
          <button className="btnexit" onClick={() => { setFormData({}); setTempData([]); setSelectedRows([]); setIsNew(false); setIsModifyMode(false); }}>Exit</button>
        </div>

        {/* Grid */}
        <table className="grid-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
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
                <td>{(row.price * row.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modify / Delete */}
        {selectedRows.length > 0 && (
          <div className="button-group1">
            <button className="btnmodify" onClick={handleModify}>Modify</button>
            <button className="btndelete" onClick={handleDelete}>Delete</button>
          </div>
        )}

        {/* Totals */}
        <div className="totals">
          <p>Total Amount: Rs {totalAmount.toFixed(2)}</p>
          <p>Discount (5%): Rs {discount.toFixed(2)}</p>
          <p><b>Total Invoice Amount: Rs {invoiceAmount.toFixed(2)}</b></p>
        </div>

        {/* Print/View */}
        <div className="button-group1">
          <button className="btnprint" onClick={() => alert("Print triggered")}>Print</button>
          <button className="btnview" onClick={() => alert("View details")}>View</button>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
