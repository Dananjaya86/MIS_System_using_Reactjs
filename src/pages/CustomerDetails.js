import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import "./customerdetails.css";
import  Namewithdateacc from "../componants/Namewithdateacc";


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
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [username, setUsername] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [mode, setMode] = useState("view");
  const [searchText, setSearchText] = useState("");
  const [multipleEntry, setMultipleEntry] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ Load user, date, customers, and log visit
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

    // Fetch customers
    fetchCustomers(storedUser);

    // ✅ Log visit action with code = 'CD'
    logPageVisit(storedUser);
  }, []);

  // ✅ Function to log page visit to Login_Ledger
  const logPageVisit = async (loginUser) => {
    try {
      await fetch(`${apiBase}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "CUSD", // Code for Customer Details page
          active: "yes",
          action: "visit",
          login_user: loginUser || "Unknown",
          date: new Date(),
        }),
      });
    } catch (err) {
      console.error("⚠️ Ledger visit log failed:", err);
    }
  };

  // ✅ Fetch customers list
  const fetchCustomers = async (userForLog) => {
    try {
      const res = await fetch(`${apiBase}?login_user=${userForLog}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let dataArray = [];
      if (Array.isArray(json.data)) dataArray = json.data;
      else if (Array.isArray(json)) dataArray = json;
      else if (Array.isArray(json.result)) dataArray = json.result;

      const mapped = dataArray.map((r, idx) => ({
        id: idx + 1,
        code: r.customer_code || r.code || "",
        name: r.name || "",
        address: r.address || "",
        phone: r.phone_number || r.phone || "",
        contactPerson: r.contact_person || "",
        advance: r.advance_payment ?? 0,
        date: r.date ? r.date.split("T")[0] : "",
        route: r.route || "",
        credit: r.credit_amount ?? 0,
        status: r.status || "Good",
        balance: r.balance_amount ?? 0,
        totalReturn: r.total_return ?? 0,
      }));

      setCustomers(mapped);
    } catch (err) {
      console.error("⚠️ Error loading customers:", err);
      setCustomers([]);
    }
  };

  // ✅ Fetch next customer code
  const fetchNextCode = async () => {
    try {
      const res = await fetch(`${apiBase}/nextcode`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.nextCode) return json.nextCode;
      return "CUS00001";
    } catch (err) {
      console.error("⚠️ Error fetching next customer code:", err);
      return "CUS00001";
    }
  };

  
  const createLedgerEntry = async ({ code, active, action, login_user, date }) => {
    try {
      await fetch(`${apiBase}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code || "",
          active: active || "yes",
          action: action || "",
          login_user: login_user || username || "Unknown",
          date: date || new Date(),
        }),
      });
    } catch (err) {
      console.error("⚠️ Ledger create error:", err);
    }
  };

 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = (keepCode = false) => {
    setForm((prev) => ({
      code: keepCode ? prev.code : "",
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
    }));
    setSelectedId(null);
    if (!keepCode) setSelectedCode("");
  };

 
  const handleNew = async () => {
    const ok = window.confirm("Do you want to enter multiple customers?");
    setMultipleEntry(ok);
    const nextCode = await fetchNextCode();
    setForm((prev) => ({ ...prev, code: nextCode }));
    setMode("new");
  };


  const handleSave = async () => {
    if (!form.name || !form.address || !form.phone || !form.contactPerson) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        address: form.address,
        phone_number: form.phone,
        contact_person: form.contactPerson,
        advance_payment: parseFloat(form.advance || 0),
        date: form.date,
        route: form.route,
        credit_amount: parseFloat(form.credit || 0),
        status: form.status,
        balance_amount: parseFloat(form.balance || 0),
        total_return: parseFloat(form.totalReturn || 0),
        login_user: username || "Unknown",
      };

      const method = mode === "new" ? "POST" : "PUT";
      const url = mode === "new" ? apiBase : `${apiBase}/${selectedCode}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message || "Saved successfully");
        await fetchCustomers(username);

       
        await createLedgerEntry({
          code: mode === "new" ? json.customer_code : selectedCode,
          active: "yes",
          action: mode === "new" ? "save" : "edit",
          login_user: username,
        });

        if (multipleEntry && mode === "new") {
          const next = await fetchNextCode();
          resetForm(true);
          setForm((prev) => ({ ...prev, code: next }));
        } else {
          resetForm();
          setMode("view");
        }
      } else {
        alert(json.message || "Save failed");
      }
    } catch (err) {
      console.error("⚠️ Save error:", err);
      alert("Error saving customer");
    }
  };

  
  const handleDelete = async () => {
    if (!selectedCode) {
      alert("Select a customer first.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await fetch(`${apiBase}/${selectedCode}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_user: username }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || "Deleted successfully");
        await fetchCustomers(username);
        resetForm();
        setMode("view");
        await createLedgerEntry({
          code: selectedCode,
          active: "no",
          action: "delete",
          login_user: username,
        });
      } else alert(json.message || "Delete failed");
    } catch (err) {
      console.error("⚠️ Delete error:", err);
    }
  };

  const handleExit = () => {
    setMode("view");
    resetForm();
  };

  const handleRowClick = (c) => {
    setForm({
      code: c.code,
      name: c.name,
      address: c.address,
      phone: c.phone,
      contactPerson: c.contactPerson,
      advance: c.advance,
      date: c.date,
      route: c.route,
      credit: c.credit,
      status: c.status,
      balance: c.balance,
      totalReturn: c.totalReturn,
    });
    setSelectedId(c.id);
    setSelectedCode(c.code);
    setMode("edit");
  };

  
  const filteredCustomers = customers.filter((c) =>
    Object.values(c).some(
      (val) => val && val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="page-layoutcus">
      <Menu />
      <div className="customer-containercus">
        
        <div className="user-infocus">
           <Namewithdateacc/>
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
              type="number"
              step="0.01"
              value={form.advance}
              onChange={handleChange}
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
              type="number"
              step="0.01"
              value={form.credit}
              onChange={handleChange}
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
              readOnly={mode === "view"}
            />

            <label>Total Return:</label>
            <input
              name="totalReturn"
              type="number"
              step="0.01"
              value={form.totalReturn}
              onChange={handleChange}
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
