
import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import "./issuebillbook.css";

export default function IssueBillBook() {
  const [form, setForm] = useState({
    employeeNo: "",
    previousBillBookNo: "",
    issueDate: "",
    returnDate: "",
    newBillBookNo: "",
    newIssueDate: "",
    remarks: "",
  });

  const [pendingBills, setPendingBills] = useState([]);
  const [returnedBills, setReturnedBills] = useState([]);

  useEffect(() => {
    
    setPendingBills([
      { id: 1, employeeNo: "EMP001", name: "John Doe", previousBillBookNo: "BB100", issueDate: "2025-10-01", returnDate: "2025-10-05", newBillBookNo: "BB101", newIssueDate: "2025-10-06" },
      { id: 2, employeeNo: "EMP002", name: "Jane Smith", previousBillBookNo: "BB102", issueDate: "2025-10-02", returnDate: "2025-10-07", newBillBookNo: "BB103", newIssueDate: "2025-10-08" },
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleReturn = (bill) => {
    setPendingBills(prev => prev.filter(p => p.id !== bill.id));
    setReturnedBills(prev => [...prev, bill]);
  };

  const handleSave = () => { alert("Bill Book saved!"); };
  const handleClear = () => setForm({
    employeeNo: "",
    previousBillBookNo: "",
    issueDate: "",
    returnDate: "",
    newBillBookNo: "",
    newIssueDate: "",
    remarks: "",
  });
  const handleExit = () => alert("Exit clicked!");
  const handleAdd = () => alert("Add clicked!");
  const handleEdit = () => alert("Edit clicked!");
  const handleDelete = () => alert("Delete clicked!");
  const handlePrint = () => alert("Print clicked!");
  const handleView = () => alert("View clicked!");

  return (
    <div className="ibb-containeribb">
      <Menu />

     

      <div className="ibb-mainibb">
        
        <div className="ibb-left-columnibb">
          <div className="ibb-form-containeribb">
            <div className="ibb-form-gridibb">
              {[
                { label: "Employee No", name: "employeeNo" },
                { label: "Previous Bill Book No", name: "previousBillBookNo" },
                { label: "Issue Date", name: "issueDate", type: "date" },
                { label: "Return Date", name: "returnDate", type: "date" },
                { label: "Issue New Bill Book No", name: "newBillBookNo" },
                { label: "New Issue Date", name: "newIssueDate", type: "date" },
                { label: "Remarks", name: "remarks", type: "textarea" },
              ].map(field => (
                <div key={field.name} className="ibb-form-itemibb">
                  <label>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      className="ibb-inputfieldibb"
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      className="ibb-inputfieldibb"
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="ibb-button-groupibb">
              <button className="ibb-btn-addibb" onClick={handleAdd}>Add</button>
              <button className="ibb-btn-saveibb" onClick={handleSave}>Save</button>
              <button className="ibb-btn-clearibb" onClick={handleClear}>Clear</button>
              <button className="ibb-btn-exitibb" onClick={handleExit}>Exit</button>
              <button className="ibb-btn-editibb" onClick={handleEdit}>Edit</button>
              <button className="ibb-btn-deleteibb" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>

        
        <div className="ibb-right-columnibb">
          <div className="ibb-grid-containeribb">
            <h2>Pending Return Bill Books</h2>
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
                {pendingBills.map(bill => (
                  <tr key={bill.id}>
                    <td>{bill.employeeNo}</td>
                    <td>{bill.name}</td>
                    <td>{bill.previousBillBookNo}</td>
                    <td>{bill.issueDate}</td>
                    <td>{bill.returnDate}</td>
                    <td>{bill.newBillBookNo}</td>
                    <td>{bill.newIssueDate}</td>
                    <td>
                      <button className="ibb-btn-returnibb" onClick={() => handleReturn(bill)}>Return</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ibb-grid-containeribb">
            <h2>Returned Bill Books</h2>
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
                {returnedBills.map(bill => (
                  <tr key={bill.id}>
                    <td>{bill.employeeNo}</td>
                    <td>{bill.name}</td>
                    <td>{bill.previousBillBookNo}</td>
                    <td>{bill.issueDate}</td>
                    <td>{bill.returnDate}</td>
                    <td>{bill.newBillBookNo}</td>
                    <td>{bill.newIssueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>

           
            <div className="ibb-bottom-buttonsibb">
              <button className="ibb-btn-printibb" onClick={handlePrint}>Print</button>
              <button className="ibb-btn-viewibb" onClick={handleView}>View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
