import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./admin.css";
import { useEffect } from "react";


export default function Admin() {
  const [form, setForm] = useState({
    employeeNo: "",
    idNo: "",
    firstName: "",
    lastName: "",
    callingName: "",
    address: "",
    position: "",
    permissions: {},
  });

  const [gridData, setGridData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showBillBook, setShowBillBook] = useState(false);
  const [billBook, setBillBook] = useState({
    empNo: "",
    prevBook: "",
    issueDate: "",
    returnDate: "",
    newBookNo: "",
    newIssueDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handlePermissionChange = (perm) => {
    setForm((p) => ({
      ...p,
      permissions: { ...p.permissions, [perm]: !p.permissions[perm] },
    }));
  };

  const handleNew = () => {
    setForm({
      employeeNo: "",
      idNo: "",
      firstName: "",
      lastName: "",
      callingName: "",
      address: "",
      position: "",
      permissions: {},
    });
    setIsAdding(true);
    setSelectedRow(null);
  };

  useEffect(() => {
  fetch("http://localhost:5000/api/admin")
    .then(res => res.json())
    .then(data => setGridData(data));
}, []);

  const handleAdd = () => {
  fetch("http://localhost:5000/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  })
    .then(() => fetch("http://localhost:5000/api/admin"))
    .then(res => res.json())
    .then(data => setGridData(data));
};

  const handleEdit = () => {
  fetch("http://localhost:5000/api/admin", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  })
    .then(() => fetch("http://localhost:5000/api/admin"))
    .then(res => res.json())
    .then(data => setGridData(data));
};

  const handleDelete = () => {
  fetch(`http://localhost:5000/api/admin/${form.employeeNo}`, { method: "DELETE" })
    .then(() => fetch("http://localhost:5000/api/admin"))
    .then(res => res.json())
    .then(data => setGridData(data));
};

  const handleRowClick = (row) => {
    setForm(row);
    setSelectedRow(row);
    setIsAdding(true);
  };

  return (
    <div className="admin-containerad">
      <Menu />
      <div className="admin-contentad">
        <h1 className="titlead">Admin Panel</h1>

        {/* Form Section */}
        <div className="form-boxad">
          <div className="form-grid-two-columnad">
            <div className="left-boxad">
              {[
                { label: "Employee Number", name: "employeeNo" },
                { label: "ID Number", name: "idNo" },
                { label: "First Name", name: "firstName" },
                { label: "Last Name", name: "lastName" },
                { label: "Calling Name", name: "callingName" },
                { label: "Address", name: "address" },
                { label: "Position", name: "position" },
              ].map((field) => (
                <div key={field.name} className="form-itemad">
                  <label>{field.label}</label>
                  <input
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    className="input-fieldad"
                  />
                </div>
              ))}
            </div>

            <div className="right-boxad">
              <label className="permission-titlead">Permissions</label>
              <div className="permission-gridad">
                <div className="permission-gridad">
  {[
    "Customer Details",
    "Supplier Details",
    "Product Details",
    "Production",
    "GRN",
    "Sale",
    "Advance Payment",
    "Material Order",
    "Goods Dispatch Note",
    "Stock Control",
    "Payment Setoff",
    "Expenses",
    "Bank",
    "Return",
    "Reports",
  ].map((perm, index) => {
    const checkboxId = `perm-${index}`;
    return (
      <div key={perm} className="checkbox-itemad">
        <label htmlFor={checkboxId} className="checkbox-labelad">
          {perm}
        </label>
        <input
          id={checkboxId}
          type="checkbox"
          checked={!!form.permissions[perm]}
          onChange={() => handlePermissionChange(perm)}
        />
      </div>
    );
  })}
</div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="button-groupad">
          <button className="btnad btn-newad" onClick={handleNew}>New</button>
          {isAdding && (
            <>
              <button className="btnad btn-addad" onClick={handleAdd}>Add</button>
              {selectedRow && (
                <>
                  <button className="btnad btn-editad" onClick={handleEdit}>Edit</button>
                  <button className="btnad btn-deletead" onClick={handleDelete}>Delete</button>
                </>
              )}
              <button className="btnad btn-clearad" onClick={handleNew}>Clear</button>
            </>
          )}
          <button className="btnad btn-exitad" onClick={() => window.close?.()}>Exit</button>
        </div>

        {/* Grid */}
        <table className="data-gridad">
          <thead>
            <tr>
              <th>Emp No</th>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Position</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr key={row.id} onClick={() => handleRowClick(row)}>
                <td>{row.employeeNo}</td>
                <td>{row.idNo}</td>
                <td>{row.firstName}</td>
                <td>{row.lastName}</td>
                <td>{row.position}</td>
                <td>{Object.keys(row.permissions).filter((p) => row.permissions[p]).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {gridData.length > 0 && <button className="btnad btn-savead">Save</button>}

        {/* Bottom Buttons */}
        <div className="button-groupad">
          <button className="btnad btn-printad">Print</button>
          <button className="btnad btn-viewad">View</button>
          <button className="btnad btn-billbookad" onClick={() => setShowBillBook(true)}>Bill Book Issue</button>
        </div>

        {/* Bill Book Modal */}
        {showBillBook && (
          <div className="billbook-modalad">
            <div className="billbook-contentad">
              <h3>Bill Book Issue</h3>
              <input placeholder="Employee No" name="empNo" value={billBook.empNo} onChange={(e)=>setBillBook({...billBook,empNo:e.target.value})} />
              <input placeholder="Previous Bill Book" name="prevBook" value={billBook.prevBook} onChange={(e)=>setBillBook({...billBook,prevBook:e.target.value})} />
              <input type="date" placeholder="Issue Date" name="issueDate" value={billBook.issueDate} onChange={(e)=>setBillBook({...billBook,issueDate:e.target.value})} />
              <input type="date" placeholder="Return Date" name="returnDate" value={billBook.returnDate} onChange={(e)=>setBillBook({...billBook,returnDate:e.target.value})} />
              <input placeholder="New Book No" name="newBookNo" value={billBook.newBookNo} onChange={(e)=>setBillBook({...billBook,newBookNo:e.target.value})} />
              <input type="date" placeholder="New Issue Date" name="newIssueDate" value={billBook.newIssueDate} onChange={(e)=>setBillBook({...billBook,newIssueDate:e.target.value})} />

              <div className="billbook-buttonsad">
                <button className="btnad btn-savead">Save</button>
                <button className="btnad btn-clearad" onClick={()=>setBillBook({empNo:"",prevBook:"",issueDate:"",returnDate:"",newBookNo:"",newIssueDate:""})}>Clear</button>
                <button className="btnad btn-exitad" onClick={()=>setShowBillBook(false)}>Exit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
