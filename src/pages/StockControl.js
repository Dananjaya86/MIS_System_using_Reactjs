import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import "./stockcontrol.css";

export default function StockControl() {
  const [form, setForm] = useState({
    code: "",
    name: "",
    available: "",
    physical: "",
    difference: 0,
    adjustIn: "",
    adjustOut: "",
    remarks: "",
  });

  const [rows, setRows] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showNewButtons, setShowNewButtons] = useState(false);

  // Auto calculate difference whenever stock values change
  useEffect(() => {
    const available = parseFloat(form.available) || 0;
    const physical = parseFloat(form.physical) || 0;
    const adjustIn = parseFloat(form.adjustIn) || 0;
    const adjustOut = parseFloat(form.adjustOut) || 0;

    const adjustedPhysical = physical + adjustIn - adjustOut;
    const difference = adjustedPhysical - available;

    // Only update if difference actually changed
    if (form.difference !== difference) {
      setForm((prev) => ({ ...prev, difference }));
    }
  }, [form.available, form.physical, form.adjustIn, form.adjustOut]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (editingIndex !== null) {
      const updatedRows = [...rows];
      updatedRows[editingIndex] = form;
      setRows(updatedRows);
      setEditingIndex(null);
    } else {
      setRows([...rows, form]);
    }
    handleClear();
  };

  const handleEdit = (index) => {
    setForm(rows[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setForm({
      code: "",
      name: "",
      available: "",
      physical: "",
      difference: 0,
      adjustIn: "",
      adjustOut: "",
      remarks: "",
    });
  };

  return (
    <div className="stock-control-container">
      <Menu />
      <div className="stock-control-content">
        <h1>Stock Control</h1>

        {/* Input Form */}
        <div className="form-grid">
          <div className="stockconleft">
            <label>Product Code</label>
            <input type="text" name="code" value={form.code} onChange={handleChange} />

            <label>Product Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} />

            <label>Available Stock</label>
            <input type="number" name="available" value={form.available} onChange={handleChange} />

            <label>Physical Stock</label>
            <input type="number" name="physical" value={form.physical} onChange={handleChange} />
          </div>

          <div className="stockconright">
            <label>Adjustment In Stock</label>
            <input type="number" name="adjustIn" value={form.adjustIn} onChange={handleChange} />

            <label>Adjustment Out Stock</label>
            <input type="number" name="adjustOut" value={form.adjustOut} onChange={handleChange} />

            <label>Difference</label>
            <input type="number" name="difference" value={form.difference} readOnly />

            <label>Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} />
          </div>
        </div>

        {/*Buttons */}
        {!showNewButtons ? (
          <button className="btn new" onClick={() => setShowNewButtons(true)}>New</button>
        ) : (
          <div className="button-row">
            <button className="btn add" onClick={handleAdd}>
              {editingIndex !== null ? "Update" : "Add"}
            </button>
            <button className="btn clear" onClick={handleClear}>Clear</button>
            <button className="btn exit" onClick={() => setShowNewButtons(false)}>Exit</button>
          </div>
        )}

        {/* Gridview */}
        <table className="stock-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Available</th>
              <th>Physical</th>
              <th>Adj. In</th>
              <th>Adj. Out</th>
              <th>Difference</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.available}</td>
                <td>{row.physical}</td>
                <td>{row.adjustIn}</td>
                <td>{row.adjustOut}</td>
                <td>{row.difference}</td>
                <td>{row.remarks}</td>
                <td>
                  <button className="btn edit" onClick={() => handleEdit(index)}>Edit</button>
                  <button className="btn delete" onClick={() => handleDelete(index)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* below Buttons */}
        <div className="button-row">
          <button className="btn save">Save</button>
          <button className="btn print">Print</button>
          <button className="btn view">View</button>
        </div>
      </div>
    </div>
  );
}
