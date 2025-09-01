import React, { useState } from "react";
import "./suplierdetails.css";
import Menu from "../componants/Menu";

export default function SupplierDetails() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    contactPerson: "",
    advance: "",
    date: "",
    route: "",
    credit: "",
    status: "Good",
    balance: "",
    totalReturn: ""
  });
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // view | new | edit

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // New button
  const handleNew = () => {
    setForm({
      code: "",
      name: "",
      address: "",
      phone: "",
      contactPerson: "",
      advance: "",
      date: "",
      route: "",
      credit: "",
      status: "Good",
      balance: "",
      totalReturn: ""
    });
    setSelectedId(null);
    setMode("new");
  };

  // Save button
  const handleSave = () => {
    if (selectedId) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...form, id: selectedId } : c))
      );
      alert("Customer modified successfully!");
    } else {
      const newCustomer = { ...form, id: customers.length + 1 };
      setCustomers([...customers, newCustomer]);
      alert("Customer saved successfully!");
    }
    handleClear();
    setMode("view");
  };

  // Clear button
  const handleClear = () => {
    setForm({
      code: "",
      name: "",
      address: "",
      phone: "",
      contactPerson: "",
      advance: "",
      date: "",
      route: "",
      credit: "",
      status: "Good",
      balance: "",
      totalReturn: ""
    });
    setSelectedId(null);
  };

  // Exit button
  const handleExit = () => {
    setMode("view");
    setSelectedId(null);
  };

  // Delete button
  const handleDelete = () => {
    if (selectedId) {
      setCustomers((prev) => prev.filter((c) => c.id !== selectedId));
      alert("Customer deleted!");
      handleClear();
      setMode("view");
    }
  };

  // Select row
  const handleRowClick = (customer) => {
    setForm(customer);
    setSelectedId(customer.id);
    setMode("edit");
  };

  return (
    <div className="page-layout">
      {/* Sidebar Menu */}
      <Menu />

      {/* Main Content */}
      <div className="customer-container">
        <h2>
          Supplier Details{" "}
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
            alt="customer"
            className="title-icon"
          />
        </h2>

        {/* Form */}
        <div className="form-section">
          <div className="form-left">
            <label>Code:</label>
            <input name="code" value={form.code} onChange={handleChange} />

            <label>Name:</label>
            <input name="name" value={form.name} onChange={handleChange} />

            <label>Address:</label>
            <input name="address" value={form.address} onChange={handleChange} />

            <label>Phone:</label>
            <input name="phone" value={form.phone} onChange={handleChange} />

            <label>Contact Person:</label>
            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
            />

            <label>Advance Payment:</label>
            <input
              name="advance"
              value={form.advance}
              onChange={handleChange}
            />
          </div>

          <div className="form-right">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />

            <label>Route:</label>
            <input name="route" value={form.route} onChange={handleChange} />

            <label>Credit Amount:</label>
            <input name="credit" value={form.credit} onChange={handleChange} />

            <label>Status:</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Good">Good</option>
              <option value="Bad">Bad</option>
            </select>

            <label>Balance Payment:</label>
            <input
              name="balance"
              value={form.balance}
              onChange={handleChange}
            />

            <label>Total Return:</label>
            <input
              name="totalReturn"
              value={form.totalReturn}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="button-section">
          {mode === "view" && (
            <>
              <button onClick={handleNew}>New</button>
              <button onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "new" && (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleClear}>Clear</button>
              <button onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "edit" && (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleDelete}>Delete</button>
              <button onClick={handleExit}>Exit</button>
            </>
          )}
        </div>

        {/* Grid */}
        <table className="customer-grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Contact</th>
              <th>Credit</th>
              <th>Advance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} onClick={() => handleRowClick(c)}>
                <td>{c.id}</td>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.phone}</td>
                <td>{c.contactPerson}</td>
                <td>{c.credit}</td>
                <td>{c.advance}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
