import React, { useState } from "react";
import "./suplierdetails.css";
import Menu from "../componants/Menu";
import Namewithdate from "../componants/Namewithdateacc";

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
    credit: "",
    status: "Good",
    balance: "",
    totalReturn: ""
  });
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); 

  // --- User info ---
  




  // --- Search & Pagination ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filteredCustomers = customers.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- Form Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNew = () => {
    setForm({
      code: "",
      name: "",
      address: "",
      phone: "",
      contactPerson: "",
      advance: "",
      date: "",
      credit: "",
      status: "Good",
      balance: "",
      totalReturn: ""
    });
    setSelectedId(null);
    setMode("new");
  };

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

  const handleClear = () => {
    setForm({
      code: "",
      name: "",
      address: "",
      phone: "",
      contactPerson: "",
      advance: "",
      date: "",
      credit: "",
      status: "Good",
      balance: "",
      totalReturn: ""
    });
    setSelectedId(null);
  };

  const handleExit = () => {
    setMode("view");
    setSelectedId(null);
  };

  const handleDelete = () => {
    if (selectedId) {
      setCustomers((prev) => prev.filter((c) => c.id !== selectedId));
      alert("Customer deleted!");
      handleClear();
      setMode("view");
    }
  };

  const handleRowClick = (customer) => {
    setForm(customer);
    setSelectedId(customer.id);
    setMode("edit");
  };

  return (
    <div className="page-layout">
      <Menu />
      

      <div className="supplier-container">

<Namewithdate />



        {/* Page Title */}
        <h2>
          Supplier Details{" "}
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
            alt="customer"
            className="title-icon"
          />
        </h2>

        {/* Form */}
        <div className="form-sectionsu">
          <div className="form-leftsu">
            <label>Code:</label>
            <input name="code" value={form.code} onChange={handleChange} />

            <label>Name:</label>
            <input name="name" value={form.name} onChange={handleChange} />

            <label>Address:</label>
            <input name="address" value={form.address} onChange={handleChange} />

            <label>Phone:</label>
            <input name="phone" value={form.phone} onChange={handleChange} />

            <label>Contact Person:</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />

            <label>Advance Payment:</label>
            <input name="advance" value={form.advance} onChange={handleChange} />
          </div>

          <div className="form-rightsu">
            <label>Date:</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} />



            <label>Credit Amount:</label>
            <input name="credit" value={form.credit} onChange={handleChange} />

            <label>Status:</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Good">Good</option>
              <option value="Bad">Bad</option>
            </select>

            <label>Balance Payment:</label>
            <input name="balance" value={form.balance} onChange={handleChange} />

            <label>Total Return:</label>
            <input name="totalReturn" value={form.totalReturn} onChange={handleChange} />
          </div>
        </div>

        {/* Buttons */}
        <div className="button-sectionsu">
          {mode === "view" && (
            <>
              <button className="btnsunew" onClick={handleNew}>New</button>
              <button className="btnsuexit" onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "new" && (
            <>
              <button className="btnsusave" onClick={handleSave}>Save</button>
              <button className="btnsuclear" onClick={handleClear}>Clear</button>
              <button className="btnsuexit" onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "edit" && (
            <>
              <button className="btnsumodify" onClick={handleSave}>Modify</button>
              <button className="btnsudelete" onClick={handleDelete}>Delete</button>
              <button className="btnsuexit" onClick={handleExit}>Exit</button>
            </>
          )}
        </div>

        {/* Search */}
        <div className="search-section-supdet">
          <input
            type="text"
            placeholder="Search "
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Gridview */}
        <table className="supplier-grid">
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
            {currentCustomers.map((c) => (
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

        {/* Pagination */}
        <div className="pagination-supdet">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? "active-page-supdet" : ""}
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
