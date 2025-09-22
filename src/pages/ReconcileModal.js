import React, { useState, useEffect } from "react";
import "./bank.css";

export default function ReconcileModal({ ledgerEntries, onClose }) {
  const [bankRows, setBankRows] = useState([]);
  const [localLedger, setLocalLedger] = useState([]);
  const [selectedBankForLedger, setSelectedBankForLedger] = useState({});

  useEffect(() => {
    setLocalLedger(ledgerEntries);
  }, [ledgerEntries]);

  const addBankRow = () => {
    setBankRows((prev) => [
      ...prev,
      { id: Date.now(), date: "", reference: "", amount: 0, status: "Pending" },
    ]);
  };

  const updateBankRow = (id, field, value) => {
    setBankRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const updateRemark = (ledgerId, remark) => {
    setLocalLedger((prev) =>
      prev.map((l) => (l.id === ledgerId ? { ...l, remark } : l))
    );
  };

  const handleMatch = (ledgerId, bankId) => {
    if (!ledgerId || !bankId) return;
    const ledger = localLedger.find((l) => l.id === ledgerId);
    const bank = bankRows.find((b) => b.id === Number(bankId));
    if (!ledger || !bank) return;

    const mismatch =
      ledger.date !== bank.date || Number(ledger.amount) !== Number(bank.amount);

    if (mismatch && (!ledger.remark || ledger.remark.trim() === "")) {
      alert("Enter remark for unmatched transaction before matching.");
      return;
    }

    // Clear matched
    setLocalLedger((prev) =>
      prev.map((l) => (l.id === ledgerId ? { ...l, status: "Cleared" } : l))
    );
    setBankRows((prev) =>
      prev.map((b) => (b.id === bank.id ? { ...b, status: "Cleared" } : b))
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Bank Reconciliation</h3>
        <div className="modal-grids">
          <div className="modal-grid">
            <h4>Ledger Entries</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ref</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Remark</th>
                  <th>Bank Row</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {localLedger.map((row) => (
                  <tr key={row.id} className={row.status === "Cleared" ? "row-cleared" : ""}>
                    <td>{row.date}</td>
                    <td>{row.referenceNo}</td>
                    <td>{row.amount}</td>
                    <td>{row.status}</td>
                    <td>
                      {row.status === "Cleared" ? (
                        row.remark
                      ) : (
                        <input
                          type="text"
                          placeholder="Remark if mismatch"
                          value={row.remark || ""}
                          onChange={(e) => updateRemark(row.id, e.target.value)}
                        />
                      )}
                    </td>
                    <td>
                      <select
                        disabled={row.status === "Cleared"}
                        value={selectedBankForLedger[row.id] || ""}
                        onChange={(e) =>
                          setSelectedBankForLedger((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Bank Row</option>
                        {bankRows.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.date} - {b.amount}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {row.status === "Pending" && (
                        <button
                          className="btn-match"
                          onClick={() => handleMatch(row.id, selectedBankForLedger[row.id])}
                          disabled={!selectedBankForLedger[row.id]}
                        >
                          Match
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-grid">
            <h4>Bank Manual Entry</h4>
            <button className="btn-add-row" onClick={addBankRow}>
              + Add Bank Row
            </button>
            {bankRows.map((b) => (
              <div
                key={b.id}
                className={b.status === "Cleared" ? "row-cleared bank-row" : "bank-row"}
              >
                <input
                  type="date"
                  value={b.date}
                  readOnly={b.status === "Cleared"}
                  onChange={(e) => updateBankRow(b.id, "date", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Reference"
                  value={b.reference}
                  readOnly={b.status === "Cleared"}
                  onChange={(e) => updateBankRow(b.id, "reference", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={b.amount}
                  readOnly={b.status === "Cleared"}
                  onChange={(e) => updateBankRow(b.id, "amount", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-save" onClick={() => onClose(localLedger)}>
            Save & Close
          </button>
          <button className="btn-exit" onClick={() => onClose(null)}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
