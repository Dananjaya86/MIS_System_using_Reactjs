
import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import ReconcileModal from "./ReconcileModal";
import "./bank.css";
import Namewithdateacc from "../componants/Namewithdateacc"

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

  const [accounts, setAccounts] = useState([]);
  const username = localStorage.getItem("username");
  const [isLocked, setIsLocked] = useState(true); 
  const [showCheque, setShowCheque] = useState(false);

  const [cheque, setCheque] = useState({bank: "",branch: "",chequeNumber: ""});
  const [showReturnSetoff, setShowReturnSetoff] = useState(false);

  const [showReturnCheque, setShowReturnCheque] = useState(false);

 const [searchCheque, setSearchCheque] = useState("");



const [returnCheque, setReturnCheque] = useState({
  chequeNo: "",
  chequeDate: "",
  bank: "",
  branch: "",
  paymentMode: "",
  returnCharge: "",
  chequeAmount: "",
  totalAmount: "",
  payee: "",
  reason: ""
});

const [chequeGrid, setChequeGrid] = useState([]);


  const [gridData, setGridData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);


const [showSetoffPopup, setShowSetoffPopup] = useState(false);
const [setoffRow, setSetoffRow] = useState(null);


const [settledSetoffCheques, setSettledSetoffCheques] = useState([]);


const [setoff, setSetoff] = useState({
  cheque_no: "",
  cheque_date: "",
  cheque_amount: 0,
  original_amount: 0,
  setoff_amount: 0,
  setoff_date: "",
  balance_amount: 0,
  remarks: ""
});

  const formatMoney = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


  
  useEffect(() => {
  fetch("http://localhost:5000/api/bank/accounts")
    .then(res => res.json())
    .then(data => setAccounts(data));
}, []);

