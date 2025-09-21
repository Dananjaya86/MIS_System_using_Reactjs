import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import "./goodsdispatchnote.css";




export default function GoodsDispatchNote() {
  const [form, setForm] = useState({
    dispatchNo: "",
    productCode: "",
    productName: "",
    qty: "",
    unitPrice: "",
    totalAmount: "",
    date: new Date().toISOString().slice(0, 10),
    salesRep: "",
    availableStock: "",
    route: "",
  });

  const [errors, setErrors] = useState({});
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("initial");
  const [selected, setSelected] = useState(new Set());
  const [editingIndex, setEditingIndex] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const q = parseFloat(form.qty);
    const p = parseFloat(form.unitPrice);
    if (!isNaN(q) && !isNaN(p)) {
      setForm((f) => ({ ...f, totalAmount: (q * p).toFixed(2) }));
    } else {
      setForm((f) => ({ ...f, totalAmount: "" }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.qty, form.unitPrice]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    // clear error on change from google
    setErrors((err) => ({ ...err, [name]: "" })); 
  }

  function validateForm() {
    const newErrors = {};
    if (!form.productCode.trim()) newErrors.productCode = "Product Code is required";
    if (!form.productName.trim()) newErrors.productName = "Product Name is required";
    if (!form.qty || form.qty <= 0) newErrors.qty = "Qty must be greater than 0";
    if (!form.unitPrice || form.unitPrice <= 0) newErrors.unitPrice = "Unit Price must be greater than 0";
    if (!form.salesRep.trim()) newErrors.salesRep = "Sales Representative is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNew() {
    setMode("new");
    setSelected(new Set());
    setEditingIndex(null);
    
  }

  function handleClearForm() {
    setForm({
      dispatchNo: "",
      productCode: "",
      productName: "",
      qty: "",
      unitPrice: "",
      totalAmount: "",
      date: new Date().toISOString().slice(0, 10),
      salesRep: "",
      availableStock: "",
      route: "",
    });
    setErrors({});
    setEditingIndex(null);
    setSelected(new Set());
    if (rows.length === 0) setMode("new");
  }

  function handleAddToGrid() {
    if (!validateForm()) return;

    const entry = {
      id: Date.now().toString(),
      ...form,
      qty: Number(form.qty),
      unitPrice: Number(form.unitPrice),
      totalAmount: Number(form.totalAmount),
    };

    if (editingIndex !== null) {
      setRows((prev) => {
        const copy = [...prev];
        copy[editingIndex] = entry;
        return copy;
      });
      setEditingIndex(null);
    } else {
      setRows((prev) => [...prev, entry]);
    }

    setMode("afterAdd");
    handleClearForm();
  }

  function handleSaveAll() {
    if (rows.length === 0) {
      alert("No items to save.");
      return;
    }
    alert(`Saved dispatch ${rows[0].dispatchNo} with ${rows.length} item(s).`);
    setRows([]);
    setMode("initial");
    handleClearForm();
  }

  function toggleSelectRow(id, index) {
    const copy = new Set(selected);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setSelected(copy);

    if (copy.size === 1) {
      const selectedId = Array.from(copy)[0];
      const idx = rows.findIndex((r) => r.id === selectedId);
      if (idx >= 0) {
        const r = rows[idx];
        setForm({ ...r });
        setEditingIndex(idx);
        setMode("rowSelected");
      }
    } else {
      setEditingIndex(null);
      if (copy.size > 0) setMode("rowSelected");
      else setMode(rows.length ? "afterAdd" : "new");
    }
  }

  function handleEdit() {
    if (selected.size !== 1) return;
    setMode("new");
  }

  function handleDelete() {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected row(s)?`)) return;
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    setMode(rows.length > 1 ? "afterAdd" : "new");
    handleClearForm();
  }

  



  return (


    <div className="gdn-containergdn">
      <aside className="gdn-sidebargdn">
        <Menu />
      </aside>

      <main className="gdn-main">
        <h1 className="gdn-title">Goods Dispatch Note</h1>



        {/* Form Section */}
        <section className="gdn-form-grid">
          <div className="gdn-col">

            <label>Dispatch No</label>
            <input name="dispatchNo" value={form.dispatchNo} onChange={handleChange} className={errors.productCode ? "input-error" : "" }/>
            {errors.productCode && <span className="error">{errors.productCode}</span>}

            <label>Product Code</label>
            <input name="productCode" value={form.productCode} onChange={handleChange} className={errors.productCode ? "input-error" : ""}/>
            {errors.productCode && <span className="error">{errors.productCode}</span>}

            <label>Product Name</label> 
            <input name="productName" value={form.productName} onChange={handleChange} className={errors.productName ? "input-error" : ""}/>
            {errors.productName && <span className="error">{errors.productName}</span>}

            <label>Qty</label>
            <input
              name="qty"
              value={form.qty}
              onChange={handleChange}
              type="number"
              className={errors.qty ? "input-error" : ""}
            />
            {errors.qty && <span className="error">{errors.qty}</span>}

<div className="gdn-col">
            <label>Available Stock</label>
            <input name="availableStock" value={form.availableStock} onChange={handleChange} />
            
          </div>


          </div>

          <div className="gdn-col">
            <label>Unit Price</label>
            <input
              name="unitPrice"
              value={form.unitPrice}
              onChange={handleChange}
              type="number"
              step="0.01"
              className={errors.unitPrice ? "input-error" : ""}
            />
            {errors.unitPrice && <span className="error">{errors.unitPrice}</span>}

            <label>Total Amount</label>
            <input name="totalAmount" value={form.totalAmount} readOnly />

            <label>Date</label>
            <input name="date" value={form.date} onChange={handleChange} type="date" />

            <label>Sales Representative</label>
            <input
              name="salesRep"
              value={form.salesRep}
              onChange={handleChange}
              className={errors.salesRep ? "input-error" : ""}
            />
            {errors.salesRep && <span className="error">{errors.salesRep}</span>}
            <label>Route</label>
            <input name="route" value={form.route} onChange={handleChange} />
          </div>

          
        </section>


        {/* Buttons Section */}
        <section className="gdn-top-buttons">
          {mode === "initial" && (
            <>
              <button className="btn primary" onClick={handleNew}>
                New
              </button>
              <button className="btn" onClick={() => window.close?.() || alert("Exit clicked")}>
                Exit
              </button>
            </>
          )}
          {mode === "new" && (
            <>
              <button className="btn primary" onClick={handleAddToGrid}>
                Add
              </button>
              <button className="btn" onClick={handleClearForm}>
                Clear
              </button>
              <button className="btn" onClick={() => setMode("initial")}>
                Exit
              </button>
            </>
          )}
          {mode === "afterAdd" && (
            <>
              <button className="btn success" onClick={handleSaveAll}>
                Save
              </button>
              <button className="btn primary" onClick={() => setMode("new")}>
                Add
              </button>
              <button className="btn" onClick={handleClearForm}>
                Clear
              </button>
              <button className="btn" onClick={() => setMode("initial")}>
                Exit
              </button>
            </>
          )}
          {mode === "rowSelected" && (
            <>
              <button className="btn" onClick={handleEdit} disabled={selected.size !== 1}>
                Edit
              </button>
              <button className="btn danger" onClick={handleDelete}>
                Delete
              </button>
              <button className="btn" onClick={handleClearForm}>
                Clear
              </button>
              <button className="btn" onClick={() => setMode("initial")}>
                Exit
              </button>
            </>
          )}
        </section>



        {/* Data Grid */}
        <section className="gdn-grid-section">
          <table className="gdn-table">
            <thead>
              <tr>
                <th></th>
                <th>Dispatch No</th>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Date</th>
                <th>Sales Rep</th>
                <th>Available Stock</th>
                <th>Route</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No items added
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={selected.has(r.id) ? "selected-row" : ""}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelectRow(r.id)}
                    />
                  </td>
                  <td>{r.dispatchNo}</td>
                  <td>{r.productCode}</td>
                  <td>{r.productName}</td>
                  <td>{r.qty}</td>
                  <td>{r.unitPrice.toFixed(2)}</td>
                  <td>{r.totalAmount.toFixed(2)}</td>
                  <td>{r.date}</td>
                  <td>{r.salesRep}</td>
                  <td>{r.availableStock}</td>
                  <td>{r.route}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="gdn-grid-actions">
            <button className="btn" >
              Print
            </button>
            <button className="btn" onClick={() => setPreviewOpen(true)}>
              View
            </button>
          </div>
        </section>

        
        
      </main>
    </div>
  );
}
