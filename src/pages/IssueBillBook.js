import React, { useEffect, useState } from "react";
import Menu from "../componants/Menu";
import "./issuebillbook.css";

export default function IssueBillBook() {
  const emptyForm = {
    id: null,
    employeeNo: "",
    name: "",
    previousBillBookNo: "",
    issueDate: "",
    returnDate: "",
    newBillBookNo: "",
    newIssueDate: "",
    remarks: "",
  };

  
  const [form, setForm] = useState(emptyForm);
 
  const [mode, setMode] = useState("view");

  
  const [pendingBills, setPendingBills] = useState([]);
  const [returnedBills, setReturnedBills] = useState([]);

 
  const [searchPending, setSearchPending] = useState("");
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [pendingPage, setPendingPage] = useState(1);

  
  const [searchReturned, setSearchReturned] = useState("");
  const [returnedPageSize, setReturnedPageSize] = useState(10);
  const [returnedPage, setReturnedPage] = useState(1);

 


  
  const resetForm = () => setForm(emptyForm);
  
  const isFieldsReadOnly = () => !(mode === "adding" || mode === "editing");

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  
  const handleAdd = () => {
    resetForm();
    setMode("adding");
  };

  // Clear
  const handleClear = () => {
    resetForm();
    setMode("view");
  };

  // Exit 
  const handleExit = () => {
    resetForm();
    setMode("view");
  };

  // Save 
  const handleSave = () => {
    if (!form.employeeNo || !form.previousBillBookNo) {
      alert("Please fill Employee No and Previous Bill Book No.");
      return;
    }

    if (mode === "adding") {
      // generate id
      const maxId =
        Math.max(
          0,
          ...pendingBills.map((p) => p.id || 0),
          ...returnedBills.map((r) => r.id || 0)
        ) + 1;
      const newRec = { ...form, id: maxId };
      setPendingBills((p) => [newRec, ...p]);
      resetForm();
      setMode("view");
      setPendingPage(1);
      return;
    }

    if (mode === "editing") {
      if (form.id == null) {
        alert("No record selected to update.");
        return;
      }
      // update pending list if record exists there; otherwise update returned
      setPendingBills((p) => p.map((it) => (it.id === form.id ? { ...form } : it)));
      setReturnedBills((r) => r.map((it) => (it.id === form.id ? { ...form } : it)));
      setMode("selected");
      return;
    }
  };

  // Select a pending row -> show read-only form and pending actions
  const handleSelectPending = (rec) => {
    setForm({ ...rec });
    setMode("selected");
  };

  // Select a returned row -> form read-only and show only add/clear/exit options
  const handleSelectReturned = (rec) => {
    setForm({ ...rec });
    setMode("selectedReturned");
  };

  // Edit: only allowed from pending selection
  const handleEdit = () => {
    if (mode !== "selected") {
      alert("Please select a pending record to edit.");
      return;
    }
    setMode("editing");
  };

  // Delete: only allowed from pending selection
  const handleDelete = () => {
    if (mode !== "selected" || form.id == null) {
      alert("Please select a pending record to delete.");
      return;
    }
    if (!window.confirm("Delete this record?")) return;
    setPendingBills((p) => p.filter((r) => r.id !== form.id));
    setReturnedBills((r) => r.filter((x) => x.id !== form.id));
    resetForm();
    setMode("view");
  };

  // Return action: move pending -> returned
  const handleReturn = (rec) => {
    setPendingBills((p) => p.filter((r) => r.id !== rec.id));
    setReturnedBills((r) => [rec, ...r]);
    resetForm();
    setMode("view");
  };

  // Print/View placeholders
  const handlePrint = () => alert("Print action (placeholder)");
  const handleView = () => alert("View action (placeholder)");

  /* --------------------------
     Filtering & pagination
     --------------------------*/
  // Pending filtering
  const filteredPending = pendingBills.filter((r) => {
    const q = (searchPending || "").trim().toLowerCase();
    if (!q) return true;
    return (
      (r.employeeNo || "").toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q) ||
      (r.previousBillBookNo || "").toLowerCase().includes(q) ||
      (r.newBillBookNo || "").toLowerCase().includes(q)
    );
  });
  const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / pendingPageSize));
  useEffect(() => {
    if (pendingPage > pendingTotalPages) setPendingPage(pendingTotalPages);
  }, [pendingTotalPages]); // eslint-disable-line

  const pagedPending = filteredPending.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize
  );

  // Returned filtering
  const filteredReturned = returnedBills.filter((r) => {
    const q = (searchReturned || "").trim().toLowerCase();
    if (!q) return true;
    return (
      (r.employeeNo || "").toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q) ||
      (r.previousBillBookNo || "").toLowerCase().includes(q) ||
      (r.newBillBookNo || "").toLowerCase().includes(q)
    );
  });
  const returnedTotalPages = Math.max(1, Math.ceil(filteredReturned.length / returnedPageSize));
  useEffect(() => {
    if (returnedPage > returnedTotalPages) setReturnedPage(returnedTotalPages);
  }, [returnedTotalPages]); // eslint-disable-line

  const pagedReturned = filteredReturned.slice(
    (returnedPage - 1) * returnedPageSize,
    returnedPage * returnedPageSize
  );

  // pager renderer
  const renderPager = (totalPages, currentPage, onPageChange) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return (
      <div className="ibb-pager">
        {pages.map((p) => (
          <button
            key={p}
            className={`ibb-pagebtn ${p === currentPage ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="ibb-containeribb">
      <Menu />

     

      <div className="ibb-mainibb">
        {/* LEFT COLUMN */}
        <div className="ibb-left-columnibb">
          <div className="ibb-form-containeribb">
            <div className="ibb-form-gridibb">
              <div className="ibb-form-itemibb">
                <label>Employee No</label>
                <input
                  name="employeeNo"
                  value={form.employeeNo}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  readOnly={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb">
                <label>Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  readOnly={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb">
                <label>Previous Bill Book No</label>
                <input
                  name="previousBillBookNo"
                  value={form.previousBillBookNo}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  readOnly={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb">
                <label>Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  disabled={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb">
                <label>Return Date</label>
                <input
                  type="date"
                  name="returnDate"
                  value={form.returnDate}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  disabled={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb">
                <label>Issue New Bill Book No</label>
                <input
                  name="newBillBookNo"
                  value={form.newBillBookNo}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  readOnly={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb">
                <label>New Issue Date</label>
                <input
                  type="date"
                  name="newIssueDate"
                  value={form.newIssueDate}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  disabled={isFieldsReadOnly()}
                />
              </div>

              <div className="ibb-form-itemibb ibb-remarks">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  className="ibb-inputfieldibb"
                  readOnly={isFieldsReadOnly()}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="ibb-button-groupibb">
              {mode === "view" && (
                <>
                  <button className="btn add" onClick={handleAdd}>
                    Add
                  </button>
                  <button className="btn exit" onClick={handleExit}>
                    Exit
                  </button>
                </>
              )}

              {mode === "adding" && (
                <>
                  <button className="btn save" onClick={handleSave}>
                    Save
                  </button>
                  <button className="btn clear" onClick={handleClear}>
                    Clear
                  </button>
                  <button className="btn exit" onClick={handleExit}>
                    Exit
                  </button>
                </>
              )}

              {mode === "selected" && (
                <>
                  <button className="btn edit" onClick={handleEdit}>
                    Edit
                  </button>
                  <button className="btn delete" onClick={handleDelete}>
                    Delete
                  </button>
                  <button className="btn clear" onClick={handleClear}>
                    Clear
                  </button>
                  <button className="btn exit" onClick={handleExit}>
                    Exit
                  </button>
                </>
              )}

              {mode === "selectedReturned" && (
                <>
                  <button className="btn add" onClick={handleAdd}>
                    Add
                  </button>
                  <button className="btn clear" onClick={handleClear}>
                    Clear
                  </button>
                  <button className="btn exit" onClick={handleExit}>
                    Exit
                  </button>
                </>
              )}

              {mode === "editing" && (
                <>
                  <button className="btn save" onClick={handleSave}>
                    Save
                  </button>
                  <button className="btn clear" onClick={handleClear}>
                    Clear
                  </button>
                  <button className="btn exit" onClick={handleExit}>
                    Exit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="ibb-right-columnibb">
          {/* Pending Grid */}
          <div className="ibb-grid-containeribb">
            <div className="ibb-grid-header">
              <h2>Pending Return Bill Books</h2>
              <div className="ibb-grid-controls">
                <input
                  placeholder="Search pending..."
                  value={searchPending}
                  onChange={(e) => {
                    setSearchPending(e.target.value);
                    setPendingPage(1);
                  }}
                />
                <select
                  value={pendingPageSize}
                  onChange={(e) => {
                    setPendingPageSize(Number(e.target.value));
                    setPendingPage(1);
                  }}
                >
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                </select>
              </div>
            </div>

            <table className="ibb-tableibb">
              <thead>
                <tr>
                  <th>Employee No</th>
                  <th>Name</th>
                  <th>Previous Bill No</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>New Bill No</th>
                  <th>New Issue Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedPending.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 12 }}>
                      No records
                    </td>
                  </tr>
                ) : (
                  pagedPending.map((bill) => (
                    <tr
                      key={bill.id}
                      onClick={() => handleSelectPending(bill)}
                      className={form.id === bill.id ? "selected-row" : ""}
                    >
                      <td>{bill.employeeNo}</td>
                      <td>{bill.name}</td>
                      <td>{bill.previousBillBookNo}</td>
                      <td>{bill.issueDate}</td>
                      <td>{bill.returnDate}</td>
                      <td>{bill.newBillBookNo}</td>
                      <td>{bill.newIssueDate}</td>
                      <td>
                        <button
                          className="btn return"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReturn(bill);
                          }}
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="ibb-grid-footer">
              <div>
                Showing{" "}
                {filteredPending.length === 0
                  ? 0
                  : (pendingPage - 1) * pendingPageSize + 1}{" "}
                -{" "}
                {Math.min(filteredPending.length, pendingPage * pendingPageSize)} of{" "}
                {filteredPending.length}
              </div>
              <div className="ibb-pager-wrap">
                {renderPager(pendingTotalPages, pendingPage, setPendingPage)}
              </div>
            </div>
          </div>

          {/* Returned Grid */}
          <div className="ibb-grid-containeribb">
            <div className="ibb-grid-header">
              <h2>Returned Bill Books</h2>
              <div className="ibb-grid-controls">
                <input
                  placeholder="Search returned..."
                  value={searchReturned}
                  onChange={(e) => {
                    setSearchReturned(e.target.value);
                    setReturnedPage(1);
                  }}
                />
                <select
                  value={returnedPageSize}
                  onChange={(e) => {
                    setReturnedPageSize(Number(e.target.value));
                    setReturnedPage(1);
                  }}
                >
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                </select>
              </div>
            </div>

            <table className="ibb-tableibb">
              <thead>
                <tr>
                  <th>Employee No</th>
                  <th>Name</th>
                  <th>Previous Bill No</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>New Bill No</th>
                  <th>New Issue Date</th>
                </tr>
              </thead>
              <tbody>
                {pagedReturned.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 12 }}>
                      No records
                    </td>
                  </tr>
                ) : (
                  pagedReturned.map((bill) => (
                    <tr
                      key={bill.id}
                      onClick={() => handleSelectReturned(bill)}
                      className={form.id === bill.id ? "selected-row" : ""}
                    >
                      <td>{bill.employeeNo}</td>
                      <td>{bill.name}</td>
                      <td>{bill.previousBillBookNo}</td>
                      <td>{bill.issueDate}</td>
                      <td>{bill.returnDate}</td>
                      <td>{bill.newBillBookNo}</td>
                      <td>{bill.newIssueDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="ibb-grid-footer">
              <div>
                Showing{" "}
                {filteredReturned.length === 0
                  ? 0
                  : (returnedPage - 1) * returnedPageSize + 1}{" "}
                -{" "}
                {Math.min(filteredReturned.length, returnedPage * returnedPageSize)} of{" "}
                {filteredReturned.length}
              </div>
              <div className="ibb-pager-wrap">
                {renderPager(returnedTotalPages, returnedPage, setReturnedPage)}
              </div>
            </div>

            <div className="ibb-bottom-buttonsibb">
              <button className="btn print" onClick={handlePrint}>
                Print
              </button>
              <button className="btn view" onClick={handleView}>
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
