
import React, { useState, useEffect } from "react";
import "./customerdetails.css";
import Menu from "../componants/Menu";

export default function CustomerDetails() {
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
  const [username, setUsername] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [mode, setMode] = useState("view");
  const [searchText, setSearchText] = useState("");

  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const storedUser = localStorage.getItem("username") || "Guest";
    setUsername(storedUser);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    setCurrentDate(formattedDate);
  }, []);

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
      route: "",
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
      route: "",
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

  
  const filteredCustomers = customers.filter((c) =>
    Object.values(c).some(
      (val) => val && val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  
  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1); 
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="page-layoutc">
      <Menu />

      <div className="customer-containercs">
        <div className="user-infoc">
          <span className="usernamec">👤 {username}</span>
          <span className="datec">📅 {currentDate}</span>
        </div>

        <h2 className="customerhe">
          Customer Details{" "}
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
            alt="customer"
            className="title-icon"
          />
        </h2>

        
        <div className="form-section">
          <div className="form-leftc">
            <label>Code:</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              readOnly={true} 
            />

            <label>Name:</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Address:</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Phone:</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Contact Person:</label>
            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Advance Payment:</label>
            <input
              name="advance"
              value={form.advance}
              onChange={handleChange}
              readOnly={mode === "view"}
            />
          </div>

          <div className="form-rightc">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Route:</label>
            <input
              name="route"
              value={form.route}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Credit Amount:</label>
            <input
              name="credit"
              value={form.credit}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Status:</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={mode === "view"}
            >
              <option value="Good">Good</option>
              <option value="Bad">Bad</option>
            </select>

            <label>Balance Payment:</label>
            <input
              name="balance"
              value={form.balance}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Total Return:</label>
            <input
              name="totalReturn"
              value={form.totalReturn}
              onChange={handleChange}
              readOnly={mode === "view"}
            />
          </div>
        </div>

        
        <div className="button-section2">
          {mode === "view" && (
            <>
              <button className="btncnew" onClick={handleNew}>
                New
              </button>
              <button className="btncexit" onClick={handleExit}>
                Exit
              </button>
            </>
          )}
          {mode === "new" && (
            <>
              <button className="btncsave" onClick={handleSave}>
                Save
              </button>
              <button className="btncclear" onClick={handleClear}>
                Clear
              </button>
              <button className="btncexit" onClick={handleExit}>
                Exit
              </button>
            </>
          )}
          {mode === "edit" && (
            <>
              <button className="btncmodify" onClick={handleSave}>
                Modify
              </button>
              <button className="btncdelete" onClick={handleDelete}>
                Delete
              </button>
              <button className="btncexit" onClick={handleExit}>
                Exit
              </button>
            </>
          )}
        </div>

       
        <div className="search-barc">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

       
        <div className="rows-per-pagec">
        
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={50}>50 Rows</option>
          </select>
        </div>

       
        <table className="customer-gridc">
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

       
        <div className="paginationc">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-btnc ${currentPage === page ? "activec" : ""}`}
              onClick={() => handlePageClick(page)}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
