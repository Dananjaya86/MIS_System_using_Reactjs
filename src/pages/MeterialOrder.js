import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./meterialordercs.css";

export default function MaterialOrderWindow() {
  const [formData, setFormData] = useState({
    orderNo: "",
    supplierCode: "",
    supplierName: "",
    productCode: "",
    productName: "",
    availableStock: "",
    orderQty: "",
    orderDate: "",
    amount: "",
  });

  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [advancePay, setAdvancePay] = useState(0);

  // input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add or update row to grid
  const handleAddOrUpdate = () => {
    if (isEditing) {
      const updatedOrders = [...orders];
      updatedOrders[editIndex] = formData;
      setOrders(updatedOrders);
      setIsEditing(false);
      setEditIndex(null);
    } else {
      setOrders([...orders, formData]);
    }

    // Clear product related fields, keep supplier
    setFormData((prev) => ({
      ...prev,
      productCode: "",
      productName: "",
      availableStock: "",
      orderQty: "",
      orderDate: "",
      amount: "",
    }));
  };

  // Edit row
  const handleEdit = (index) => {
    setFormData(orders[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  // Delete row
  const handleDelete = (index) => {
    const updatedOrders = orders.filter((_, i) => i !== index);
    setOrders(updatedOrders);
  };

  // Clear all
  const handleClear = () => {
    setFormData({
      orderNo: "",
      supplierCode: "",
      supplierName: "",
      productCode: "",
      productName: "",
      availableStock: "",
      orderQty: "",
      orderDate: "",
      amount: "",
    });
    setOrders([]);
    setAdvancePay(0);
    setIsEditing(false);
    setEditIndex(null);
  };

  // Calculate totals need to verify
  const totalAmount = orders.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0
  );
  const balance = totalAmount - parseFloat(advancePay || 0);

  return (

    <div className="container3">
      {/* Sidebar Menu */}
      <Menu />

      {/* Right Content */}
      <div className="content3">
        <h2>Material Order Window</h2>


        {/* Form */}
        <div className="form-section">
          
          <div className="form-left">
            <label>Order No:</label>
            <input name="orderNo" value={formData.orderNo} onChange={handleChange} />
            <label>Supplier Code:</label>
            <input name="supplierCode" value={formData.supplierCode} onChange={handleChange} />
            <label>Supplier Name:</label>
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} />
            <label>Product Code:</label>
            <input name="productCode" value={formData.productCode} onChange={handleChange} />
            <label>Product Name:</label>
            <input name="productName" value={formData.productName} onChange={handleChange} />
          </div>

          <div className="form-right">
            <label>Available Stock:</label>
            <input name="availableStock" value={formData.availableStock} onChange={handleChange} />
            <label>Order Qty:</label>
            <input name="orderQty" value={formData.orderQty} onChange={handleChange} />
            <label>Order Date:</label>
            <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} />
            <label>Amount:</label>
            <input name="amount" value={formData.amount} onChange={handleChange} />
          </div>
          
        </div>
        


        {/* Buttons */}
        <div className="buttons">
          <button className="btnaddmt" onClick={handleAddOrUpdate}>{isEditing ? "Update" : "Add"}</button>
          <button className="btnsavemt" onClick={handleClear}>Save</button>
          <button className="btnclearmt" onClick={handleClear}>Clear</button>
          <button className="btnexitmt">Exit</button>
        </div>


        {/* Gridview */}
        <table>
          <thead>
            <tr>
              <th>Order No</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Available Stock</th>
              <th>Order Qty</th>
              <th>Order Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row, index) => (
              <tr key={index}>
                <td>{row.orderNo}</td>
                <td>{row.productCode}</td>
                <td>{row.productName}</td>
                <td>{row.availableStock}</td>
                <td>{row.orderQty}</td>
                <td>{row.orderDate}</td>
                <td>{row.amount}</td>
                <td>
                  <button className="btnmodifymt" onClick={() => handleEdit(index)}>Modify</button>
                  <button className="btndeletemt" onClick={() => handleDelete(index)}>Delete</button>
                 
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/*show Summary  */}
        <div className="summary">
          <label>Total Order Amount:</label>
          <input value={totalAmount} readOnly />
          <label>Advance Pay:</label>
          <input
            type="number"
            value={advancePay}
            onChange={(e) => setAdvancePay(e.target.value)}
          />
          <label>Balance to be Paid:</label>
          <input value={balance} readOnly />
        </div>

        {/* Print and View  Buttons*/}
        <div className="buttons">
          <button className="btnprintmt">Print</button>
          <button className="btnviewmt">View</button>
        </div>
      </div>
    </div>
  );
}


