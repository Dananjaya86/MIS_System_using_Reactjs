import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./advancepayment.css";

const customers = [
  { code: "C001", name: "John Doe", date: "2025-09-05", amount: 5000, setoffDate: "2025-09-10", remarks: "Regular customer" },
  { code: "C002", name: "Jane Smith", date: "2025-09-06", amount: 3000, setoffDate: "2025-09-12", remarks: "Premium customer" }
];

const suppliers = [
  { code: "S001", name: "ABC Supplier", date: "2025-09-05", amount: 4000, setoffDate: "2025-09-11", remarks: "Good supplier" },
  { code: "S002", name: "XYZ Supplier", date: "2025-09-06", amount: 6000, setoffDate: "2025-09-13", remarks: "Reliable supplier" }
];

const AdvancePayment = () => {
  const [type, setType] = useState("customer");
  const [formData, setFormData] = useState({});
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
  const selected = e.target.value;
  setType(selected);
  setSelectedCombo(null);
  setFormData({});
  setSelectedRows([]);
};

  const handleComboChange = (e) => {
    const id = e.target.value;
    const data = type === "customer"
      ? customers.find(c => c.code === id)
      : suppliers.find(s => s.code === id);

    setSelectedCombo(data || null);
    if (data) setFormData({ ...data });
    else setFormData({});
    setSelectedRows([]);
  };

  const handleAddToGrid = () => {
    if (!formData.code || !formData.name) return;
    setGridData([...gridData, { ...formData, type }]);
    setFormData({});
    setSelectedCombo(null);
  };

  const handleRowSelect = (code) => {
    setSelectedRows(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code);
      else return [...prev, code];
    });
  };

  const handleRowClick = (row) => {
  let updatedSelected;

  if (selectedRows.includes(row.code)) {

    // deselect
    updatedSelected = selectedRows.filter(c => c !== row.code);} 
    
    else {
    // select
    updatedSelected = [...selectedRows, row.code];
  }

  setSelectedRows(updatedSelected);

  // If exactly one row is selected to fill fields


  if (updatedSelected.length === 1) {
    const selectedRow = gridData.find(r => r.code === updatedSelected[0]);
    if (selectedRow) {
      setSelectedCombo({ code: selectedRow.code, name: selectedRow.name });
      setFormData({ ...selectedRow });
      setType(selectedRow.type);
    }
  } else {

    // If 0 or multiple rows to clear fields

    setFormData({});
    setSelectedCombo(null);
  }
};
  const handleModify = () => {
    if (selectedRows.length !== 1) {
      alert("You can only modify one row at a time.");
      return;
    }

    const updatedData = gridData.map(row =>
      row.code === selectedRows[0] ? { ...formData, type } : row
    );

    setGridData(updatedData);
    setSelectedRows([]);
    setFormData({});
    setSelectedCombo(null);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) return;
    setGridData(gridData.filter(r => !selectedRows.includes(r.code)));
    setSelectedRows([]);
    setFormData({});
    setSelectedCombo(null);
  };

  const comboOptions = type === "customer" ? customers : suppliers;

  return (
    <div className="advance-container">
      
        <Menu />
      

      <div className="content">
        <h2>Advance Payment</h2>

        {/* Type selection */}

        <div className="form-group">
          <label>Type:</label>
          <select value={type} onChange={handleTypeChange}>
            <option value="">Select Payer</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>

        {/* Combo Box */}

        <div className="form-group">
          <label>{type === "customer" ? "Select Customer" : "Select Supplier"}</label>
          <select value={selectedCombo?.code || ""} onChange={handleComboChange}>
            <option value="">Select Customer</option>
            {comboOptions.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Inputs */}
        <div className="form-box">
        <div className="form-group">
          <label>Code</label>
          <input name="code" value={formData.code || ""} onChange={handleChange} />

          <label>Name</label>
          <input name="name" value={formData.name || ""} onChange={handleChange} />

          <label>Date</label>
          <input type="datetime-local" name="date" value={formData.date || ""} onChange={handleChange}/>

          <label>Amount</label>
          <input name="amount" value={formData.amount || ""} onChange={handleChange} />

          <label>Setoff Date</label>
          <input type="date" name="setoffDate" value={formData.setoffDate || ""} onChange={handleChange}/>

          <label>Remarks</label>
          <textarea name="remarks" value={formData.remarks || ""} onChange={handleChange} rows={3}></textarea>
        </div>
        </div>



        {/* Buttons */}

        <div className="buttons">
          {gridData.length === 0 && (
            <>
              <button onClick={handleAddToGrid}>Add</button>
              <button onClick={() => setFormData({})}>Clear</button>
              <button onClick={() => alert("Exit")}>Exit</button>
            </>
          )}

          {gridData.length > 0 && selectedRows.length === 0 && (
            <>
              <button onClick={handleAddToGrid}>Add</button>
              <button onClick={() => setFormData({})}>Clear</button>
              <button onClick={() => alert("Save & Exit")}>Save</button>
              <button onClick={() => alert("Exit")}>Exit</button>
            </>
          )}

          {selectedRows.length === 1 && (
            <>
              <button onClick={handleModify}>Modify</button>
              <button onClick={handleDelete}>Delete</button>
              <button onClick={() => alert("Save & Exit")}>Save</button>
              <button onClick={() => alert("Exit")}>Exit</button>
            </>
          )}

          {selectedRows.length > 1 && (
            <>
              <button onClick={handleDelete}>Delete</button>
              <button onClick={() => alert("Save & Exit")}>Save</button>
              <button onClick={() => alert("Exit")}>Exit</button>
            </>
          )}
        </div>



        {/* Grid */}


        {gridData.length > 0 && (
          <table className="grid">
            <thead>
              <tr>
                <th>Select</th>
                <th>Type</th>
                <th>Code</th>
                <th>Name</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Setoff Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, index) => (
                <tr
                  key={index}
                  className={selectedRows.includes(row.code) ? "selected-row" : ""}
                  onClick={() => handleRowClick(row)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.code)}
                      onChange={() => handleRowSelect(row.code)}
                    />
                  </td>
                  <td>{row.type}</td>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.date}</td>
                  <td>{row.amount}</td>
                  <td>{row.setoffDate}</td>
                  <td>{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdvancePayment;
