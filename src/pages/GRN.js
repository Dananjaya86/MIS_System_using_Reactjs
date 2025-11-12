import React, { useEffect, useState } from "react";
import Menu from "../componants/Menu";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBox from "../componants/Alertboxre";
import "./grn.css";

export default function GRN() {
  const defaultForm = {
    grnNo: "",
    supplierCode: "",
    supplierName: "",
    invoiceNo: "",
    date: "",
    productCode: "",
    productName: "",
    invoiceQty: "",
    unitPrice: "",
    totalAmount: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("view");
  const [alert, setAlert] = useState({ show: false, type: "info", title: "", message: "" });

  
  const [supplierDialog, setSupplierDialog] = useState({ show: false, list: [], search: "" });
  const [productDialog, setProductDialog] = useState({ show: false, list: [], search: "" });

 
  const fetchNextGrnNumber = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grn/new-number");
      if (!res.ok) throw new Error("Failed to get GRN number");
      const data = await res.json();
      setForm(prev => ({ ...prev, grnNo: data.grn_no }));
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: "error", title: "Error", message: "Unable to generate GRN number" });
    }
  };

  
  const searchSuppliers = async (query) => {
    try {
      const res = await fetch(`http://localhost:5000/api/grn/suppliers?query=${query}`);
      if (!res.ok) throw new Error("Supplier search failed");
      const data = await res.json();
      setSupplierDialog(prev => ({ ...prev, list: data, show: true }));
    } catch (err) {
      console.error(err);
    }
  };

  
  const searchProducts = async (query) => {
    try {
      const res = await fetch(`http://localhost:5000/api/grn/products?query=${query}`);
      if (!res.ok) throw new Error("Product search failed");
      const data = await res.json();
      setProductDialog(prev => ({ ...prev, list: data, show: true }));
    } catch (err) {
      console.error(err);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    
    if (name === "supplierCode" || name === "supplierName") searchSuppliers(value);
    if (name === "productCode" || name === "productName") searchProducts(value);
  };

  
  const selectSupplier = (sup) => {
    setForm(prev => ({ ...prev, supplierCode: sup.sup_code, supplierName: sup.sup_name }));
    setSupplierDialog({ show: false, list: [], search: "" });
  };

  
  const selectProduct = (prod) => {
    setForm(prev => ({ ...prev, productCode: prod.product_code, productName: prod.product_name }));
    setProductDialog({ show: false, list: [], search: "" });
  };

  
  const handleAdd = () => {
    setMode("add");
    setForm(defaultForm);
    fetchNextGrnNumber();
  };

  
  const handleSave = async () => {
    const newRow = { ...form, id: rows.length + 1 };
    setRows([...rows, newRow]);

    try {
      const res = await fetch("http://localhost:5000/api/grn/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grn_no: form.grnNo,
          supplier_code: form.supplierCode,
          supplier_name: form.supplierName,
          supplier_invoice_number: form.invoiceNo,
          supplier_invoice_date: form.date,
          product_code: form.productCode,
          product_name: form.productName,
          invoice_qty: form.invoiceQty,
          total_amount: form.totalAmount,
          login_user: "Admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAlert({ show: true, type: "success", title: "Saved", message: "GRN saved successfully!" });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setAlert({ show: true, type: "error", title: "Error", message: "Failed to save GRN" });
    }

    setMode("view");
    setForm(defaultForm);
  };

  
  useEffect(() => {
    const qty = parseFloat(form.invoiceQty) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    setForm(prev => ({ ...prev, totalAmount: (qty * price).toFixed(2) }));
  }, [form.invoiceQty, form.unitPrice]);

  return (
    <div className="layout">
      <div className="menu-wrap"><Menu /></div>
      <div className="page">
        <Namewithdateacc />
        <h2 className="header">Goods Receive Note</h2>

        <div className="form-container">
          <div className="form-left">
            <label>GRN Number</label>
            <input name="grnNo" value={form.grnNo} readOnly />

            <label>Supplier Code</label>
            <input name="supplierCode" value={form.supplierCode} onChange={handleChange} />
            <label>Supplier Name</label>
            <input name="supplierName" value={form.supplierName} readOnly />

            <label>Invoice No</label>
            <input name="invoiceNo" value={form.invoiceNo} onChange={handleChange} />
            <label>Invoice Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} />
          </div>

          <div className="form-right">
            <label>Product Code</label>
            <input name="productCode" value={form.productCode} onChange={handleChange} />
            <label>Product Name</label>
            <input name="productName" value={form.productName} readOnly />

            <label>Invoice Qty</label>
            <input name="invoiceQty" value={form.invoiceQty} onChange={handleChange} />
            <label>Unit Price</label>
            <input name="unitPrice" value={form.unitPrice} onChange={handleChange} />
            <label>Total Amount</label>
            <input name="totalAmount" value={form.totalAmount} readOnly />
          </div>
        </div>

        <div className="button-bar">
          {mode === "view" && (
            <>
              <button className="btngrnnew" onClick={handleAdd}>New</button>
              <button className="btngrnexit" onClick={() => setAlert({ show: true, type: "info", title: "Exit", message: "Exiting GRN page..." })}>Exit</button>
            </>
          )}
          {mode === "add" && (
            <>
              <button className="btngrnsave" onClick={handleSave}>Save</button>
              <button className="btngrnclear" onClick={() => setForm(defaultForm)}>Clear</button>
              <button className="btngrnexit" onClick={() => setAlert({ show: true, type: "info", title: "Exit", message: "Exiting GRN page..." })}>Exit</button>
            </>
          )}
        </div>

        
        {supplierDialog.show && (
          <div className="dialog">
            <h4>Select Supplier</h4>
            <ul>
              {supplierDialog.list.map((sup, i) => (
                <li key={i} onClick={() => selectSupplier(sup)}>{sup.sup_code} - {sup.sup_name}</li>
              ))}
            </ul>
            <button onClick={() => setSupplierDialog({ show: false, list: [], search: "" })}>Close</button>
          </div>
        )}

        
        {productDialog.show && (
          <div className="dialog">
            <h3>Select Product</h3>
            <ul>
              {productDialog.list.map((prod, i) => (
                <li key={i} onClick={() => selectProduct(prod)}>
                  {prod.product_code} - {prod.product_name}
                </li>
              ))}
            </ul>
          </div>
        )}

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
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.id}</td>
                <td>{row.grnNo}</td>
                <td>{row.supplierName}</td>
                <td>{row.invoiceNo}</td>
                <td>{row.productName}</td>
                <td>{row.invoiceQty}</td>
                <td>{row.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <AlertBox show={alert.show} type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert({ ...alert, show: false })} />
      </div>
    </div>
  );
}
