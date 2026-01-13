import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import "./expenses.css";
import AlertBox from "../componants/Alertboxre";
import Namewithdateacc from "../componants/Namewithdateacc"

export default function Expenses() {

  const [types, setTypes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newType, setNewType] = useState("");
  const [newSub, setNewSub] = useState("");
  const [alert, setAlert] = useState({ show: false, type: "", title: "", message: "" });
  const [popupGrid, setPopupGrid] = useState([]);

  
const [showBankPopup, setShowBankPopup] = useState(false);
const [newBank, setNewBank] = useState("");
const [newBranch, setNewBranch] = useState("");
const [newAccountNumber, setNewAccountNumber] = useState("");
const [bankGrid, setBankGrid] = useState([]);

const [errors, setErrors] = useState({});

const [isNew, setIsNew] = useState(false);

const isLocked = !isNew;


const username = localStorage.getItem("username");


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

 
  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expencess/types");
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      console.error(err);
    }
  };

 useEffect(() => {
  if (!newType) return;

  const existing = types.filter(t => t.expencess_type === newType);
  setPopupGrid(existing.map((e, i) => ({
    id: i,
    expencess_type: e.expencess_type,
    sub_expencess: e.sub_expencess
  })));
}, [newType]);


const saveNewBankAccount = async () => {
  if (!newBank || !newBranch || !newAccountNumber) {
    setAlert({
      show: true,
      type: "warning",
      title: "Validation",
      message: "Please enter Bank, Branch, and Account Number",
    });
    return;
  }

  try {
    await fetch("http://localhost:5000/api/expencess/bank_accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank: newBank,
        branch: newBranch,
        account_number: newAccountNumber,
      }),
    });

    setBankGrid(prev => [
      ...prev,
      {
        id: Date.now(),
        bank: newBank,
        branch: newBranch,
        account_number: newAccountNumber
      }
    ]);

    setNewBranch("");
    setNewAccountNumber("");

    loadBanks();

    setAlert({
      show: true,
      type: "success",
      title: "Saved",
      message: "Bank account added successfully",
    });
  } catch (err) {
    console.error(err);
    setAlert({
      show: true,
      type: "error",
      title: "Error",
      message: "Failed to save bank account",
    });
  }
};


const [banks, setBanks] = useState([]);

const loadBanks = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/expencess/bank_accounts");
    const data = await res.json();
    setBanks(data);
  } catch (err) {
    console.error(err);
  }
};


useEffect(() => {
  loadBanks();
}, []);




 
  const saveNewType = async () => {
  if (!newType || !newSub) {
    setAlert({
      show: true,
      type: "warning",
      title: "Validation",
      message: "Please enter Expense Type and Sub Expense",
    });
    return;
  }

  try {
    await fetch("http://localhost:5000/api/expencess/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expencess_type: newType,
        sub_expencess: newSub,
      }),
    });

    
    setPopupGrid(prev => [
      ...prev,
      {
        id: Date.now(),
        expencess_type: newType,
        sub_expencess: newSub
      }
    ]);

    setNewSub(""); 

    loadTypes();

    setAlert({
      show: true,
      type: "success",
      title: "Saved",
      message: "Expense type saved",
    });
  } catch {
    setAlert({
      show: true,
      type: "error",
      title: "Error",
      message: "Save failed",
    });
  }
};

const askConfirm = (title, message, onYes) => {
  if (window.confirm(message)) {
    onYes();
  }
};



 const validateForm = () => {
  const newErrors = {};

  if (!form.expensesType) newErrors.expensesType = "Expenses Type is required";
  if (!form.subExpenses) newErrors.subExpenses = "Sub Expenses is required";
  if (!form.date) newErrors.date = "Date is required";
  if (!form.amount || Number(form.amount) <= 0) newErrors.amount = "Enter a valid amount";
  if (!form.paymentMode) newErrors.paymentMode = "Payment Mode is required";
  if (!form.account) newErrors.account = "Account is required";
  if (!form.paymentMadeBy) newErrors.paymentMadeBy = "Payment Made By is required";
  if (!form.remarks) newErrors.remarks = "Remarks is required";

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

const validateField = (name, value) => {
  let message = "";

  switch (name) {
    case "expensesType":
      if (!value) message = "Expenses Type is required";
      break;
    case "subExpenses":
      if (!value) message = "Sub Expenses is required";
      break;
    case "date":
      if (!value) message = "Date is required";
      break;
    case "amount":
      if (!value || Number(value) <= 0) message = "Enter a valid amount";
      break;
    case "paymentMode":
      if (!value) message = "Payment Mode is required";
      break;
    case "account":
      if (!value) message = "Account is required";
      break;
    case "paymentMadeBy":
      if (!value) message = "Payment Made By is required";
      break;
    case "remarks":
      if (!value) message = "Remarks is required";
      break;
    default:
      break;
  }

  setErrors(prev => ({
    ...prev,
    [name]: message
  }));
};


const handleSave = () => {

  if (gridData.length === 0) {
    setAlert({
      show: true,
      type: "warning",
      title: "Validation",
      message: "No expenses to save"
    });
    return;
  }

  askConfirm(
    "Save Expenses",
    "Do you want to save all expense records?",
    async () => {
      try {

        for (const row of gridData) {
          await fetch("http://localhost:5000/api/expencess/details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expencess_type: row.expensesType,
              sub_expencess: row.subExpenses,
              date: row.date,
              amount: row.amount,
              payment_mode: row.paymentMode,
              account: row.account,
              payment_made_by: row.paymentMadeBy,
              remarks: row.remarks,
              username: username
            })
          });
        }

        
        setGridData([]);

        
        setIsNew(false);
        setIsAdding(false);

        setAlert({
          show: true,
          type: "success",
          title: "Saved",
          message: "Expenses saved successfully"
        });

      } catch (err) {
        console.error(err);
        setAlert({
          show: true,
          type: "error",
          title: "Error",
          message: "Failed to save expenses"
        });
      }
    }
  );
};




