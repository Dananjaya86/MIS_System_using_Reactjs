
import React, { useEffect, useState } from "react";
import Menu from "../componants/Menu";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBox from "../componants/Alertboxre"; 
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
    vehicleno: "",
  });

  const [errors, setErrors] = useState({});
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("initial"); 
  const [selected, setSelected] = useState(new Set());
  const [editingIndex, setEditingIndex] = useState(null);

  const allowEditFields = mode === "new" || mode === "afterAdd";

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [prodSearch, setProdSearch] = useState("");

  const [totalDispatchAmount, setTotalDispatchAmount] = useState(0);

  const [dispatchSearchOpen, setDispatchSearchOpen] = useState(false);
const [dispatchSearchField, setDispatchSearchField] = useState(""); 
const [dispatchSearchQuery, setDispatchSearchQuery] = useState("");
const [dispatchSearchResults, setDispatchSearchResults] = useState([]);

const loginUser = localStorage.getItem("username") || "Guest";





const fetchPdf = async (dispatchNo) => {
  const response = await fetch(`/api/dispatch/pdf/${dispatchNo}`);
  if (!response.ok) throw new Error("Failed to load PDF");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};



const handlePrintPdf = (dispatchNo) => {
  window.open(`/api/dispatch/pdf/${dispatchNo}`, "_blank");
};



  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // --- Effects ---
  useEffect(() => {
    const q = parseFloat(form.qty);
    const p = parseFloat(form.unitPrice);
    if (!isNaN(q) && !isNaN(p)) {
      setForm((f) => ({ ...f, totalAmount: (q * p).toFixed(2) }));
    } else {
      setForm((f) => ({ ...f, totalAmount: "" }));
    }
  }, [form.qty, form.unitPrice]);

  useEffect(() => {
    const total = rows.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    setTotalDispatchAmount(total);
  }, [rows]);

  // --- Handlers ---
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  }

  function validateForm() {
    const newErrors = {};
    if (!form.dispatchNo || !form.dispatchNo.trim()) newErrors.dispatchNo = "Dispatch No required";
    if (!form.productCode || !form.productCode.trim()) newErrors.productCode = "Product Code is required";
    if (!form.productName || !form.productName.trim()) newErrors.productName = "Product Name is required";
    if (!form.qty || Number(form.qty) <= 0) newErrors.qty = "Qty must be greater than 0";
    if (!form.unitPrice || Number(form.unitPrice) <= 0) newErrors.unitPrice = "Unit Price must be greater than 0";
    if (!form.salesRep || !form.salesRep.trim()) newErrors.salesRep = "Sales Representative is required";
    if (!form.route || !form.route.trim()) newErrors.route = "Route is required";
    if (!form.vehicleno || !form.vehicleno.trim()) newErrors.vehicleno = "Vehicle no is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function fetchNewDispatchNo() {
    try {
      const res = await fetch("http://localhost:5000/api/dispatch/newno");
      if (!res.ok) throw new Error("Failed to get dispatch number");
      const data = await res.json();
      return data.dispatchNo;
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: "error", title: "Error", message: "Failed to generate dispatch number." });
      return "";
    }
  }


