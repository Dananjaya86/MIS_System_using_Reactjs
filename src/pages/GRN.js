import React, { useState } from "react";
import Menu from "../componants/Menu"
import "./grn.css";

export default function GRN() {
  const [form, setForm] = useState({
    grnNo: "",
    supplierCode: "",
    supplierName: "",
    invoiceNo: "",
    productCode: "",
    productName: "",
    date: "",
    creditAmount: "",
    balanceAmount: "",
    advancePayment: "",
    availableQty: "",
    invoiceQty: "",
    totalAmount: "",
    totalStock: "",
  });

  const [rows, setRows] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  // view , add , edit need to check again

  const [mode, setMode] = useState("view"); 

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setMode("add");
    setForm({
      grnNo: "",
      supplierCode: "",
      supplierName: "",
      invoiceNo: "",
      productCode: "",
      productName: "",
      date: "",
      creditAmount: "",
      balanceAmount: "",
      advancePayment: "",
      availableQty: "",
      invoiceQty: "",
      totalAmount: "",
      totalStock: "",
    });
  };

  const handleSave = () => {
    if (editIndex !== null) {
      const updated = [...rows];
      updated[editIndex] = form;
      setRows(updated);
      setEditIndex(null);
      alert("Record updated successfully!");
    } else {
      setRows([...rows, { ...form, id: rows.length + 1 }]);
      alert("Record saved successfully!");
    }
    setMode("view");
    setForm({});
  };

  const handleClear = () => {
    setForm({});
    alert("Form cleared!");
  };

  const handleEdit = (index) => {
    setForm(rows[index]);
    setEditIndex(index);
    setMode("edit");
  };

  const handleDelete = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    alert("Record deleted!");
    setMode("view");
  };

  const handleExit = () => {
    alert("Exiting GRN Page...");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleView = () => {
    alert(
      `Company: ABC Foods Ltd.\nAddress: 123 Main Street\nPhone: +94 77 1234567\n\nSupplier: ${form.supplierName || "N/A"}`
    );
  };

  return (
    <div className="layout">
      <div className="menu-wrap">
        <Menu />
      </div>

      <div className="page">
        <h2 className="header">Goods Receive Note</h2>


        {/* Form */}
        <div className="form-container">
          <div className="form-left">
            <label>GRN Number</label>
            <input name="grnNo" value={form.grnNo || ""} onChange={handleChange} />

            <label>Supplier Code</label>
            <input name="supplierCode" value={form.supplierCode || ""} onChange={handleChange} />

            <label>Supplier Name</label>
            <input name="supplierName" value={form.supplierName || ""} onChange={handleChange} />

            <label>Supplier Invoice No</label>
            <input name="invoiceNo" value={form.invoiceNo || ""} onChange={handleChange} />

            <label>Product Code</label>
            <input name="productCode" value={form.productCode || ""} onChange={handleChange} />

            <label>Product Name</label>
            <input name="productName" value={form.productName || ""} onChange={handleChange} />

            <label>Advance Payment</label>
            <input name="advancePayment" value={form.advancePayment || ""} onChange={handleChange} />

          </div>

          <div className="form-right">
            <label>Date</label>
            <input type="date" name="date" value={form.date || ""} onChange={handleChange} />

            <label>Credit Amount</label>
            <input name="creditAmount" value={form.creditAmount || ""} onChange={handleChange} />

            <label>Balance Amount</label>
            <input name="balanceAmount" value={form.balanceAmount || ""} onChange={handleChange} />

            

            <label>Available Qty</label>
            <input name="availableQty" value={form.availableQty || ""} onChange={handleChange} />

            <label>Invoice Qty</label>
            <input name="invoiceQty" value={form.invoiceQty || ""} onChange={handleChange} />

            <label>Total Amount</label>
            <input name="totalAmount" value={form.totalAmount || ""} onChange={handleChange} />

            <label>Total Stock</label>
            <input name="totalStock" value={form.totalStock || ""} onChange={handleChange} />
          </div>
        </div>



        {/* Buttons need to style with  */}
        <div className="button-bar">
          {mode === "view" && (
            <>
              <button className="btngrnnew" onClick={handleAdd}>New</button>
              <button className="btngrnexit" onClick={handleExit}>Exit</button>
            </>
          )}

          {mode === "add" && (
            <>
              <button className="btngrnsave" onClick={handleSave}>Save</button>
              <button className="btngrnclear" onClick={handleClear}>Clear</button>
              <button className="btngrnexit" onClick={handleExit}>Exit</button>
            </>
          )}

          {mode === "edit" && (
            <>
              <button className="btngrnedit" onClick={handleSave}>Modify</button>
              <button className="btngrndelete" onClick={() => handleDelete(editIndex)}>Delete</button>
              <button className="btngrnexit" onClick={handleExit}>Exit</button>
            </>
          )}
        </div>

        {/* Grid */}
        <table className="data-grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>GRN No</th>
              <th>Supplier</th>
              <th>Invoice No</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} onClick={() => handleEdit(i)}>
                <td>{row.id}</td>
                <td>{row.grnNo}</td>
                <td>{row.supplierName}</td>
                <td>{row.invoiceNo}</td>
                <td>{row.productName}</td>
                <td>{row.invoiceQty}</td>
                <td>{row.totalAmount}</td>
                <td>{parseFloat(row.balanceAmount || 0) === 0 ? "Paid" : "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* print and view buttons */}
        <div className="button-bar">
          <button className="btngrnprint" onClick={handlePrint}>Print</button>
          <button className="btngrnview" onClick={handleView}>View</button>
        </div>
      </div>
    </div>
  );
}
