import React, { useState, useEffect } from "react";
import "./reconcile.css";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBox from "../componants/Alertboxre";


export default function ReconcileModal({ ledgerEntries, onClose }) {
  const [bankRows, setBankRows] = useState([]);
  const [localLedger, setLocalLedger] = useState([]);
  const [selectedBankForLedger, setSelectedBankForLedger] = useState({});

  
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const pages = Math.max(1, Math.ceil(localLedger.length / rowsPerPage));

  const paginatedLedger = localLedger.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0]; 
};

  useEffect(() => {
  fetch(`http://localhost:5000/api/reconcile/pending?page=${page}`)
    .then(res => res.json())
    .then(data => {
      const rows = data.rows || [];

      setLocalLedger(
        rows.map((r, i) => ({
          id: i + 1 + (page - 1) * rowsPerPage,
          date: r.date,
          referenceNo: r.reference_no,
          amount: r.amount,
          paymentMode: r.payment_mode,
          status: r.status || "Pending",
          remark: ""
        }))
      );
    })
    .catch(console.error);
}, [page]);

const [alert, setAlert] = useState({
  show: false,
  type: "info",
  title: "",
  message: "",
  onConfirm: null,
});

const showAlert = (type, title, message, onConfirm = null) => {
  setAlert({
    show: true,
    type,
    title,
    message,
    onConfirm,
  });
};




useEffect(() => {
  fetch("http://localhost:5000/api/reconcile/pending-statements")
    .then(res => res.json())
    .then(data => {
      setBankRows(
        data.map((b, i) => ({
          id: i + 100000,
          date: formatDate(b.statment_date), 
          reference: b.statment_reference,
          amount: b.statment_amount,
          paymentMode: b.payment_mode,
          status: b.status || "Pending",
          fromDB: true
        }))
      );
    })
    .catch(console.error);
}, []);


const closeAlert = () =>
  setAlert((a) => ({ ...a, show: false, onConfirm: null }));








const deleteBankRow = (row) => {
  
  if (row.fromDB && (!row.date || row.date === "")) {
    showAlert("error", "Delete Failed", "Bank date is invalid.");
    return;
  }

  
  if (!row.fromDB) {
    setBankRows(prev => prev.filter(b => b.id !== row.id));
    showAlert("success", "Deleted", "Bank entry removed.");
    return;
  }

  
  showAlert(
    "question",
    "Delete Bank Entry",
    "This will permanently delete this bank entry. Continue?",
    async () => {
      try {
        const dateObj = new Date(row.date + "T00:00:00"); 

        const res = await fetch("http://localhost:5000/api/reconcile/delete-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: row.date,
            reference: row.reference,
            amount: Number(row.amount),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          
          showAlert("error", "Delete Failed", data.message || "Failed to delete bank entry.");
          return;
        }

        if (data.message !== "Deleted successfully") {
          showAlert("error", "Delete Failed", data.message);
          return;
        }

        
        setBankRows(prev => prev.filter(b => b.id !== row.id));
        showAlert("success", "Deleted", "Bank entry removed successfully.");
      } catch (err) {
        
        showAlert("error", "Error", err.message || "Something went wrong.");
      }
    }
  );
};




  const addBankRow = () =>
  setBankRows(prev => [
    ...prev,
    {
      id: Date.now(),
      date: "",
      reference: "",
      amount: "",
      paymentMode: "",
      status: "Pending",
      fromDB: false   
    },
  ]);

  const updateBankRow = (id, field, value) =>
    setBankRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );

  const updateRemark = (ledgerId, remark) =>
    setLocalLedger(prev =>
      prev.map(l => (l.id === ledgerId ? { ...l, remark } : l))
    );


const handleSaveAndClose = async () => {
  if (localLedger.length === 0 && bankRows.length === 0) {
    showAlert("info", "Nothing to Save", "There are no ledger or bank entries to save.");
    return;
  }

  const payload = {
    username: localStorage.getItem("username"),
    ledgerRows: localLedger,
    bankRows: bankRows,
  };

  try {
    const res = await fetch("http://localhost:5000/api/reconcile/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to save reconciliation");
    }

    showAlert("success", "Saved", data.message, () => {
      
      setLocalLedger([]);
      setBankRows([]);
      onClose(); 
    });

  } catch (err) {
    showAlert("error", "Error", err.message);
  }
};


  

const normalizeDate = (d) =>
  d ? new Date(d).toISOString().split("T")[0] : "";

const handleMatch = (ledgerId, bankId) => {
  if (!ledgerId || !bankId) return;

  const ledger = localLedger.find(l => l.id === ledgerId);
  const bank = bankRows.find(b => b.id === Number(bankId));
  if (!ledger || !bank) return;

  const diffs = [];

  if (normalizeDate(ledger.date) !== normalizeDate(bank.date)) diffs.push("date");
  if (
    String(ledger.referenceNo || "").trim() !==
    String(bank.reference || "").trim()
  ) diffs.push("reference");
  if (Number(ledger.amount) !== Number(bank.amount)) diffs.push("amount");

  const mismatch = diffs.length > 0;

  if (mismatch && (!ledger.remark || ledger.remark.trim() === "")) {
    showAlert(
      "warning",
      "Mismatch Detected",
      `Ledger and Bank ${diffs.join(" and ")} do not match.\nPlease enter a remark.`
    );
    return;
  }

  if (mismatch) {
    showAlert(
      "question",
      "Confirm Mismatch Match",
      `Ledger and Bank ${diffs.join(" and ")} do not match.\n\nYour remark:\n"${ledger.remark}"\n\nMatch anyway?`,
      () => finalizeMatch(ledgerId, bank.id)
    );
    return;
  }

  finalizeMatch(ledgerId, bank.id);
};

