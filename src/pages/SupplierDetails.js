import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import AlertBox from "../componants/Alertboxre";
import "./suplierdetails.css";
import  Namewithdateacc from "../componants/Namewithdateacc";

const apiBase = "http://localhost:5000/api/suppliers";

export default function SupplierDetails() {
  const [suppliers, setSuppliers] = useState([]);
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

  
  const [alert, setAlert] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

 
  const showAlert = (config) => setAlert({ show: true, ...config });
  const closeAlert = () => setAlert((prev) => ({ ...prev, show: false }));

 
  const askQuestion = (title, message) => {
    return new Promise((resolve) => {
      showAlert({
        type: "question",
        title,
        message,
        onConfirm: () => {
          resolve(true);
          closeAlert();
        },
      });
      
      const handleClose = () => {
        resolve(false);
        closeAlert();
      };
      setAlert((prev) => ({ ...prev, onClose: handleClose }));
    });
  };

  
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

    fetchSuppliers();
    logPageVisit(storedUser);
  }, []);

  const logPageVisit = async (loginUser) => {
    try {
      await fetch(`${apiBase}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "SUPD",
          active: "yes",
          action: "visit",
          login_user: loginUser || "Unknown",
          date: new Date(),
        }),
      });
    } catch (err) {
      console.error("Ledger visit log failed:", err);
    }
  };


  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${apiBase}`);
      const json = await res.json();
      if (!json.success) return setSuppliers([]);

      const mapped = (json.data || []).map((r, idx) => ({
        id: idx + 1,
        code: r.sup_code || "",
        name: r.sup_name || "",
        address: r.address || "",
        phone: r.phone || "",
        contactPerson: r.contact_person || "",
        advance: r.advance_payment ?? 0,
        date: r.date ? r.date.split("T")[0] : "",
        route: r.route || "",
        credit: r.credit_amount ?? 0,
        status: r.status || "Good",
        balance: r.balance_amount ?? 0,
        totalReturn: r.total_return ?? 0,
      }));

      setSuppliers(mapped);
    } catch (err) {
      console.error("Error loading suppliers:", err);
      setSuppliers([]);
    }
  };

  const fetchNextCode = async () => {
    try {
      const res = await fetch(`${apiBase}/nextcode`);
      const json = await res.json();
      return json.success && json.nextCode ? json.nextCode : "SUP0001";
    } catch (err) {
      console.error("Error fetching next supplier code:", err);
      return "SUP0001";
    }
  };

  const createLedgerEntry = async ({ code, active, action }) => {
    try {
      await fetch(`${apiBase}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code || "",
          active: active || "yes",
          action: action || "",
          login_user: username || "Unknown",
          date: new Date(),
        }),
      });
    } catch (err) {
      console.error("Ledger create error:", err);
    }
  };

 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    setSelectedId(null);
    if (!keepCode) setSelectedCode("");
  };

  const handleNew = async () => {
    const ok = await askQuestion("Multiple Entry", "Do you want to enter multiple suppliers?");
    setMultipleEntry(ok);
    const nextCode = await fetchNextCode();
    setForm((prev) => ({ ...prev, code: nextCode }));
    setMode("new");
  };

  const handleSave = async () => {
    if (!form.name || !form.address || !form.phone || !form.contactPerson) {
      showAlert({
        type: "error",
        title: "Validation",
        message: "Please fill in all required fields.",
      });
      return;
    }

    const confirm = await askQuestion(
      mode === "new" ? "Confirm Save" : "Confirm Modify",
      mode === "new"
        ? "Do you want to save this supplier?"
        : "Do you want to modify this supplier?"
    );

    if (!confirm) return;

    try {
      const payload = {
        sup_name: form.name,
        address: form.address,
        phone: form.phone,
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
        showAlert({
          type: "success",
          title: "Success",
          message: json.message || "Saved successfully",
        });

        await fetchSuppliers();

        await createLedgerEntry({
          code: mode === "new" ? json.supplier_code : selectedCode,
          active: "yes",
          action: mode === "new" ? "save" : "edit",
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
        showAlert({
          type: "error",
          title: "Error",
          message: json.message || "Save failed",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      showAlert({
        type: "error",
        title: "Error",
        message: "Error saving supplier",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) {
      showAlert({
        type: "error",
        title: "Delete",
        message: "Select a supplier first.",
      });
      return;
    }

    const confirm = await askQuestion("Confirm Delete", "Are you sure you want to delete this supplier?");
    if (!confirm) return;

    try {
      const res = await fetch(`${apiBase}/${selectedCode}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_user: username }),
      });
      const json = await res.json();
      if (json.success) {
        showAlert({
          type: "success",
          title: "Deleted",
          message: json.message || "Deleted successfully",
        });
        await fetchSuppliers();
        resetForm();
        setMode("view");

        await createLedgerEntry({
          code: selectedCode,
          active: "no",
          action: "delete",
        });
      } else {
        showAlert({
          type: "error",
          title: "Error",
          message: json.message || "Delete failed",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleExit = () => {
    setMode("view");
    resetForm();
  };

  const handleRowClick = (s) => {
    setForm({
      code: s.code,
      name: s.name,
      address: s.address,
      phone: s.phone,
      contactPerson: s.contactPerson,
      advance: s.advance,
      date: s.date,
      route: s.route,
      credit: s.credit,
      status: s.status,
      balance: s.balance,
      totalReturn: s.totalReturn,
    });
    setSelectedId(s.id);
    setSelectedCode(s.code);
    setMode("edit");
  };

  const filteredSuppliers = suppliers.filter((s) =>
    Object.values(s).some(
      (val) => val && val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="page-layoutsup">
      <Menu />
      <div className="supplier-container">
         <Namewithdateacc/>
        <div className="user-infocus">
          
        </div>

        <h2 className="supplier-header">
          Supplier Details{" "}
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
            alt="supplier"
            className="title-icon"
          />
        </h2>

       
        <div className="form-section">
          <div className="form-left">
            <label>Code:</label>
            <input name="code" value={form.code} readOnly />
            <label>Name:</label>
            <input name="name" value={form.name} onChange={handleChange} readOnly={mode === "view"} />
            <label>Address:</label>
            <input name="address" value={form.address} onChange={handleChange} readOnly={mode === "view"} />
            <label>Phone:</label>
            <input name="phone" value={form.phone} onChange={handleChange} readOnly={mode === "view"} />
            <label>Contact Person:</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} readOnly={mode === "view"} />
            <label>Advance Payment:</label>
            <input name="advance" type="number" step="0.01" value={form.advance} onChange={handleChange} readOnly={mode === "view"} />
          </div>

          <div className="form-right">
            <label>Date:</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} readOnly={mode === "view"} />
            
            <label>Credit Amount:</label>
            <input name="credit" type="number" step="0.01" value={form.credit} onChange={handleChange} readOnly={mode === "view"} />
            <label>Status:</label>
            <input name="status" value={form.status} onChange={handleChange} readOnly={mode === "view"} />
            <label>Balance Payment:</label>
            <input name="balance" type="number" step="0.01" value={form.balance} onChange={handleChange} readOnly={mode === "view"} />
            <label>Total Return:</label>
            <input name="totalReturn" type="number" step="0.01" value={form.totalReturn} onChange={handleChange} readOnly={mode === "view"} />
          </div>
        </div>

        
        <div className="button-section">
          {mode === "view" && (
            <>
              <button className="btnsup-new" onClick={handleNew}>New</button>
              <button className="btnsup-exit" onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "new" && (
            <>
              <button className="btnsup-save" onClick={handleSave}>Save</button>
              <button className="btnsup-clear" onClick={() => resetForm(true)}>Clear</button>
              <button className="btnsup-exit" onClick={handleExit}>Exit</button>
            </>
          )}
          {mode === "edit" && (
            <>
              <button className="btnsup-modify" onClick={handleSave}>Modify</button>
              <button className="btnsup-delete" onClick={handleDelete}>Delete</button>
              <button className="btnsup-exit" onClick={handleExit}>Exit</button>
            </>
          )}
        </div>

       
        <div className="search-bar">
          <input type="text" placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>

        <div className="rows-per-page">
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={50}>50 Rows</option>
          </select>
        </div>

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
            {currentSuppliers.map((s) => (
              <tr key={s.id} onClick={() => handleRowClick(s)} style={{ cursor: "pointer", background: selectedId === s.id ? "#eef" : "" }}>
                <td>{s.id}</td>
                <td>{s.code}</td>
                <td>{s.name}</td>
                <td>{s.address}</td>
                <td>{s.phone}</td>
                <td>{s.contactPerson}</td>
                <td>{Number(s.credit).toFixed(2)}</td>
                <td>{Number(s.advance).toFixed(2)}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} className={currentPage === page ? "active" : ""} onClick={() => setCurrentPage(page)}>
              {page}
            </button>
          ))}
        </div>
      </div>

      <AlertBox show={alert.show} type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose || closeAlert} onConfirm={alert.onConfirm} />
    </div>
  );
}
