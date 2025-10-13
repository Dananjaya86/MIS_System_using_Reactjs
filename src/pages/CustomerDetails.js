import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import "./customerdetails.css";

const apiBase = "http://localhost:5000/api/customers";

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
    totalReturn: "",
  });
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [username, setUsername] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [mode, setMode] = useState("view");
  const [searchText, setSearchText] = useState("");
  const [multipleEntry, setMultipleEntry] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const storedUser = localStorage.getItem("username") || "Guest";
    setUsername(storedUser);

    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );

    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let dataArray = [];
      if (Array.isArray(json)) dataArray = json;
      else if (json.success && Array.isArray(json.data)) dataArray = json.data;
      else if (Array.isArray(json.result)) dataArray = json.result;
      else {
        console.warn("⚠️ Unexpected response:", json);
        setCustomers([]);
        return;
      }

      const mapped = dataArray.map((r, idx) => ({
        id: idx + 1,
        code: r.customer_code || r.code || "",
        name: r.name || "",
        address: r.address || "",
        phone: r.phone_number || r.phone || "",
        contactPerson: r.contact_person || r.contactPerson || "",
        advance: r.advance_payment || r.advance || 0,
        date: r.date ? r.date.split("T")[0] : "",
        route: r.route || "",
        credit: r.credit_amount || r.credit || 0,
        status: r.status || "Good",
        balance: r.balance_amount || r.balance || 0,
        totalReturn: r.total_return || r.totalReturn || 0,
      }));

      setCustomers(mapped);
    } catch (err) {
      console.error("⚠️ Error loading customers:", err);
      setCustomers([]);
    }
  };

  const generateCustomerCode = () => {
    if (customers.length === 0) return "CUS00001";
    const codes = customers.map((c) => parseInt(c.code.replace(/\D/g, "")) || 0);
    const maxNum = Math.max(...codes);
    return `CUS${(maxNum + 1).toString().padStart(5, "0")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on typing
  };

  const resetForm = (keepCode = false) => {
    setForm({
      code: keepCode ? form.code : "",
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
      totalReturn: "",
    });
    setErrors({});
    setSelectedId(null);
    if (!keepCode) setSelectedCode("");
  };

  const handleNew = () => {
    const ok = window.confirm("Do you want to enter multiple customers?");
    setMultipleEntry(ok);
    const newCode = generateCustomerCode();
    setForm((prev) => ({ ...prev, code: newCode }));
    setMode("new");
  };

  const mapFormToPayload = () => ({
    name: form.name || "",
    address: form.address || "",
    phone_number: form.phone || "",
    contact_person: form.contactPerson || "",
    advance_payment: form.advance ? parseFloat(form.advance) : 0,
    date: form.date || null,
    route: form.route || "",
    credit_amount: form.credit ? parseFloat(form.credit) : 0,
    status: form.status || "Good",
    balance_amount: form.balance ? parseFloat(form.balance) : 0,
    total_return: form.totalReturn ? parseFloat(form.totalReturn) : 0,
    login_user: username || "Unknown",
  });

  const validateForm = () => {
    const requiredFields = [
      "name",
      "address",
      "phone",
      "contactPerson",
      "advance",
      "date",
      "route",
      "credit",
      "balance",
      "totalReturn",
    ];
    const newErrors = {};
    let valid = true;

    for (let field of requiredFields) {
      if (!form[field] || form[field].toString().trim() === "") {
        newErrors[field] = true;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const inputClass = (field) => (errors[field] ? "input-errorcus" : "");

  const handleSave = async () => {
  if (!validateForm()) return; 

  try {
    const payload = mapFormToPayload();
    const method = mode === "new" ? "POST" : "PUT";
    const url = mode === "new" ? apiBase : `${apiBase}/${selectedCode}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (json.success || json.affectedRows > 0) {
      alert(json.message || "Customer saved successfully!");

     
      await fetchCustomers(); 

      if (multipleEntry && mode === "new") {
        const nextCode = generateCustomerCode(); 
        resetForm(true); 
        setForm((prev) => ({ ...prev, code: nextCode })); 
      } else {
        resetForm(); 
        setMode("view");
      }
    } else {
      alert(json.message || "Save failed");
    }
  } catch (err) {
    console.error("⚠️ Save error:", err);
    alert("Error saving customer. Check console.");
  }
};


  const handleDelete = async () => {
    if (!selectedCode) {
      alert("Select a customer to delete.");
      return;
    }
    const ok = window.confirm("Are you sure you want to delete this customer?");
    if (!ok) return;

    try {
      const res = await fetch(`${apiBase}/${selectedCode}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_user: username || "Unknown" }),
      });
      const json = await res.json();

      if (json.success || json.affectedRows > 0) {
        alert(json.message || "Customer deleted!");
        fetchCustomers();
        resetForm();
        setMode("view");
      } else alert(json.message || "Delete failed");
    } catch (err) {
      console.error("⚠️ Delete error:", err);
      alert("Error deleting customer. Check console.");
    }
  };

  const handleExit = () => {
    setMode("view");
    resetForm();
  };

  const handleRowClick = (customer) => {
    setForm({
      code: customer.code,
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      contactPerson: customer.contactPerson,
      advance: customer.advance,
      date: customer.date,
      route: customer.route,
      credit: customer.credit,
      status: customer.status,
      balance: customer.balance,
      totalReturn: customer.totalReturn,
    });
    setErrors({});
    setSelectedId(customer.id);
    setSelectedCode(customer.code);
    setMode("edit");
  };

  const filteredCustomers = customers.filter((c) =>
    Object.values(c).some(
      (val) => val && val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage || 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="page-layoutcus">
      <Menu />
      <div className="customer-containercus">
        <div className="user-infocus">
          <span className="usernamecus">👤 {username}</span>
          <span className="datecus">📅 {currentDate}</span>
        </div>

        <h2 className="customerhecus">
          Customer Details{" "}
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
            alt="customer"
            className="title-iconcus"
          />
        </h2>

        <div className="form-sectioncus">
          <div className="form-leftcus">
            <label>Code:</label>
            <input name="code" value={form.code} readOnly />

            <label>Name:</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass("name")}
              readOnly={mode === "view"}
            />

            <label>Address:</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputClass("address")}
              readOnly={mode === "view"}
            />

            <label>Phone:</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass("phone")}
              readOnly={mode === "view"}
            />

            <label>Contact Person:</label>
            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              className={inputClass("contactPerson")}
              readOnly={mode === "view"}
            />

            <label>Advance Payment:</label>
            <input
              name="advance"
              type="number"
              step="0.01"
              value={form.advance}
              onChange={handleChange}
              className={inputClass("advance")}
              readOnly={mode === "view"}
            />
          </div>

          <div className="form-rightcus">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={inputClass("date")}
              readOnly={mode === "view"}
            />

            <label>Route:</label>
            <input
              name="route"
              value={form.route}
              onChange={handleChange}
              className={inputClass("route")}
              readOnly={mode === "view"}
            />

            <label>Credit Amount:</label>
            <input
              name="credit"
              type="number"
              step="0.01"
              value={form.credit}
              onChange={handleChange}
              className={inputClass("credit")}
              readOnly={mode === "view"}
            />

            <label>Status:</label>
            <input
              name="status"
              value={form.status}
              onChange={handleChange}
              readOnly={mode === "view"}
            />

            <label>Balance Payment:</label>
            <input
              name="balance"
              type="number"
              step="0.01"
              value={form.balance}
              onChange={handleChange}
              className={inputClass("balance")}
              readOnly={mode === "view"}
            />

            <label>Total Return:</label>
            <input
              name="totalReturn"
              type="number"
              step="0.01"
              value={form.totalReturn}
              onChange={handleChange}
              className={inputClass("totalReturn")}
              readOnly={mode === "view"}
            />
          </div>
        </div>

        <div className="button-sectioncus">
          {mode === "view" && (
            <>
              <button className="btncnewcus" onClick={handleNew}>
                New
              </button>
              <button className="btncexitcus" onClick={handleExit}>
                Exit
              </button>
            </>
          )}
          {mode === "new" && (
            <>
              <button className="btncsavecus" onClick={handleSave}>
                Save
              </button>
              <button className="btncclearcus" onClick={() => resetForm(true)}>
                Clear
              </button>
              <button className="btncexitcus" onClick={handleExit}>
                Exit
              </button>
            </>
          )}
          {mode === "edit" && (
            <>
              <button className="btncmodifycus" onClick={handleSave}>
                Modify
              </button>
              <button className="btncdeletecus" onClick={handleDelete}>
                Delete
              </button>
              <button className="btncexitcus" onClick={handleExit}>
                Exit
              </button>
            </>
          )}
        </div>

        <div className="search-barcus">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="rows-per-pagecus">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={50}>50 Rows</option>
          </select>
        </div>

        <table className="customer-gridcus">
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
              <tr
                key={c.id}
                onClick={() => handleRowClick(c)}
                style={{
                  cursor: "pointer",
                  background: selectedId === c.id ? "#eef" : "",
                }}
              >
                <td>{c.id}</td>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.phone}</td>
                <td>{c.contactPerson}</td>
                <td>{Number(c.credit).toFixed(2)}</td>
                <td>{Number(c.advance).toFixed(2)}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="paginationcus">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-btncus ${currentPage === page ? "activecus" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