const finalizeMatch = (ledgerId, bankId) => {
  setLocalLedger(prev =>
    prev.map(l =>
      l.id === ledgerId ? { ...l, status: "Cleared" } : l
    )
  );

  setBankRows(prev =>
    prev.map(b =>
      b.id === bankId
        ? { ...b, paymentMode: localLedger.find(l => l.id === ledgerId)?.paymentMode, status: "Cleared" }
        : b
    )
  );

  showAlert("success", "Matched", "Transaction successfully reconciled.");
};


  return (
    <div className="modal-overlayrec">
      <div className="modal-boxrec">
        <div className="modal-headerrec">
          <h3>Bank Reconciliation</h3>
          <Namewithdateacc />
          <button className="btn-exitrec" onClick={() => onClose(null)}>✕</button>
        </div>

        <div className="modal-gridsrec">
          <div className="modal-gridrec">
            <h4>Ledger Entries</h4>
            <div className="table-wrapperrec">
              <table className="table-rec">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ref</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>Remark</th>
                    <th>Bank Row</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLedger.map(row => (
                    <tr key={row.id} className={`ledger-rowrec ${row.status === "Cleared" ? "row-clearedrec" : ""}`}>
                      <td>{row.date}</td>
                      <td>{row.referenceNo}</td>
                      <td>{row.amount}</td>
                      <td>{row.paymentMode || "-"}</td>
                      <td className={`status-rec ${row.status.toLowerCase()}`}>{row.status}</td>
                      <td>
                        {row.status === "Cleared" ? row.remark : (
                          <input
                            className="input-rec"
                            value={row.remark || ""}
                            onChange={(e) => updateRemark(row.id, e.target.value)}
                          />
                        )}
                      </td>
                      <td>
                        <select
                          disabled={row.status === "Cleared"}
                          className="select-rec"
                          value={selectedBankForLedger[row.id] || ""}
                          onChange={(e) =>
                            setSelectedBankForLedger(prev => ({ ...prev, [row.id]: e.target.value }))
                          }
                        >
                          <option value="">Select Bank</option>
                          {bankRows
  .filter(b => b.status === "Pending")
  .map((b) => (
    <option key={b.id} value={b.id}>
      {b.date} - {b.amount}
    </option>
))}
                        </select>
                      </td>
                      <td>
                        {row.status === "Pending" && (
                          <button
                            className="btn-matchrec"
                            disabled={!selectedBankForLedger[row.id]}
                            onClick={() => handleMatch(row.id, selectedBankForLedger[row.id])}
                          >
                            Match
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination-rec">
                <button className="page-btnrec" disabled={page === 1} onClick={() => setPage(p => p - 1)}>◀</button>
                <span className="page-inforec">{page} / {pages}</span>
                <button className="page-btnrec" disabled={page === pages} onClick={() => setPage(p => p + 1)}>▶</button>
              </div>
            </div>
          </div>

          {/* Bank manual */}
<div className="modal-gridrec">
  <h4>Bank Manual Entry</h4>
  <button className="btn-add-rowrec" onClick={addBankRow}>
    + Add Bank Row
  </button>

  {bankRows.map((b) => (
    <div
      key={b.id}
      className={`bank-rowrec ${
        b.status === "Cleared" ? "row-clearedrec" : ""
      }`}
    >
      <input
        type="date"
        value={formatDate(b.date)}
        className="input-rec"
        readOnly={b.status === "Cleared"}
        onChange={(e) => updateBankRow(b.id, "date", e.target.value)}
      />

      <input
        type="text"
        placeholder="Reference"
        value={b.reference}
        className="input-rec"
        readOnly={b.status === "Cleared"}
        onChange={(e) => updateBankRow(b.id, "reference", e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        value={b.amount}
        className="input-rec"
        readOnly={b.status === "Cleared"}
        onChange={(e) => updateBankRow(b.id, "amount", e.target.value)}
      />

      <input
        type="text"
        className="input-rec"
        value={b.paymentMode || ""}
        readOnly
      />

      <input
        type="text"
        value={b.status}
        className="input-rec"
        readOnly
      />

      {/*  DELETE BUTTON */}
      {b.status === "Pending" && (
        <button
          className="btn-delrec"
          title="Delete"
          onClick={() => deleteBankRow(b)}
        >
          ❌
        </button>
      )}
    </div>
  ))}
</div>
        </div>

        <div className="modal-footerrec">
          <button className="btn-saverec" onClick={handleSaveAndClose}>
    Save & Close
  </button>
  <button className="btn-exitrec" onClick={() => onClose(null)}>Exit</button>
        </div>
      </div>
      <AlertBox
  show={alert.show}
  type={alert.type}
  title={alert.title}
  message={alert.message}
  onClose={closeAlert}
  onConfirm={alert.onConfirm}
/>

    </div>
  );
}