const saveExpense = () => {
  
  if (!validateForm()) {
    setAlert({
      show: true,
      type: "warning",
      title: "Validation Error",
      message: "Please fill all required fields correctly before adding."
    });
    return;
  }

  
  const newRow = {
    id: Date.now(),
    ...form 
  };

 
  setGridData(prev => [...prev, newRow]);

  
  resetForm();
  setErrors({}); 

  setAlert({
    show: true,
    type: "success",
    title: "Added",
    message: "Expense record added to the list successfully."
  });
};




  
  const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "expensesType") {
    setForm(prev => ({
      ...prev,
      expensesType: value,
      subExpenses: ""
    }));
    validateField("expensesType", value);
    validateField("subExpenses", "");
  } else {
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  }
};

  const resetForm = () => {
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
  };

  const handleNew = () => {
    resetForm();
    setIsAdding(true);
    setIsNew(true);
  };

  const handleAdd = () => {
  if (!validateForm()) {
    setAlert({
      show: true,
      type: "warning",
      title: "Validation Error",
      message: "Please fill all required fields correctly",
    });
    return;
  }

  setGridData((prev) => [...prev, { ...form, id: Date.now() }]);
  resetForm();
  setErrors({});
};


  const handleEdit = (id) => {
    const item = gridData.find((row) => row.id === id);
    if (item) {
      setForm(item);
      setIsAdding(true);
      setGridData((prev) => prev.filter((row) => row.id !== id));
    }
  };

  const handleDelete = (id) => {
    setGridData((prev) => prev.filter((row) => row.id !== id));
  };



 
  return (
    <div className="expenses-container">
      <Menu />

      <div className="expenses-content">
        <div className="expenses-card">
          <Namewithdateacc/>
          <h1 className="expenses-title">Expenses</h1>

          {/* Form */}
          <div className="form-boxex">
            <div className="form-gridex">
              <div className="form-columnex">
                <label>Expenses Type</label>
                <select
                  name="expensesType"
                  value={form.expensesType}
                  onChange={(e) => {
                    if (e.target.value === "OTHER") {
                      setShowPopup(true);
                      setForm((prev) => ({ ...prev, expensesType: "", subExpenses: "" }));
                    } else {
                      handleChange(e);
                    }
                  }}
                  disabled={isLocked}
                 className={`input-fieldex ${errors.expensesType ? "input-error" : ""}`}
                >
                  

                  <option value="">Select Type</option>
                  {[...new Set(types.map((t) => t.expencess_type))].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="OTHER">Other and Delete</option>
                </select>
                {errors.expensesType && <span className="error-text">{errors.expensesType}</span>}

                <label>Sub Expenses</label>
                <select
                  name="subExpenses"
                  value={form.subExpenses}
                  onChange={handleChange}
                  className={`input-fieldex ${errors.subExpenses ? "input-error" : ""}`}
                  disabled={isLocked}
                >
                 

                  <option value="">Select Sub</option>
                  {types
                    .filter((t) => t.expencess_type === form.expensesType)
                    .map((t, i) => (
                      <option key={i} value={t.sub_expencess}>
                        {t.sub_expencess}
                      </option>
                    ))}
                </select>
                 {errors.subExpenses && <span className="error-text">{errors.subExpenses}</span>}

                <label>Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} className={`input-fieldex ${errors.date ? "input-error" : ""}`} disabled={isLocked} />
                {errors.date && <span className="error-text">{errors.date}</span>}

                <label>Amount</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} className={`input-fieldex ${errors.amount ? "input-error" : ""}`} disabled={isLocked} />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
              </div>

              <div className="form-columnex">
                <label>Payment Mode</label>
                <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className={`input-fieldex ${errors.paymentMode ? "input-error" : ""}`} disabled={isLocked}>
                 

                  <option value="">Select Mode</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Transfer</option>
                  
                </select>
                 {errors.paymentMode && <span className="error-text">{errors.paymentMode}</span>}

                <label>Account</label>
                <select
  name="account"
  value={form.account}
  onChange={(e) => {
    if (e.target.value === "NEWBANK") {
      setShowBankPopup(true);
    } else {
      handleChange(e);
    }
  }}
  className={`input-fieldex ${errors.account ? "input-error" : ""}`}
  disabled={isLocked}
