// AdvancePayment.js
import React, { useState, useEffect, useRef } from "react";
import Menu from "../componants/Menu";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBoxre from "../componants/Alertboxre";
import { CheckCircle, HelpCircle } from "lucide-react";
import "./advancepayment.css";

const AdvancePayment = () => {
  const [partyType, setPartyType] = useState("customer");

  const [form, setForm] = useState({
    adpaynumber: "",
    type: "customer",
    code: "",
    name: "",
    address: "",
    date: new Date().toISOString().slice(0, 16),
    amount: "",
    paymentType: "",
    bank: "",
    branch: "",
    chequeNo: "",
    otherDetails: "",
    setoffDate: new Date().toISOString().slice(0, 10),
    remarks: ""
  });

  const [errors, setErrors] = useState({});
  const [gridData, setGridData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchInputRef = useRef(null);
  const resultsRef = useRef([]);
  const searchTimerRef = useRef(null);

  // Alert state uses the same shape your AlertBoxre expects
  const [alert, setAlert] = useState({ show: false, type: "info", title: "", message: "", onConfirm: null });

  // ---------- Existing first-grid state (unchanged) ----------
  // (gridData, selectedRows are used by your first grid)

  // ---------- Second grid state ----------
  const [allPayments, setAllPayments] = useState([]); // full list from backend (filtered by status)
  const [statusFilter, setStatusFilter] = useState("Pending"); // default Pending
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // computed pagination for second grid
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = allPayments.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.max(1, Math.ceil(allPayments.length / rowsPerPage));

  const loginUser = localStorage.getItem("username") || "Guest";

  // keep track if a second-grid row has been loaded into form
  const [loadedFromSecondGrid, setLoadedFromSecondGrid] = useState(null); // will hold advance_pay_id when loaded

  useEffect(() => {
    if (showModal && searchInputRef.current) searchInputRef.current.focus();
  }, [showModal]);

  // fetch second grid when statusFilter changes
  useEffect(() => {
    fetchPayments();
    setCurrentPage(1);
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      const resp = await fetch(`http://localhost:5000/api/advancepay/all?status=${statusFilter}`);
      if (!resp.ok) throw new Error("Failed to fetch payments");
      const data = await resp.json();
      setAllPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: "error", title: "Error", message: "Failed to load payments.", onConfirm: null });
    }
  };

  // ----------------- Helpers -----------------
  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const fetchNextAdpNumber = async () => {
    try {
      const resp = await fetch("http://localhost:5000/api/advancepay/next-id");
      const data = await resp.json();
      return data.nextId || "ADP00001";
    } catch (err) {
      console.error(err);
      return "ADP00001";
    }
  };

  // ----------------- Modal Search -----------------
  const openModal = (initialQuery = "") => {
    setSearchQuery(initialQuery);
    setSearchResults([]);
    setActiveIndex(-1);
    setShowModal(true);
    fetchSearch(initialQuery);
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveIndex(-1);
  };

  const fetchSearch = async (q = "") => {
    const endpoint =
      partyType === "customer"
        ? `http://localhost:5000/api/advancepay/search/customers?keyword=${encodeURIComponent(q)}`
        : `http://localhost:5000/api/advancepay/search/suppliers?keyword=${encodeURIComponent(q)}`;
    try {
      const resp = await fetch(endpoint);
      if (!resp.ok) throw new Error("Search failed");
      const data = await resp.json();
      const normalized = data.map(item => ({
        code: item.customer_code || item.sup_code,
        name: item.name || item.sup_name,
        address: item.address
      }));
      setSearchResults(normalized);
      setActiveIndex(normalized.length ? 0 : -1);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
      setAlert({ show: true, type: "error", title: "Search", message: "Failed to load search results", onConfirm: null });
    }
  };

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQuery(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchSearch(v), 200);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i < searchResults.length - 1 ? i + 1 : i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i > 0 ? i - 1 : i));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) selectParty(searchResults[activeIndex]);
    } else if (e.key === "Escape") {
      closeModal();
    }
  };

  const selectParty = async (item) => {
    if (!item) return;

    // Fetch next Advance Pay Number and set it immediately
    const nextAdpNumber = await fetchNextAdpNumber();

    setForm(prev => ({
      ...prev,
      code: item.code,
      name: item.name,
      address: item.address,
      adpaynumber: nextAdpNumber
    }));

    // when selecting a party manually, we are not loading from second grid
    setLoadedFromSecondGrid(null);

    closeModal();
  };

  // ----------------- Validation -----------------
  const validate = () => {
    const e = {};
    if (!form.code?.trim()) e.code = "Code is required";
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.date?.trim()) e.date = "Payment date is required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Amount must be > 0";
    if (!form.paymentType?.trim()) e.paymentType = "Payment type is required";
    if (!form.setoffDate?.trim()) e.setoffDate = "Setoff date is required";

    if (form.paymentType === "Cheque") {
      if (!form.bank?.trim()) e.bank = "Bank is required for cheque";
      if (!form.branch?.trim()) e.branch = "Branch is required for cheque";
      if (!form.chequeNo?.trim()) e.chequeNo = "Cheque No is required";
    }

    if (form.paymentType === "Other") {
      if (!form.otherDetails?.trim()) e.otherDetails = "Description is required for Other payment";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ----------------- Add Row -----------------
  const handleAdd = async () => {
    if (!validate()) {
      setAlert({ show: true, type: "error", title: "Validation", message: "Please fix validation errors.", onConfirm: null });
      return;
    }

    const adpayNumber = await fetchNextAdpNumber();
    setGridData(prev => [...prev, { ...form, adpaynumber: adpayNumber }]);

    // Clear form fields
    setForm({
      adpaynumber: "",
      type: partyType,
      code: "",
      name: "",
      address: "",
      date: new Date().toISOString().slice(0, 16),
      amount: "",
      paymentType: "",
      bank: "",
      branch: "",
      chequeNo: "",
      otherDetails: "",
      setoffDate: new Date().toISOString().slice(0, 10),
      remarks: ""
    });

    setAlert({ show: true, type: "info", title: "Added", message: "Added successfully.", onConfirm: null });
  };

  // ----------------- Save Grid -----------------
  const handleSave = async () => {
    if (!gridData.length) {
      setAlert({ show: true, type: "error", title: "Save", message: "No rows to save.", onConfirm: null });
      return;
    }

    try {
      for (const row of gridData) {
        const res = await fetch("http://localhost:5000/api/advancepay/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...row,
            loginUser: loginUser // ← USE YOUR USERNAME
          })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Save failed");
      }

      setGridData([]);
      setForm({
        adpaynumber: "",
        type: partyType,
        code: "",
        name: "",
        address: "",
        date: new Date().toISOString().slice(0, 16),
        amount: "",
        paymentType: "",
        bank: "",
        branch: "",
        chequeNo: "",
        otherDetails: "",
        setoffDate: new Date().toISOString().slice(0, 10),
        remarks: ""
      });

      // refresh second-grid list too (pending items may change)
      fetchPayments();

      setAlert({ show: true, type: "success", title: "Saved", message: "Saved successfully!", onConfirm: null });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: "error", title: "Save Error", message: err.message, onConfirm: null });
    }
  };

  // ----------------- Row selection (first grid) -----------------
  const handleRowClick = (row) => {
    const already = selectedRows.includes(row.code);
    let newSel = already ? selectedRows.filter(c => c !== row.code) : [...selectedRows, row.code];
    setSelectedRows(newSel);

    if (newSel.length === 1) {
      const sel = gridData.find(r => r.code === newSel[0]);
      if (sel) {
        setForm({ ...sel });
        // clear second-grid loaded flag, since this is from first grid
        setLoadedFromSecondGrid(null);
      }
    }
  };

  // ----------------- Modify / Delete (first grid) -----------------
  const handleModify = () => {
    if (selectedRows.length !== 1) {
      setAlert({ show: true, type: "error", title: "Modify", message: "Select one row.", onConfirm: null });
      return;
    }
    if (!validate()) {
      setAlert({ show: true, type: "error", title: "Modify", message: "Fix validation errors first.", onConfirm: null });
      return;
    }
    setGridData(gridData.map(r => r.code === selectedRows[0] ? { ...form } : r));
    setSelectedRows([]);
    setAlert({ show: true, type: "success", title: "Updated", message: "Updated successfully!", onConfirm: null });
  };

  const handleDelete = () => {
    if (!selectedRows.length) {
      setAlert({ show: true, type: "error", title: "Delete", message: "Select rows to delete.", onConfirm: null });
      return;
    }

    // Show confirmation for first-grid delete (local delete)
    setAlert({
      show: true,
      type: "question",
      title: "Confirm",
      message: "Do you really want to delete the selected rows?",
      onConfirm: () => {
        setGridData(prev => prev.filter(r => !selectedRows.includes(r.code)));
        setSelectedRows([]);
        setAlert({ show: true, type: "success", title: "Deleted", message: "Deleted selected rows.", onConfirm: null });
      }
    });
  };

  // ----------------- Clear -----------------
  const handleClear = () => {
    setGridData([]);
    setSelectedRows([]);
    setForm({
      adpaynumber: "",
      type: partyType,
      code: "",
      name: "",
      address: "",
      date: new Date().toISOString().slice(0, 16),
      amount: "",
      paymentType: "",
      bank: "",
      branch: "",
      chequeNo: "",
      otherDetails: "",
      setoffDate: new Date().toISOString().slice(0, 10),
      remarks: ""
    });
    setErrors({});
    setLoadedFromSecondGrid(null);
    setAlert({ show: true, type: "info", title: "Cleared", message: "Cleared.", onConfirm: null });
  };

  const anyAdpayNumberNotEmpty = gridData.some(r => r.adpaynumber && r.adpaynumber.toString().trim() !== "");
  const oneSelected = selectedRows.length === 1;
  const multipleSelected = selectedRows.length > 1;

  // ----------------- Second-grid row click behavior -----------------
  // when clicking a row in the second grid we load data into form and show Delete/Clear/Exit only
  const handleSecondGridRowClick = (row) => {
    // load the row fields into the same form structure
    setForm({
      adpaynumber: row.advance_pay_id || "",
      type: row.party || "customer",
      code: row.party_code || "",
      name: row.party_name || "",
      address: row.address || "",
      date: row.advance_pay_date ? new Date(row.advance_pay_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      amount: row.advance_payment_amount ? String(row.advance_payment_amount) : "",
      paymentType: row.payment_type || "",
      bank: row.bank_name || "",
      branch: row.branch || "",
      chequeNo: row.cheque_no ? String(row.cheque_no) : "",
      otherDetails: row.other_payment_type || "",
      setoffDate: row.setoff_date ? new Date(row.setoff_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      remarks: row.remarks || ""
    });

    // mark we loaded from second grid (store id)
    setLoadedFromSecondGrid(row.advance_pay_id || null);
    // Clear first-grid selection to avoid confusion
    setSelectedRows([]);
  };

  // ----------------- Cancel (set status = 'Cancelled') -----------------
  const confirmCancelAdvance = async () => {
    const advId = loadedFromSecondGrid;
    if (!advId) {
      setAlert({ show: true, type: "error", title: "Cancel", message: "No Advance Pay selected.", onConfirm: null });
      return;
    }

    try {
    const res = await fetch(
      `http://localhost:5000/api/advancepay/update-status/${form.adpaynumber}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" })
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to update status");
    }

    const data = await res.json();

    setAlert({
      show: true,
      type: "success",
      title: "Cancelled Successfully",
      message: data.message || "Status updated to Cancelled!",
      onClose: () => setAlert({ show: false })
    });

      // refresh second-grid
      await fetchPayments();

      // clear form
      setForm({
        adpaynumber: "",
        type: partyType,
        code: "",
        name: "",
        address: "",
        date: new Date().toISOString().slice(0, 16),
        amount: "",
        paymentType: "",
        bank: "",
        branch: "",
        chequeNo: "",
        otherDetails: "",
        setoffDate: new Date().toISOString().slice(0, 10),
        remarks: ""
      });
      setLoadedFromSecondGrid(null);

      setAlert({ show: true, type: "success", title: "Cancelled", message: `Advance Pay ${advId} cancelled successfully.`, onConfirm: null });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: "error", title: "Cancel Error", message: err.message, onConfirm: null });
    }
  };

  // Show confirmation when user clicks Delete while loadedFromSecondGrid is set
  const onDeleteFromSecondGridClick = () => {
    if (!loadedFromSecondGrid) {
      setAlert({ show: true, type: "error", title: "Delete", message: "No second-grid row selected.", onConfirm: null });
      return;
    }

    setAlert({
      show: true,
      type: "question",
      title: "Confirm Cancel",
      message: `Do you really want to cancel this Advance Pay Number "${loadedFromSecondGrid}"?`,
      onConfirm: () => {
        // call cancel
        confirmCancelAdvance();
      }
    });
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  // JSX
  return (
    <div className="advance-container">
      <Menu />
      <div className="content">
        <Namewithdateacc />
        <h2>Advance Payment</h2>

        <div className="form-group">
          <label>Select Party:</label>
          <select value={partyType} onChange={(e) => setPartyType(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>

        <div className="form-group">
          <label>Search Party</label>
          <input
            placeholder="Type code or name"
            value={form.code || ""}
            onChange={(e) => { setField("code", e.target.value); if(!showModal) openModal(e.target.value); }}
            onFocus={() => openModal(form.code)}
            className={errors.code ? "input-error" : ""}
          />
          {errors.code && <div className="input-error-text">{errors.code}</div>}
        </div>

        <div className="form-box">
          <div className="form-group">
            <label>Advance Pay Number</label>
            <input value={form.adpaynumber} readOnly />

            <label>Name</label>
            <input value={form.name} onChange={e => setField("name", e.target.value)} className={errors.name ? "input-error" : ""} />
            {errors.name && <div className="input-error-text">{errors.name}</div>}

            <label>Address</label>
            <input value={form.address} onChange={e => setField("address", e.target.value)} />

            <label>Payment Date</label>
            <input type="datetime-local" value={form.date} onChange={e => setField("date", e.target.value)} className={errors.date ? "input-error" : ""} />
            {errors.date && <div className="input-error-text">{errors.date}</div>}

            <label>Amount</label>
            <input value={form.amount} onChange={e => setField("amount", e.target.value)} className={errors.amount ? "input-error" : ""} />
            {errors.amount && <div className="input-error-text">{errors.amount}</div>}

            <label>Payment Type</label>
            <select value={form.paymentType} onChange={e => setField("paymentType", e.target.value)} className={errors.paymentType ? "input-error" : ""}>
              <option value="">Select Payment Type</option>
              <option value="Cash">Cash</option>
              <option value="Bank Online">Bank Online</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
            {errors.paymentType && <div className="input-error-text">{errors.paymentType}</div>}

            {form.paymentType === "Cheque" && (
              <>
                <label>Bank</label>
                <input value={form.bank} onChange={e => setField("bank", e.target.value)} className={errors.bank ? "input-error" : ""} />
                {errors.bank && <div className="input-error-text">{errors.bank}</div>}

                <label>Branch</label>
                <input value={form.branch} onChange={e => setField("branch", e.target.value)} className={errors.branch ? "input-error" : ""} />
                {errors.branch && <div className="input-error-text">{errors.branch}</div>}

                <label>Cheque No</label>
                <input value={form.chequeNo} onChange={e => setField("chequeNo", e.target.value)} className={errors.chequeNo ? "input-error" : ""} />
                {errors.chequeNo && <div className="input-error-text">{errors.chequeNo}</div>}
              </>
            )}

            {form.paymentType === "Other" && (
              <>
                <label>Other Description</label>
                <input value={form.otherDetails} onChange={e => setField("otherDetails", e.target.value)} className={errors.otherDetails ? "input-error" : ""} />
                {errors.otherDetails && <div className="input-error-text">{errors.otherDetails}</div>}
              </>
            )}

            <label>Setoff Date</label>
            <input type="date" value={form.setoffDate} onChange={e => setField("setoffDate", e.target.value)} className={errors.setoffDate ? "input-error" : ""} />
            {errors.setoffDate && <div className="input-error-text">{errors.setoffDate}</div>}

            <label>Remarks</label>
            <textarea value={form.remarks} onChange={e => setField("remarks", e.target.value)} />
          </div>
        </div>

        {/* Buttons */}
        <div className="buttons">
          {/* When loadedFromSecondGrid is set, show only Delete / Clear / Exit */}
          {loadedFromSecondGrid ? (
            <>
              <button className="btnadvdelete" onClick={onDeleteFromSecondGridClick}>Delete</button>
              <button className="btnadvclear" onClick={handleClear}>Clear</button>
              <button className="btnadvexit">Exit</button>
            </>
          ) : (
            <>
              {gridData.length === 0 && (
                <>
                  <button className="btnadvadd" onClick={handleAdd}>Add</button>
                  <button className="btnadvexit">Exit</button>
                </>
              )}

              {gridData.length > 0 && anyAdpayNumberNotEmpty && selectedRows.length === 0 && (
                <>
                  <button className="btnadvsave" onClick={handleSave}>Save</button>
                  <button className="btnadvclear" onClick={handleClear}>Clear</button>
                  <button className="btnadvexit">Exit</button>
                </>
              )}

              {oneSelected && (
                <>
                  <button className="btnadvmodify" onClick={handleModify}>Edit</button>
                  <button className="btnadvdelete" onClick={handleDelete}>Delete</button>
                  <button className="btnadvsave">Save</button>
                  <button className="btnadvexit">Exit</button>
                </>
              )}

              {multipleSelected && (
                <>
                  <button className="btnadvclear" onClick={handleClear}>Clear</button>
                  <button className="btnadvdelete" onClick={handleDelete}>Delete</button>
                  <button className="btnadvexit">Exit</button>
                </>
              )}
            </>
          )}
        </div>

        {/* First Grid (unchanged) */}
        {gridData.length > 0 && (
          <table className="grid">
            <thead>
              <tr>
                <th>Select</th>
                <th>Advance Pay Number</th>
                <th>Type</th>
                <th>Code</th>
                <th>Name</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Type</th>
                <th>Setoff Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, idx) => (
                <tr
                  key={idx}
                  className={selectedRows.includes(row.code) ? "selected-row" : ""}
                  onClick={() => handleRowClick(row)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.code)}
                      readOnly
                    />
                  </td>
                  <td>{row.adpaynumber}</td>
                  <td>{row.type}</td>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.date}</td>
                  <td>{row.amount}</td>
                  <td>{row.paymentType}</td>
                  <td>{row.setoffDate}</td>
                  <td>{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ---------- Second Grid area (below first grid) ---------- */}
        <div className="second-grid-area">
          <div className="status-filter">
            <label style={{ fontWeight: 600, marginRight: 12 }}>Advance Payment Details:</label>

            <label style={{ marginRight: 8 }}>
              <input type="radio" name="status" value="All" checked={statusFilter === "All"}
                onChange={e => setStatusFilter(e.target.value)} /> All
            </label>

            <label style={{ marginRight: 8 }}>
              <input type="radio" name="status" value="Pending" checked={statusFilter === "Pending"}
                onChange={e => setStatusFilter(e.target.value)} /> Pending
            </label>

            <label style={{ marginRight: 8 }}>
              <input type="radio" name="status" value="Settled" checked={statusFilter === "Settled"}
                onChange={e => setStatusFilter(e.target.value)} /> Settled
            </label>

            <label style={{ marginRight: 8 }}>
              <input type="radio" name="status" value="Cancelled" checked={statusFilter === "Cancelled"}
                onChange={e => setStatusFilter(e.target.value)} /> Cancelled
            </label>

          </div>

          {allPayments.length > 0 ? (
            <>
              <table className="grid second-grid">
                <thead>
                  <tr>
                    <th>Advance Pay ID</th>
                    <th>Party</th>
                    <th>Party Code</th>
                    <th>Party Name</th>
                    <th>Amount</th>
                    <th>Payment Date</th>
                    <th>Setoff Date</th>
                    <th>Remarks</th>
                    <th>Payment Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx} onClick={() => handleSecondGridRowClick(row)} style={{ cursor: "pointer" }}>
                      <td>{row.advance_pay_id}</td>
                      <td>{row.party}</td>
                      <td>{row.party_code}</td>
                      <td>{row.party_name}</td>
                      <td>{row.advance_payment_amount}</td>
                      <td>{row.advance_pay_date}</td>
                      <td>{row.setoff_date}</td>
                      <td>{row.remarks}</td>
                      <td>{row.payment_type}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 12 }}>No records found.</div>
          )}
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Search {partyType === "customer" ? "Customer" : "Supplier"}</h3>
              <button onClick={closeModal}>X</button>
            </div>

            <div className="modal-search">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type code, name or address..."
              />
            </div>

            <div className="modal-results">
              {searchResults.length === 0 ? (
                <div className="no-results">No results</div>
              ) : (
                <ul>
                  {searchResults.map((r, i) => (
                    <li
                      key={i}
                      ref={el => resultsRef.current[i] = el}
                      className={i === activeIndex ? "active" : ""}
                      onMouseEnter={() => setActiveIndex(i)}
                      onDoubleClick={() => selectParty(r)}
                    >
                      <div style={{ width: 120 }}>{r.code}</div>
                      <div style={{ flex: 1 }}>{r.name}</div>
                      <div style={{ width: 200 }}>{r.address}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  if (activeIndex >= 0) selectParty(searchResults[activeIndex]);
                  else setAlert({ show: true, type: "error", title: "Select", message: "Select a row first", onConfirm: null });
                }}
              >
                Select
              </button>
              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* AlertBoxre - re-used component */}
      <AlertBoxre
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          // call stored confirm (if any)
          if (typeof alert.onConfirm === "function") alert.onConfirm();
          // close question alert afterwards only if not overwritten by handler
          setAlert(prev => ({ ...prev, show: false }));
        }}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default AdvancePayment;
