import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./paymentsetoff.css"; 

export default function PaymentSetoff() {
  const [type, setType] = useState("select");
  const [form, setForm] = useState({
    invoiceNumber: "",
    code: "",
    name: "",
    manualBillNo: "",
    totalCredit: "",
    paidAmount: "",
    advancePayment: "",
    balanceAmount: "",
  });
  const [gridData, setGridData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNew = () => {
    setForm({
      invoiceNumber: "",
      code: "",
      name: "",
      manualBillNo: "",
      totalCredit: "",
      paidAmount: "",
      advancePayment: "",
      balanceAmount: "",
    });
    setIsAdding(true);
  };

  const handleAdd = () => {
    setGridData([...gridData, { ...form, id: Date.now() }]);
    setIsAdding(false);
  };

  const handleEdit = (id) => {
    const item = gridData.find((row) => row.id === id);
    if (item) {
      setForm(item);
      setIsAdding(true);
      setGridData(gridData.filter((row) => row.id !== id));
    }
  };

  const handleDelete = (id) => {
    setGridData(gridData.filter((row) => row.id !== id));
  };

  const handleSave = () => {
    alert("Data saved successfully!");
    setGridData([]);
  };

  return (
    <div className="payment-setoff-container">
      <Menu />
      <div className="payment-setoff-content">
        <h1 className="title">Payment Setoff</h1>


        {/* Type Selector */}
        <div className="type-selector">
          <label className="label-bold">Select Type: </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field"
          >
            <option value="select">Select Type </option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            
          </select>
        </div>


        {/* Form */}
        <div className="form-grid">
          <div className="form-column">
            
            <label>{type === "customer" ? "Invoice Number" : "GRN Number"}</label>
            <input
              name="invoiceNumber"
              value={form.invoiceNumber}
              onChange={handleChange}
              className="input-field"
            />
            <label>{type === "customer" ? "Customer Code" : "Supplier Code"}</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              className="input-field"
            />
            <label>{type === "customer" ? "Customer Name" : "Supplier Name"}</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
            />
             <label>Manual Bill Number</label>
            <input
              name="manualBillNo"
              value={form.manualBillNo}
              onChange={handleChange}
              className="input-field"
            />


          </div>

          <div className="form-column">
            
            <label>Total Credit Amount</label>
            <input
              name="totalCredit"
              value={form.totalCredit}
              onChange={handleChange}
              className="input-field"
            />
            <label>Paid Amount</label>
            <input
              name="paidAmount"
              value={form.paidAmount}
              onChange={handleChange}
              className="input-field"
            />
            <label>Advance Payment</label>
            <input
              name="advancePayment"
              value={form.advancePayment}
              onChange={handleChange}
              className="input-field"
            />
            <label>Balance Amount</label>
            <input
              name="balanceAmount"
              value={form.balanceAmount}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>


        {/* Buttons */}
        <div className="button-group">
          <button className="btn btn-new" onClick={handleNew}>New</button>

          {isAdding && (
            <>
              <button className="btn btn-add" onClick={handleAdd}>Add</button>
              <button className="btn btn-clear" onClick={handleNew}>Clear</button>
            </>
          )}

          <button className="btn btn-exit">Exit</button>
        </div>


        {/* Gridview */}
        <table className="data-grid">
          <thead>
            <tr>
              
              <th>{type === "customer" ? "Invoice No" : "GRN No"}</th>
              <th>{type === "customer" ? "Customer" : "Supplier"}</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr key={row.id}>
                <td>{row.invoiceNumber}</td>
                <td>{row.name}</td>
                <td>{row.paidAmount}</td>
                <td>{row.balanceAmount}</td>
                <td className="action-buttons">
                  <button className="btn btn-edit" onClick={() => handleEdit(row.id)}>Edit</button>
                  <button className="btn btn-delete" onClick={() => handleDelete(row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>


        {/* Save Button frm google */}
        {gridData.length > 0 && (
          <button className="btn btn-save" onClick={handleSave}>Save</button>
        )}

        {/* Print and View Buttons */}
        <div className="button-group">
          <button className="btn btn-print">Print</button>
          <button className="btn btn-view">View</button>
        </div>
      </div>
    </div>
  );
}