>
  

  <option value="">Select Account</option>
  {banks.map((b) => (
    <option key={b.no} value={b.account_number}>
      {b.bank} - {b.branch} ({b.account_number})
    </option>
  ))}
  <option value="NEWBANK">Add New Bank</option>
</select>
{errors.account && <span className="error-text">{errors.account}</span>}

                <label>Payment Made By</label>
                <input name="paymentMadeBy" value={form.paymentMadeBy} onChange={handleChange} className={`input-fieldex ${errors.paymentMadeBy ? "input-error" : ""}`} disabled={isLocked} />
                {errors.paymentMadeBy && <span className="error-text">{errors.paymentMadeBy}</span>}

                <label>Remarks</label>
                <textarea name="remarks" value={form.remarks} onChange={handleChange} className={`input-fieldex ${errors.remarks ? "input-error" : ""}`} disabled={isLocked} />
                {errors.remarks && <span className="error-text">{errors.remarks}</span>}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button className="btn btn-new" onClick={handleNew}>New</button>
            {isAdding && (
              <>
                <button className="btn btn-add" onClick={handleAdd}>Add</button>
                <button className="btn btn-clear" onClick={resetForm}>Clear</button>
              </>
            )}
            <button className="btn btn-exit">Exit</button>
          </div>

          {/* Table */}
          <table className="data-grid">
  <thead>
    <tr>
      <th>Expenses Type</th>
      <th>Sub Expenses</th>
      <th>Date</th>
      <th>Amount</th>
      <th>Payment Mode</th>
      <th>Account</th>
      <th>Payment Made By</th>
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
        <td>
          <button className="btn-edit" onClick={() => handleEdit(row.id)}>Edit</button>
          <button className="btn-delete" onClick={() => handleDelete(row.id)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

<div className="form-actions">
  <button className="btn btn-save" onClick={handleSave}>Save</button>

</div>


          {/* Popup */}
          {showPopup && (
  <div className="popup">
    <h3>Add New Expense Type</h3>

    <input
      placeholder="Expense Type"
      value={newType}
      onChange={(e) => setNewType(e.target.value)}
    />

    <input
      placeholder="Sub Expense"
      value={newSub}
      onChange={(e) => setNewSub(e.target.value)}
    />

    <button className="btn-save" onClick={saveNewType}>Save</button>

    {/* GRID */}
    <table className="popup-grid">
      <thead>
        <tr>
          <th>Expense Type</th>
          <th>Sub Expense</th>
        </tr>
      </thead>
      <tbody>
        {popupGrid.map(row => (
          <tr key={row.id}>
            <td>{row.expencess_type}</td>
            <td>{row.sub_expencess}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="popup-buttons">
      <button className="btn-exit" onClick={() => {
        setPopupGrid([]);
        setShowPopup(false);
      }}>
        Close
      </button>
    </div>
  </div>
)}


   {showBankPopup && (
  <div className="popup">
    <h3>Add New Bank Account</h3>

    <input
      placeholder="Bank Name"
      value={newBank}
      onChange={(e) => setNewBank(e.target.value)}
    />

    <input
      placeholder="Branch"
      value={newBranch}
      onChange={(e) => setNewBranch(e.target.value)}
    />

    <input
      placeholder="Account Number"
      value={newAccountNumber}
      onChange={(e) => setNewAccountNumber(e.target.value)}
    />

    {/* Grid view inside popup */}
    <table className="popup-grid">
      <thead>
        <tr>
          <th>Bank</th>
          <th>Branch</th>
          <th>Account Number</th>
        </tr>
      </thead>
      <tbody>
        {bankGrid.map(row => (
          <tr key={row.id}>
            <td>{row.bank}</td>
            <td>{row.branch}</td>
            <td>{row.account_number}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="popup-buttons">
      <button onClick={saveNewBankAccount}>Save</button>
      <button onClick={() => setShowBankPopup(false)}>Cancel</button>
    </div>
  </div>
)}


        </div>

        <AlertBox
          show={alert.show}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      </div>
    </div>
  );
}