async function loadDispatchSearch(q = "", field = "all") {
  try {
    const url = `http://localhost:5000/api/dispatch/search?q=${encodeURIComponent(q)}&field=${encodeURIComponent(field)}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error("Search failed");
      setDispatchSearchResults([]);
      return;
    }

    const data = await res.json();
    setDispatchSearchResults(data || []);
  } catch (err) {
    console.error("Error loading dispatch search:", err);
    setDispatchSearchResults([]);
  }
}

function openDispatchPdf(dispatchNo) {
  if (!dispatchNo) return; 
  const backendUrl = `${window.location.origin.replace(":3000", ":5000")}/api/dispatch/pdf/${dispatchNo}`;
  window.open(backendUrl, "_blank");
}



  async function handleNew() {
    const newNo = await fetchNewDispatchNo();
    if (!newNo) return;
    setForm((f) => ({ ...f, dispatchNo: newNo }));
    setMode("new");
    setSelected(new Set());
    setEditingIndex(null);
  }

  function handleClearAll() {
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
      vehicleno: "",
    });
    setErrors({});
    setRows([]);
    setSelected(new Set());
    setMode("initial");
    setEditingIndex(null);
  }

  function handleAddToGrid() {
    if (!validateForm()) return;

    const avail = parseFloat(form.availableStock || 0);
    const qtyNum = Number(form.qty);
    if (!isNaN(avail) && qtyNum > avail) {
      setAlert({ show: true, type: "warning", title: "Stock Error", message: `You entered quantity greater than available stock. Available: ${avail}` });
      return;
    }

    const entry = {
      id: Date.now().toString(),
      dispatchNo: form.dispatchNo,
      productCode: form.productCode,
      productName: form.productName,
      qty: qtyNum,
      unitPrice: Number(form.unitPrice),
      totalAmount: Number(form.totalAmount || 0),
      date: form.date,
      salesRep: form.salesRep,
      availableStock: avail,
      route: form.route,
      vehicleno: form.vehicleno,
    };

    if (editingIndex !== null) {
      setRows((prev) => {
        const updated = [...prev];
        updated[editingIndex] = entry;
        return updated;
      });
      setEditingIndex(null);
    } else {
      setRows((prev) => [...prev, entry]);
    }

    setMode("afterAdd");

    setForm((prev) => ({
      ...prev,
      productCode: "",
      productName: "",
      qty: "",
      unitPrice: "",
      totalAmount: "",
      availableStock: "",
    }));

    setErrors({});
    setSelected(new Set());
  }

  // --- Update handleSaveAll ---
function handleSaveAll() {
  if (rows.length === 0) {
    setAlert({
      show: true,
      type: "info",
      title: "Info",
      message: "No items to save.",
    });
    return;
  }

  // Show confirmation alert
  setAlert({
    show: true,
    type: "question",
    title: "Confirm Save",
    message: "Are you sure you want to save all dispatch details?",
    onConfirm: async () => {
      setAlert({ show: false }); 
      await saveData(); 
    },
    onClose: () => setAlert({ show: false }),
  });
}



async function saveData() {
   const username = window.currentUserName || localStorage.getItem("username") || "unknown";

  const payload = {
    dispatchNo: rows[0].dispatchNo,
    user_login: username,
    items: rows.map((r) => ({
      dispatchNo: r.dispatchNo,
      productCode: r.productCode,
      productName: r.productName,
      qty: r.qty,
      availableStock: r.availableStock,
      unitPrice: r.unitPrice,
      totalAmount: r.totalAmount,
      salesRep: r.salesRep,
      route: r.route,
      vehicleno: r.vehicleno,
      date: r.date,
      realDate: new Date().toISOString(),
    })),
  };

  try {
    const res = await fetch("http://localhost:5000/api/dispatch/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      
    });

    const dataText = await res.text();

    if (!res.ok) {
      console.error("Save failed:", dataText);
      throw new Error("Failed to save");
    }

    const data = JSON.parse(dataText);

    setAlert({
      show: true,
      type: "success",
      title: "Success",
      message: data.message || "Saved successfully",
      onConfirm: () => {
        handleClearAll();
        setAlert({ show: false });
      },
    });

    setMode("initial");
    setRows([]);
    setTotalDispatchAmount(0);
  } catch (err) {
    console.error(err);
    setAlert({
      show: true,
      type: "error",
      title: "Error",
      message: "Failed to save dispatch notes.",
    });
  }
}



  function toggleSelectRow(id) {
    const copy = new Set(selected);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setSelected(copy);

    if (copy.size === 1) {
      const selectedId = Array.from(copy)[0];
      const idx = rows.findIndex((r) => r.id === selectedId);
      if (idx >= 0) {
        setForm({ ...rows[idx] });
        setEditingIndex(idx);
        setMode("rowSelected");
      }
    } else {
      setEditingIndex(null);
      setMode(copy.size > 1 ? "rowSelected" : rows.length ? "afterAdd" : "new");
    }
  }

  function handleEdit() {
    if (selected.size !== 1) return;
    setMode("new");
  }

  function handleDelete() {
    if (selected.size === 0) return;
    setAlert({
      show: true,
      type: "question",
      title: "Confirm Delete",
      message: `Delete ${selected.size} selected row(s)?`,
      onConfirm: () => {
        setRows((prev) => prev.filter((r) => !selected.has(r.id)));
        setSelected(new Set());
        setEditingIndex(null);
        setMode(rows.length > 1 ? "afterAdd" : "new");
        setForm((f) => ({
          ...f,
          productCode: "",
          productName: "",
          qty: "",
          unitPrice: "",
          totalAmount: "",
          availableStock: "",
        }));
        setAlert({ show: false });
      },
      onClose: () => setAlert({ show: false }),
    });
  }

  async function loadProducts(q) {
    try {
      const url = `http://localhost:5000/api/dispatch/products${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: "error", title: "Error", message: "Failed to load products" });
    }
  }


