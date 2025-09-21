import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./expenses.css";

export default function Expenses() {
  const [form, setForm] = useState({
    expensesType: "",
    subExpenses: "",
    date: "",
    amount: "",
    paymentMode: "",
    account: "",
    paymentMadeBy: "",
    remarks: "",
  });

  const [gridData, setGridData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ Reset subExpenses if expensesType changes
    if (name === "expensesType") {
      setForm((prev) => ({
        ...prev,
        expensesType: value,
        subExpenses: "", // <-- Reset when type changes
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNew = () => {
    setForm({
      expensesType: "",
      subExpenses: "",
      date: "",
      amount: "",
      paymentMode: "",
      account: "",
      paymentMadeBy: "",
      remarks: "",
    });
    setIsAdding(true);
  };

  const handleAdd = () => {
    setGridData([...gridData, { ...form, id: Date.now() }]);
    setForm({
    expensesType: "",
    subExpenses: "",
    date: "",
    amount: "",
    paymentMode: "",
    account: "",
    paymentMadeBy: "",
    remarks: "",
  });
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
    alert("Expenses saved successfully!");
    setGridData([]);
  };

  return (
    <div className="expenses-container">
      <Menu />
      <div className="expenses-content">
        <h1 className="title">Expenses</h1>

        {/* Form Grid */}
        <div className="form-grid">
          {/* Left Column */}
          <div className="form-column">
            <label>Expenses Type</label>
            <select
              name="expensesType"
              value={form.expensesType}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Type</option>
              <option value="house">House</option>
              <option value="vehicle">Vehicle</option>
            </select>

            <label>Sub Expenses</label>
            <select
              name="subExpenses"
              value={form.subExpenses}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Sub Expense</option>
              {form.expensesType === "house" && (
                <>
                  <option value="food">Food</option>
                  <option value="ceb">CEB</option>
                  <option value="water">Water</option>
                </>
              )}
              {form.expensesType === "vehicle" && (
                <>
                  <option value="fuel">Fuel</option>
                  <option value="tyre">Tyre</option>
                </>
              )}
            </select>

            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="input-field"
            />

            <label>Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Right Column */}
          <div className="form-column">
            <label>Payment Mode</label>
            <select
              name="paymentMode"
              value={form.paymentMode}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Mode</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>

            <label>Account</label>
            <select
              name="account"
              value={form.account}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Account</option>
              <option value="handcash">On Hand Cash</option>
              <option value="bank">Bank Account</option>
            </select>

            <label>Payment Made By</label>
            <input
              name="paymentMadeBy"
              value={form.paymentMadeBy}
              onChange={handleChange}
              className="input-field"
            />

            <label>Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
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

        {/* Grid View */}
        <table className="data-grid">
          <thead>
            <tr>
              <th>Type</th>
              <th>Sub Expense</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Account</th>
              <th>Made By</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr key={row.id}>
                <td>{row.expensesType}</td>
                <td>{row.subExpenses}</td>
                <td>{row.date}</td>
                <td>{row.amount}</td>
                <td>{row.paymentMode}</td>
                <td>{row.account}</td>
                <td>{row.paymentMadeBy}</td>
                <td>{row.remarks}</td>
                <td className="action-buttons">
                  <button className="btn btn-edit" onClick={() => handleEdit(row.id)}>Edit</button>
                  <button className="btn btn-delete" onClick={() => handleDelete(row.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Save Button */}
        {gridData.length > 0 && (
          <button className="btn btn-save" onClick={handleSave}>Save</button>
        )}

        {/* Print / View Buttons */}
        <div className="button-group">
          <button className="btn btn-print">Print</button>
          <button className="btn btn-view">View</button>
        </div>
      </div>
    </div>
  );
}
