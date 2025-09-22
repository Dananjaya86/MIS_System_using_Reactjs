import React, { useState } from "react";
import Menu from "../componants/Menu";
import ReconcileModal from "./ReconcileModal";
import "./bank.css";

export default function Bank() {
  const [form, setForm] = useState({
    transactionType: "",
    date: "",
    referenceNo: "",
    account: "",
    mode: "",
    amount: "",
    description: "",
    status: "Pending",
  });

  const [gridData, setGridData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleNew = () => {
    setForm({
      transactionType: "",
      date: "",
      referenceNo: "",
      account: "",
      mode: "",
      amount: "",
      description: "",
      status: "Pending",
    });
    setIsAdding(true);
  };

  const handleAdd = () => {
    setGridData((g) => [...g, { ...form, id: Date.now(), remark: "" }]);
    handleNew();
  };

  const handleEdit = (id) => {
    const item = gridData.find((r) => r.id === id);
    if (item) {
      setForm(item);
      setGridData((g) => g.filter((r) => r.id !== id));
      setIsAdding(true);
    }
  };

  const handleDelete = (id) => {
    setGridData((g) => g.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    alert("Transactions saved (demo).");
    setGridData([]);
  };

  return (
    <div className="bank-containerbn">
      <Menu />
      <div className="bank-contentbn">
        <h1 className="titlebn">Bank Transactions & Reconciliation</h1>

        {/* Form Box */}
        <div className="form-boxbn">
          <div className="form-grid-two-columnbn">
            <div className="form-itembn">
              <label>Transaction Type</label>
              <select
                name="transactionType"
                value={form.transactionType}
                onChange={handleChange}
                className="input-fieldbn"
              >
                <option value="">Select Type</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div className="form-itembn">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="input-fieldbn"
              />
            </div>

            <div className="form-itembn">
              <label>Reference No</label>
              <input
                name="referenceNo"
                value={form.referenceNo}
                onChange={handleChange}
                className="input-fieldbn"
              />
            </div>

            <div className="form-itembn">
              <label>Account</label>
              <select
                name="account"
                value={form.account}
                onChange={handleChange}
                className="input-fieldbn"
              >
                <option value="">Select Account</option>
                <option value="acc1">Bank Account 1</option>
                <option value="acc2">Bank Account 2</option>
              </select>
            </div>

            <div className="form-itembn">
              <label>Mode</label>
              <select
                name="mode"
                value={form.mode}
                onChange={handleChange}
                className="input-fieldbn"
              >
                <option value="">Select Mode</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>

            <div className="form-itembn">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="input-fieldbn"
              />
            </div>

            <div className="form-itembn">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input-fieldbn"
              />
            </div>

            <div className="form-itembn">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="input-fieldbn"
              >
                <option value="Pending">Pending</option>
                <option value="Cleared">Cleared</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="button-groupbn">
          <button className="btnbn btn-newbn" onClick={handleNew}>New</button>
          {isAdding && <button className="btnbn btn-addbn" onClick={handleAdd}>Add</button>}
          <button className="btnbn btn-clearbn" onClick={handleNew}>Clear</button>
          <button className="btnbn btn-exitbn" onClick={() => window.close?.() || null}>Exit</button>
        </div>

        {/* Data Grid */}
        <table className="data-gridbn">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Account</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Description</th>
              <th>Remark</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((r) => (
              <tr key={r.id} className={r.status === "Cleared" ? "row-clearedbn" : ""}>
                <td>{r.date}</td>
                <td>{r.transactionType}</td>
                <td>{r.referenceNo}</td>
                <td>{r.account}</td>
                <td>{r.mode}</td>
                <td>{r.amount}</td>
                <td>{r.status}</td>
                <td>{r.description}</td>
                <td>{r.remark}</td>
                <td>
                  {r.status !== "Cleared" && (
                    <>
                      <button className="btnbn btn-editbn" onClick={() => handleEdit(r.id)}>Edit</button>
                      <button className="btnbn btn-deletebn" onClick={() => handleDelete(r.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {gridData.length > 0 && (
          <button className="btnbn btn-savebn" onClick={handleSave}>Save</button>
        )}

        <div className="button-groupbn">
          <button className="btnbn btn-reconcilebn" onClick={() => setShowReconcile(true)}>Open Reconciliation</button>
        </div>

        {showReconcile && (
          <ReconcileModal
            ledgerEntries={gridData}
            onClose={(updatedLedger) => {
              if (updatedLedger) setGridData(updatedLedger);
              setShowReconcile(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