function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="dispatch-searchbox">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="dispatch-search-input"
      />
    </div>
  );
}



  function handleProdSearch(e) {
    const q = e.target.value;
    setProdSearch(q);
    loadProducts(q);
  }

  function selectProduct(p) {
    setForm((f) => ({
      ...f,
      productCode: p.product_code,
      productName: p.product_name,
      unitPrice: p.unit_price,
      availableStock: p.available_stock,
      qty: "",
      totalAmount: "",
    }));
    setErrors((e) => ({ ...e, qty: "" }));
    setProductModalOpen(false);
  }

  function openProductModal() {
    setProdSearch("");
    loadProducts("");
    setProductModalOpen(true);
  }

  function handleExit() {
    window.location.href = "/dashboard";
  }

  return (
    <div className="gdn-containergdn">
      <aside className="gdn-sidebargdn"><Menu /></aside>
      <main className="gdn-main">
        <Namewithdateacc />
        <h1 className="gdn-title">Goods Dispatch Note</h1>

        {/* ALERT BOX */}
        <AlertBox
          show={alert.show}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert({ show: false })}
          onConfirm={alert.onConfirm}
        />

        {/* Form */}
        <section className="gdn-form-grid">
          <div className="gdn-col">
            <label>Dispatch No</label>
            <input name="dispatchNo" value={form.dispatchNo} readOnly />

            <label>Product Code</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                name="productCode"
                value={form.productCode}
                readOnly
                placeholder="Select product"
                className={errors.productCode ? "input-error" : ""}
              />
              <button type="button" onClick={openProductModal}>Select</button>
            </div>
            {errors.productCode && <span className="error">{errors.productCode}</span>}

            <label>Product Name</label>
            <input name="productName" value={form.productName} readOnly className={errors.productName ? "input-error" : ""} />
            {errors.productName && <span className="error">{errors.productName}</span>}

            <label>Qty</label>
            <input
              name="qty"
              type="number"
              value={form.qty}
              onChange={handleChange}
              readOnly={!allowEditFields}
              className={errors.qty ? "input-error" : ""}
            />
            {errors.qty && <span className="error">{errors.qty}</span>}

            <label>Available Stock</label>
            <input name="availableStock" value={form.availableStock} readOnly />
          </div>

          <div className="gdn-col">
            <label>Unit Price</label>
            <input
              name="unitPrice"
              type="number"
              step="0.01"
              value={form.unitPrice}
              onChange={handleChange}
              readOnly={!allowEditFields}
              className={errors.unitPrice ? "input-error" : ""}
            />
            {errors.unitPrice && <span className="error">{errors.unitPrice}</span>}

            <label>Total Amount</label>
            <input name="totalAmount" value={form.totalAmount} readOnly />

            <label>Date</label>
            <input name="date" value={form.date} type="date" readOnly />

            <label>Sales Representative</label>
            <input
              name="salesRep"
               value={form.salesRep}
               onChange={handleChange}
               readOnly={!allowEditFields}
               className={errors.salesRep ? "input-error" : ""}
             />
            {errors.salesRep && <span className="error">{errors.salesRep}</span>}

            <label>Route</label>
            <input name="route" value={form.route} onChange={handleChange} readOnly={!allowEditFields} className={errors.route ? "input-error" : ""} />
            {errors.route && <span className="error">{errors.route}</span>}

            <label>Vehicle No</label>
            <input
  name="vehicleno"
  value={form.vehicleno}
  onChange={handleChange}
  readOnly={!allowEditFields}
  className={errors.vehicleno ? "input-error" : ""}