useEffect(() => {
  fetch("http://localhost:5000/api/bank/cheque/list")
    .then(res => res.json())
    .then(data => setChequeGrid(data))
    .catch(err => console.error(err));
}, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  

  const handleAdd = () => {
  setGridData((g) => [
    ...g,
    {
      ...form,
      id: Date.now(),
      remark: "",
      bank: cheque.bank,
      branch: cheque.branch,
      cheque_number: cheque.chequeNumber
    },
  ]);

  setCheque({ bank: "", branch: "", chequeNumber: "" });
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

  setIsLocked(false); 
  setIsAdding(true);
};

const handleClear = () => {
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
};

useEffect(() => {
  const charge = Number(returnCheque.returnCharge) || 0;
  const amt = Number(returnCheque.chequeAmount) || 0;

  let total = 0;

  
  if (returnCheque.paymentMode === "deposit" || returnCheque.paymentMode === "issue") {
    total = amt + charge;
  } else {
    total = amt; 
  }

  setReturnCheque((prev) => ({
    ...prev,
    totalAmount: total
  }));
}, [
  returnCheque.paymentMode,
  returnCheque.returnCharge,
  returnCheque.chequeAmount
]);


const handleReturnChequeEnter = async () => {
  try {
    const payload = {
      cheque_no: returnCheque.chequeNo,
      date: returnCheque.chequeDate,
      bank: returnCheque.bank,
      branch: returnCheque.branch,
      type: returnCheque.paymentMode,
      cheque_amount: returnCheque.chequeAmount,
      return_amount: returnCheque.returnCharge,
      total_amount: returnCheque.totalAmount,
      payee: returnCheque.payee,
      reason: returnCheque.reason,
      username: username
    };

    const res = await fetch("http://localhost:5000/api/bank/cheque/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    
    const listRes = await fetch("http://localhost:5000/api/bank/cheque/list");
    const list = await listRes.json();
    setChequeGrid(list);

    
    setReturnCheque({
      chequeNo: "",
      chequeDate: "",
      bank: "",
      branch: "",
      paymentMode: "",
      returnCharge: "",
      chequeAmount: "",
      totalAmount: "",
      payee: "",
      reason: ""
    });

    setShowReturnCheque(false); 
    alert("Cheque return saved!");

  } catch (err) {
    alert(err.message);
  }
};



const handleSetoffSave = async () => {
  if (!setoff.setoff_amount || !setoff.setoff_date) {
    alert("Setoff amount & date required");
    return;
  }

  const payload = {
  cheque_no: setoff.cheque_no,
  cheque_date: setoff.cheque_date,
  cheque_amount: setoff.cheque_amount,
  setoff_amount: setoff.setoff_amount,
  setoff_date: setoff.setoff_date,
  balance_amount: setoff.balance_amount,
  original_balance: setoff.original_amount, 
  remaks: setoff.remarks,
  username
};

  try {
    const res = await fetch("http://localhost:5000/api/bank/return-setoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert("Setoff saved!");
    setShowSetoffPopup(false);

    
    const listRes = await fetch("http://localhost:5000/api/bank/cheque/list");
    const list = await listRes.json();
    setChequeGrid(list);

  } catch (err) {
    alert(err.message);
  }
};





const handleExit = () => {
  setIsLocked(true);   
  setIsAdding(false);
  setGridData([]);
};


  const handleDelete = (id) => {
    setGridData((g) => g.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
  const payload = {
    username: username,   
    rows: gridData
  };

  const res = await fetch("http://localhost:5000/api/bank/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  alert(data.message);

  setGridData([]);
setIsLocked(true);
setIsAdding(false);


  
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
};
  return (
    <div className="bank-containerbn">
      <Menu />
      <div className="bank-contentbn">
        <Namewithdateacc/>
        <h1 className="titlebn">Bank Transactions & Reconciliation</h1>

        {/* Form Box */}
        <div className="form-boxbn">
          <div className="form-grid-two-columnbn">
            <div className="form-itembn">
              <label>Transaction Type</label>
              <select
                name="transactionType"
                value={form.transactionType}
                onChange={(e) => {
    handleChange(e);
    if (e.target.value === "cheque") setShowCheque(true);
  }}
                className="input-fieldbn"
                disabled={isLocked}
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
                disabled={isLocked}
              />
            </div>

            <div className="form-itembn">
              <label>Reference No</label>
              <input
                name="referenceNo"
                value={form.referenceNo}
                onChange={handleChange}
                className="input-fieldbn"
                disabled={isLocked}
              />
            </div>

            <div className="form-itembn">
              <label>Account</label>

              <select name="account" value={form.account} onChange={handleChange} className="input-fieldbn" disabled={isLocked}>
  <option value="">Select Account</option>
  {accounts.map((a, i) => (
    <option key={i} value={a.account_number}>
      {a.bank} - {a.branch} - {a.account_number}
    </option>
  ))}
</select>

            </div>

            <div className="form-itembn">
              <label>Mode</label>
              <select
                name="mode"
                value={form.mode}
                onChange={handleChange}
                className="input-fieldbn"
                disabled={isLocked}
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
                disabled={isLocked}
              />
            </div>

            <div className="form-itembn">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input-fieldbn"
                disabled={isLocked}
              />
            </div>

            <div className="form-itembn">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="input-fieldbn"
                disabled={isLocked}
              >
                <option value="Pending">Pending</option>
                <option value="Cleared">Cleared</option>
              </select>
            </div>
          </div>
        </div>


        {showCheque && (
  <div className="modal-overlaybn">
    <div className="modal-boxbn">
      <h3>Cheque Details</h3>

      <input
        className="input-fieldbn"
        placeholder="Bank"
        value={cheque.bank}
        onChange={(e) => setCheque({ ...cheque, bank: e.target.value })}
      />

      <input
        className="input-fieldbn"
        placeholder="Branch"
        value={cheque.branch}
        onChange={(e) => setCheque({ ...cheque, branch: e.target.value })}
      />

      <input
        className="input-fieldbn"
        placeholder="Cheque Number"
        value={cheque.chequeNumber}
        onChange={(e) => setCheque({ ...cheque, chequeNumber: e.target.value })}
      />

      <button
        className="btnbn btn-addbn"
        onClick={() => setShowCheque(false)}
      >
        Enter
      </button>
    </div>
  </div>
)}

{showReturnCheque && (
  <div className="modal-overlaybn">
    <div className="return-popup-box">

      {/* Close button */}
      <button
        className="return-popup-close"
        onClick={() => setShowReturnCheque(false)}
      >
        ✕
      </button>

      <div className="modal-boxbn">
        <h3>Return Cheque</h3>

        <input
          className="input-fieldbn"
          placeholder="Cheque No"
          value={returnCheque.chequeNo}
          onChange={e => setReturnCheque({ ...returnCheque, chequeNo: e.target.value })}
        />

        <input
          type="date"
          className="input-fieldbn"
          value={returnCheque.chequeDate}
          onChange={e => setReturnCheque({ ...returnCheque, chequeDate: e.target.value })}
        />

        <input
          className="input-fieldbn"
          placeholder="Bank"
          value={returnCheque.bank}
          onChange={e => setReturnCheque({ ...returnCheque, bank: e.target.value })}
        />

        <input
          className="input-fieldbn"
          placeholder="Branch"
          value={returnCheque.branch}
          onChange={e => setReturnCheque({ ...returnCheque, branch: e.target.value })}
        />

        <select
          className="input-fieldbn"
          value={returnCheque.paymentMode}
          onChange={e => setReturnCheque({ ...returnCheque, paymentMode: e.target.value })}
        >
          <option value="">Payment Mode</option>
          <option value="issue">Issue</option>
          <option value="deposit">Deposit</option>
        </select>

        

        <input
          type="number"
          className="input-fieldbn"
          placeholder="Cheque Amount"
          value={returnCheque.chequeAmount}
          onChange={e => setReturnCheque({ ...returnCheque, chequeAmount: e.target.value })}
        />

        <input
          type="number"
          className="input-fieldbn"
          placeholder="Return Charge"
          value={returnCheque.returnCharge}
          onChange={e => setReturnCheque({ ...returnCheque, returnCharge: e.target.value })}
        />

        <input
          className="input-fieldbn"
          placeholder="Total Amount"
          value={returnCheque.totalAmount}
          readOnly
        />

        {returnCheque.paymentMode === "deposit" && (
          <input
            className="input-fieldbn"
            placeholder="Payee"
            value={returnCheque.payee}
            onChange={e => setReturnCheque({ ...returnCheque, payee: e.target.value })}
          />
        )}

        <textarea
          className="input-fieldbn"
          placeholder="Return Reason"
          value={returnCheque.reason}
          onChange={e => setReturnCheque({ ...returnCheque, reason: e.target.value })}
        />

        {/* Enter button*/}
        <button
  className="btnbn btn-addbn"
  onClick={handleReturnChequeEnter}
>
          Enter
        </button>
      </div>
    </div>
  </div>
)}

{showSetoffPopup && (
  <div className="modal-overlaybn">
    <div className="return-popup-box">
      <button className="return-popup-close" onClick={() => setShowSetoffPopup(false)}>✕</button>

      <div className="modal-boxbn">
        <h3>Return Cheque Setoff</h3>

        
        <label>Cheque Date</label>
        <select
          value={setoff.cheque_date}
          onChange={e => setSetoff({ ...setoff, cheque_date: e.target.value })}
        >
          <option value={setoff.cheque_date}>{setoff.cheque_date}</option>
        </select>

        
        <label>Original Cheque Amount</label>
        <input
          value={formatMoney(setoff.original_amount || setoff.cheque_amount)}
          readOnly
        />

        
        <label>Cheque No</label>
        <input value={setoff.cheque_no} readOnly />

        
        <label>Balance Setoff Amount</label>
        <input value={formatMoney(setoff.cheque_amount)} readOnly />

        
        <label>Setoff Amount</label>
        <input
          type="number"
          value={setoff.setoff_amount}
          onChange={e => {
            const pay = Number(e.target.value || 0);
            const bal = Math.max(0, setoff.cheque_amount - pay);
            setSetoff(prev => ({
  ...prev,
  setoff_amount: pay,
  balance_amount: bal
}));
          }}
        />

        
        <label>Balance Amount</label>
        <input value={formatMoney(setoff.balance_amount)} readOnly />

        
        <label>Setoff Date</label>
        <input
          type="date"
          value={setoff.setoff_date}
          onChange={e =>
  setSetoff(prev => ({
    ...prev,
    setoff_date: e.target.value
  }))
}
        />

        
        <textarea
          placeholder="Remarks"
          value={setoff.remarks}
          onChange={e =>
  setSetoff(prev => ({
    ...prev,
    remarks: e.target.value
  }))
}
        />

        <button className="btnbn btn-setoffbn" onClick={handleSetoffSave}>
          Save Setoff
        </button>
      </div>
    </div>
  </div>
)}










        {/* Buttons */}
        <div className="button-groupbn">
          {isLocked && (
    <button className="btnbn btn-newbn" onClick={handleNew}>
      New
    </button>
  )}
          {!isLocked && (
    <>
      <button className="btnbn btn-addbn" onClick={handleAdd}>Add</button>
      <button className="btnbn btn-clearbn" onClick={handleClear}>Clear</button>
      <button className="btnbn btn-exitbn" onClick={handleExit}>Exit</button>
    </>
  )}
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
                <td>{formatMoney (r.amount)}</td>
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

        {gridData.length > 0 && !isLocked && (
  <button className="btnbn btn-savebn" onClick={handleSave}>
    Save
  </button>
)}


        <div className="button-groupbn">
          <button
  className="btnbn btn-reconcilebn"
  onClick={() => setShowReconcile(true)}
>
  Open Reconciliation
</button>

          <button
  className="btnbn btn-returnbn"
  onClick={() => setShowReturnCheque(true)}
>
  Return Cheque
</button>

<button
  className="btnbn btn-setoffbn"
  onClick={async () => {
    try {
      const res = await fetch("http://localhost:5000/api/bank/bank/return-cheque/settled");
      if (!res.ok) throw new Error("Failed to fetch settled cheques");

      const data = await res.json();
      setSettledSetoffCheques(data); 
    } catch (err) {
      console.error(err);
      alert("Error loading settled cheques: " + err.message);
    }
  }}
>
    Return Cheque Setoff
  </button>

        </div>

{chequeGrid.length > 0 && (
  <div className="return-grid-box">
    <h3>Return Cheque Details</h3>

    <table className="data-gridbn">
      <thead>
        <tr>
          <th>Cheque No</th>
          <th>Date</th>
          <th>Bank</th>
          <th>Branch</th>
          <th>Type</th>
          <th>Cheque Amount</th>
          <th>Return Charges</th>
          <th>Total Amount</th>
          <th>Balance Amount</th>
          <th>Payee</th>
          <th>Reason</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {chequeGrid.map((c, i) => (
          <tr
            key={i}
            onDoubleClick={() => {
    setSetoff(prev => ({
  ...prev,
  cheque_no: c.cheque_no,
  cheque_date: c.date?.substring(0,10),
  cheque_amount: Number(c.balance_amount || c.total_amount),
  original_amount: Number(c.cheque_amount || c.total_amount),
  setoff_amount: 0,
  balance_amount: Number(c.balance_amount || c.total_amount),
  setoff_date: "",
  remarks: ""
}));
    setShowSetoffPopup(true);
  }}
            className={c.status === "Settled" ? "row-settled" : ""}
          >
            <td>{c.cheque_no}</td>
            <td>{c.date?.substring(0, 10)}</td>
            <td>{c.bank}</td>
            <td>{c.branch}</td>
            <td>{c.type}</td>
            <td>{formatMoney(c.cheque_amount)}</td>
            <td>{formatMoney(c.return_amount)}</td>
            <td>{formatMoney(c.total_amount)}</td>
            <td>{formatMoney(c.balance_amount || c.total_amount)}</td> 
            <td>{c.payee}</td>
            <td>{c.reason}</td>
            <td>{c.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

  
  {settledSetoffCheques.length > 0 && (
  <div className="return-grid-box">
    <h3>Settled Return Cheques (Setoff History)</h3>

    <div className="setoff-search-bar">
      <input
        className="input-fieldbn"
        placeholder="Search by Cheque No"
        value={searchCheque}
        onChange={(e) => setSearchCheque(e.target.value)}
      />
      <button
        className="btnbn btn-searchbn"
        onClick={async () => {
          if (!searchCheque) {
            alert("Enter cheque number");
            return;
          }

          try {
            const res = await fetch(
              `http://localhost:5000/api/bank/bank/return-cheque/search?cheque_no=${searchCheque}`
            );
            if (!res.ok) throw new Error("Search failed");

            const data = await res.json();
            setSettledSetoffCheques(data);
          } catch (err) {
            alert(err.message);
          }
        }}
      >
        Search
      </button>
    </div>

    <table className="data-gridbn">
      <thead>
        <tr>
          <th>Cheque No</th>
          <th>Cheque Date</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Payee</th>
          <th>Status</th>
          <th>Bank</th>
          <th>Branch</th>
          <th>Last Setoff Date</th>
          <th>Setoff Amount</th>
          <th>Balance Amount</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {settledSetoffCheques.map((c, i) => (
          <tr key={i}>
            <td>{c.cheque_no}</td>
            <td>{c.cheque_date?.substring(0, 10)}</td>
            <td>{c.type}</td>
            <td>{Number(c.cheque_amount).toFixed(2)}</td>
            <td>{c.payee}</td>
            <td>{c.status}</td>
            <td>{c.bank}</td>
            <td>{c.branch}</td>
            <td>{c.setoff_date?.substring(0, 10) || '-'}</td>
            <td>{Number(c.setoff_amount || 0).toFixed(2)}</td>
            <td>{Number(c.balance_amount || 0).toFixed(2)}</td>
            <td>{c.remaks || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}



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
