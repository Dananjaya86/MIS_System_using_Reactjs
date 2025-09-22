import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./return.css";

export default function ReturnItems() {
  const [returnType, setReturnType] = useState("select");
  const [formData, setFormData] = useState({
    productCode: "",
    productName: "",
    qty: "",
    dispatchNo: "",
    amount: "",
    remark: "",
    customerSupplierName: ""
  });
  const [gridData, setGridData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddClear, setShowAddClear] = useState(false);

  // return type change in the system
  const handleReturnTypeChange = (e) => {
    const type = e.target.value;
    setReturnType(type);
    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      remark: "",
      customerSupplierName: ""
    });
    setEditingIndex(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNew = () => {
    setShowAddClear(true);
    setEditingIndex(null);
    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      remark: "",
      customerSupplierName: ""
    });
  };

  const handleAdd = () => {
    if (!formData.productCode || !formData.productName || !formData.qty) {
      alert("Please fill required fields!");
      return;
    }

    if (editingIndex !== null) {

      // update row
      const updatedData = [...gridData];
      updatedData[editingIndex] = formData;
      setGridData(updatedData);
      setEditingIndex(null);
      alert("Row updated!");
    } else {

      // Add new row
      setGridData([...gridData, formData]);
      alert("Item added to grid!");
    }

    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      remark: "",
      customerSupplierName: ""
    });
  };

  const handleEditRow = (index) => {
    setFormData(gridData[index]);
    setEditingIndex(index);
    setShowAddClear(true);
  };

  const handleDeleteRow = (index) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const updatedData = gridData.filter((_, i) => i !== index);
      setGridData(updatedData);
      if (editingIndex === index) setEditingIndex(null);
    }
  };

  const handleSave = () => {
    alert("Data saved successfully!");
    setShowAddClear(false);
    setEditingIndex(null);
  };

  const handleExit = () => {
    setShowAddClear(false);
    setEditingIndex(null);
  };

  const handleClear = () => {
    setFormData({
      productCode: "",
      productName: "",
      qty: "",
      dispatchNo: "",
      amount: "",
      remark: "",
      customerSupplierName: ""
    });
    setEditingIndex(null);
  };

  return (
    <div className="return-items-container">
      <Menu />
      <div className="return-items-content">
        <h2>Return Items</h2>

        <select value={returnType} onChange={handleReturnTypeChange}>
          <option value="select">Select One</option>
          <option value="toStock">To Stock</option>
          <option value="fromCustomer">From Customer</option>
          <option value="toSupplier">To Supplier</option>
        </select>

        {/* form Box inside the fields */}
        <div className="form-box">
          <div className="form-section">
            <div className="form-column">
              <label>Product Code</label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
              />

              <label>Product Name</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
              />

              <label>Quantity</label>
              <input
                type="number"
                name="qty"
                value={formData.qty}
                onChange={handleInputChange}
              />

              <label>
                {returnType === "toStock" ? "Dispatch No" : "Invoice No"}
              </label>
              <input
                type="text"
                name="dispatchNo"
                placeholder={returnType === "toStock" ? "Dispatch No" : "Invoice No"}
                value={formData.dispatchNo}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-column">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
              />

              <label>Remark</label>
              <input
                type="text"
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
              />

              {(returnType === "fromCustomer" || returnType === "toSupplier") && (
                <>
                  <label>
                    {returnType === "fromCustomer" ? "Customer Name" : "Supplier Name"}
                  </label>
                  <input
                    type="text"
                    name="customerSupplierName"
                    value={formData.customerSupplierName}
                    onChange={handleInputChange}
                  />
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
            <button className="add-btn" onClick={handleAdd}>
              {editingIndex !== null ? "Update" : "Add"}
            </button>
            <button className="clear-btn" onClick={handleClear}>Clear</button>
            <button className="exit-btn" onClick={handleExit}>Exit</button>
          </div>
        )}

        {/* gridview */}
        {gridData.length > 0 && (
          <>
            <button className="save-btn" onClick={handleSave}>Save</button>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Qty</th>
                  <th>{returnType === "toStock" ? "Dispatch No" : "Invoice No"}</th>
                  <th>Amount</th>
                  <th>Remark</th>
                  {(returnType === "fromCustomer" || returnType === "toSupplier") && (
                    <th>{returnType === "fromCustomer" ? "Customer Name" : "Supplier Name"}</th>
                  )}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((item, index) => (
                  <tr
                    key={index}
                    className={editingIndex === index ? "editing-row" : ""}
                  >
                    <td>{item.productCode}</td>
                    <td>{item.productName}</td>
                    <td>{item.qty}</td>
                    <td>{item.dispatchNo}</td>
                    <td>{item.amount}</td>
                    <td>{item.remark}</td>
                    {(returnType === "fromCustomer" || returnType === "toSupplier") && (
                      <td>{item.customerSupplierName}</td>
                    )}
                    <td>
                      <button className="edit-btn" onClick={() => handleEditRow(index)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDeleteRow(index)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="button-group">
          <button className="print-btn">Print</button>
          <button className="view-btn">View</button>
        </div>
      </div>
    </div>
  );
}