/>
            {errors.vehicleno && <span className="error">{errors.vehicleno}</span>}
          </div>
        </section>



        

        {/* Buttons */}
        <section className="gdn-top-buttons">
          {mode === "initial" && (
            <>
              <button className="btnnewgdn" onClick={handleNew}>New</button>
              <button className="btnexitgdn" onClick={handleExit}>Exit</button>
            </>
          )}

          {mode === "new" && (
            <>
              <button className="btnaddgdn" onClick={handleAddToGrid}>Add</button>
              <button className="btnclear" onClick={handleClearAll}>Clear</button>
              <button className="btnexit" onClick={handleExit}>Exit</button>
            </>
          )}

          {mode === "afterAdd" && (
            <>
              <button className="btnaddgdn" onClick={handleAddToGrid}>Add</button>
              <button className="btnsave" onClick={handleSaveAll} disabled={rows.length === 0}> Save</button>
              <button className="btnclear" onClick={handleClearAll}>Clear</button>
              <button className="btnexit" onClick={handleExit}>Exit</button>
            </>
          )}

          {mode === "rowSelected" && (
            <>
              <button className="btnexitgdn" onClick={handleEdit} disabled={selected.size !== 1}>Edit</button>
              <button className="btndeletegdn" onClick={handleDelete}>Delete</button>
              <button className="btncleargdn" onClick={handleClearAll}>Clear</button>
              <button className="btnexitgdn" onClick={handleExit}>Exit</button>
            </>
          )}
        </section>

        {/* Grid */}
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
                <tr><td colSpan="11" style={{ textAlign: "center" }}>No items added</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className={selected.has(r.id) ? "selected-row" : ""}>
                  <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelectRow(r.id)} /></td>
                  <td>{r.dispatchNo}</td>
                  <td>{r.productCode}</td>
                  <td>{r.productName}</td>
                  <td>{r.qty}</td>
                  <td>{Number(r.unitPrice).toFixed(2)}</td>
                  <td>{Number(r.totalAmount).toFixed(2)}</td>
                  <td>{r.date}</td>
                  <td>{r.salesRep}</td>
                  <td>{r.availableStock}</td>
                  <td>{r.route}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="gdn-total-container">
            <span className="gdn-total-label">Total Dispatch Amount:</span>
            <span className="gdn-total-value">{totalDispatchAmount.toFixed(2)}</span>
          </div>

          <div className="gdn-grid-spacer"></div>
        </section>

        <button className="btnviewgdn" onClick={() => {
  setDispatchSearchField("all");
  setDispatchSearchQuery("");
  setDispatchSearchOpen(true);
  loadDispatchSearch("", "all");
}}>
  View
</button>

{/* ================================
    Dispatch Search Popup
================================ */}
{dispatchSearchOpen && (
  <div className="dispatch-modal-overlay">
    <div className="dispatch-modal">
      <h3>Search Dispatches</h3>

      {/* Search Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
  type="text"
  value={dispatchSearchQuery}
  placeholder="Search sales rep / vehicle..."
  onChange={(e) => {
    setDispatchSearchQuery(e.target.value);
    loadDispatchSearch(e.target.value, "all"); 
  }}
/>


        <select
          value={dispatchSearchField}
          onChange={(e) => {
            setDispatchSearchField(e.target.value);
            loadDispatchSearch(dispatchSearchQuery, e.target.value);
          }}
        >
          <option value="all">All</option>
          <option value="salesrep">Sales Rep</option>
          <option value="vehicleno">Vehicle No</option>
        </select>

        <button onClick={() => setDispatchSearchOpen(false)}>Close</button>
      </div>

      {/* Results Table */}
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        <table className="gdn-table">
          <thead>
            <tr>
              <th>Dispatch No</th>
              <th>Sales Rep</th>
              <th>Vehicle No</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
  {dispatchSearchResults.map((d) => (
    <tr
      key={d.dispatch_no}
      style={{ cursor: "pointer" }}
      onDoubleClick={() => openDispatchPdf(d.dispatch_no)} 
    >
      <td>{d.dispatch_no}</td>
      <td>{d.sales_person}</td>
      <td>{d.vehicle_no}</td>
      <td>{d.real_date}</td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  </div>
)}





        {/* Product modal */}
        {productModalOpen && (
          <div className="product-modal-overlay">
            <div className="product-modal">
              <h3>Select Product</h3>
              <div style={{ marginBottom: 8 }}>
                <input placeholder="Search..." value={prodSearch} onChange={handleProdSearch} />
                <button onClick={() => loadProducts(prodSearch)}>Search</button>
                <button
                  onClick={() => {
                    setProdSearch("");
                    loadProducts("");
                  }}
                >
                  Clear
                </button>
                <button onClick={() => setProductModalOpen(false)}>Close</button>
              </div>

              <div style={{ maxHeight: 300, overflow: "auto" }}>
                <table className="gdn-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Unit Price</th>
                      <th>Available</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="5">No products</td>
                      </tr>
                    )}
                    {products.map((p) => (
                      <tr key={p.product_code}>
                        <td>{p.product_code}</td>
                        <td>{p.product_name}</td>
                        <td>{p.unit_price != null ? Number(p.unit_price).toFixed(2) : "0.00"}</td>
                        <td>{p.available_stock}</td>
                        <td>
                          <button
                            onClick={() => {
                              selectProduct(p);
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        

       

      </main>
    </div>
  );
}
