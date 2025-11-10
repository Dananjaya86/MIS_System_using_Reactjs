import React, { useEffect, useState, useRef } from "react";
import "./production.css";
import Menu from "../componants/Menu";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBoxRe from "../componants/Alertboxre";

const API = "http://localhost:5000/api/production";

export default function Production() {
  // UI state
  const [finishGoods, setFinishGoods] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [batchNo, setBatchNo] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // raw material suggestion state
  const [rawSearch, setRawSearch] = useState("");
  const [rawSuggestions, setRawSuggestions] = useState([]);
  const [allRawCache, setAllRawCache] = useState([]);
  const [suggestIndex, setSuggestIndex] = useState(-1);
  const suggestionsRef = useRef(null);

  // details grid
  const [rawMaterials, setRawMaterials] = useState([]);
  const [buyQty, setBuyQty] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [productionQty, setProductionQty] = useState("");
  const [unitCost, setUnitCost] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // alerts
  const [alert, setAlert] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadFinishGoods();
    loadRawMaterialsCache();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const nameOrCode =
        selectedProduct.product_name ||
        selectedProduct.product_code ||
        selectedProduct;
      generateBatch(nameOrCode);
      setRawMaterials([]);
      setTotalCost(0);
      setProductionQty("");
      setUnitCost(0);
    } else {
      setBatchNo("");
    }
  }, [selectedProduct]);

  async function loadFinishGoods() {
    try {
      const res = await fetch(`${API}/finish-goods`);
      const data = await res.json();
      setFinishGoods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      openAlert("error", "Load failed", "Unable to load finish goods.");
      setFinishGoods([]);
    }
  }

  async function loadRawMaterialsCache() {
    try {
      const res = await fetch(`${API}/raw-materials`);
      const data = await res.json();
      setAllRawCache(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      openAlert("error", "Load failed", "Unable to load raw materials.");
      setAllRawCache([]);
    }
  }

  async function generateBatch(productName) {
    try {
      if (!productName) {
        setBatchNo("");
        return;
      }
      const res = await fetch(
        `${API}/generate-batch?productName=${encodeURIComponent(productName)}`
      );
      const data = await res.json();
      if (data && data.batchNo) setBatchNo(data.batchNo);
    } catch (err) {
      console.error(err);
      openAlert("error", "Batch error", "Failed to generate batch number.");
    }
  }

  useEffect(() => {
    if (!rawSearch) {
      setRawSuggestions([]);
      setSuggestIndex(-1);
      return;
    }
    const q = rawSearch.toLowerCase();
    const filtered = (allRawCache || []).filter(
      (r) =>
        (r.product_name || "").toLowerCase().includes(q) ||
        (r.product_code || "").toLowerCase().includes(q)
    );
    setRawSuggestions(filtered.slice(0, 10));
    setSuggestIndex(-1);
  }, [rawSearch, allRawCache]);

  function openAlert(type, title, message) {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((a) => ({ ...a, show: false })), 3000);
  }

  const onRawKeyDown = (e) => {
    if (rawSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestIndex((i) => Math.min(i + 1, rawSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestIndex >= 0 && rawSuggestions[suggestIndex]) {
        selectSuggestion(rawSuggestions[suggestIndex]);
      } else if (rawSuggestions[0]) {
        selectSuggestion(rawSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setRawSuggestions([]);
      setSuggestIndex(-1);
    }
  };

  function selectSuggestion(item) {
    setRawSearch(item.product_name);
    setRawSuggestions([]);
    setSuggestIndex(-1);
  }

  function recalcTotal(rows) {
    const sum = rows.reduce((s, r) => s + Number(r.cost || 0), 0);
    setTotalCost(Number(sum.toFixed(2)));
  }

  function addRawToGrid() {
    if (!selectedProduct)
      return openAlert("warning", "Select product", "Please choose a finished product.");
    if (!rawSearch)
      return openAlert("warning", "Select raw", "Please type and select a raw material.");

    const item = allRawCache.find(
      (r) => r.product_name === rawSearch || r.product_code === rawSearch
    );
    if (!item)
      return openAlert("warning", "Invalid raw", "Select a raw material from suggestions.");

    const qty = Number(buyQty);
    if (!qty || qty <= 0)
      return openAlert("warning", "Invalid qty", "Enter a positive quantity.");

    const price = Number(item.unit_price) || 0;
    const cost = Number((price * qty).toFixed(2));

    const newRow = {
      product: selectedProduct.product_name || selectedProduct.product_code || selectedProduct,
      raw: item.product_name,
      price,
      qty,
      balance: 0,
      cost,
      productionDate,
      expiryDate,
    };

    let updatedRows = [...rawMaterials];

    if (isEditing && editIndex !== null) {
      updatedRows[editIndex] = newRow;
      setIsEditing(false);
      setEditIndex(null);
    } else {
      updatedRows.push(newRow);
    }

    setRawMaterials(updatedRows);
    recalcTotal(updatedRows);

    setRawSearch("");
    setBuyQty("");
  }

  function handleEdit(record, index) {
    if (!record) {
      openAlert("warning", "Error", "No record selected for edit.");
      return;
    }

    setRawSearch(record.raw || "");
    setBuyQty(record.qty || "");
    setIsEditing(true);
    setEditIndex(index);
  }

  function handleRowChange(index, field, value) {
    const updated = [...rawMaterials];
    updated[index][field] = Number(value);
    updated[index].cost = Number(
      (updated[index].qty * updated[index].price).toFixed(2)
    );
    setRawMaterials(updated);
    recalcTotal(updated);
  }

  function removeRow(index) {
    const next = rawMaterials.filter((_, i) => i !== index);
    setRawMaterials(next);
    recalcTotal(next);
  }

  async function handleSave() {
    if (!selectedProduct) return openAlert("warning", "Missing", "Select finished good.");
    if (!batchNo) return openAlert("warning", "Missing", "Batch auto-generate failed.");
    if (!productionDate || !expiryDate)
      return openAlert("warning", "Missing", "Select production date and expiry date.");

    if (rawMaterials.length === 0)
      return openAlert("warning", "Missing", "Add at least one raw material.");

    const productName =
      selectedProduct.product_name || selectedProduct.product_code || selectedProduct;

    const username = localStorage.getItem("username") || "system";

    const payload = {
      batch_no: batchNo,
      production_date: productionDate,
      expiry_date: expiryDate,
      product: productName,
      total_cost: totalCost,
      production_qty: productionQty ? Number(productionQty) : 0,
      unit_cost: unitCost ? Number(unitCost) : 0,
      details: rawMaterials.map((r) => ({
        product: r.product,
        raw: r.raw,
        price: r.price,
        qty: r.qty,
        balance: r.balance,
        cost: r.cost,
      })),
      user_login: username,
    };

    try {
      const res = await fetch(`${API}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        openAlert("error", "Save failed", data.error || "Failed to save");
        return;
      }
      openAlert("success", "Saved", data.message || "Production saved.");
      setSelectedProduct(null);
      setBatchNo("");
      setProductionDate("");
      setExpiryDate("");
      setRawMaterials([]);
      setTotalCost(0);
      setProductionQty("");
      setUnitCost(0);
      setRawSearch("");
      setBuyQty("");
      await loadRawMaterialsCache();
      await generateBatch(productName);
    } catch (err) {
      console.error(err);
      openAlert("error", "Server", "Could not save to server.");
    }
  }

  const getSelectedValue = () => {
    if (!selectedProduct) return "";
    return selectedProduct.product_code || selectedProduct;
  };

  return (
    <div className="main-layout">
      <AlertBoxRe
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />

      <div className="menu-section">
        <Menu />
      </div>

      <div className="content-section">
        <Namewithdateacc />
        <div className="production-container">
          <h2>Production</h2>

          {/* header */}
          <div className="batch-details">
            <div className="form-row">
              <label>Finished Product:</label>
              <select
                value={getSelectedValue()}
                onChange={(e) => {
                  const code = e.target.value;
                  const item = (Array.isArray(finishGoods) ? finishGoods : []).find(
                    (f) => f.product_code === code
                  );
                  if (item) setSelectedProduct(item);
                  else setSelectedProduct(code || null);
                }}
              >
                <option value="">Select Finished Good</option>
                {Array.isArray(finishGoods) &&
                  finishGoods.map((fg) => (
                    <option key={fg.product_code} value={fg.product_code}>
                      {fg.product_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-row">
              <label>Batch No:</label>
              <input type="text" value={batchNo} readOnly placeholder="Auto generated" />
            </div>

            <div className="form-row">
              <label>Production Date:</label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Expiry Date:</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* raw material input */}
          <div className="form-row">
            <label>Raw Material:</label>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                onKeyDown={onRawKeyDown}
                placeholder="Type raw material name"
                autoComplete="off"
              />
              {rawSuggestions.length > 0 && (
                <ul className="suggestion-box" ref={suggestionsRef}>
                  {rawSuggestions.map((s, idx) => (
                    <li
                      key={s.product_code}
                      className={idx === suggestIndex ? "active" : ""}
                      onMouseDown={() => selectSuggestion(s)}
                    >
                      <span>{s.product_name}</span>
                      <span>Rs. {s.unit_price}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label>Qty:</label>
            <input
              type="number"
              min="1"
              value={buyQty}
              onChange={(e) => setBuyQty(e.target.value)}
            />
            <button onClick={addRawToGrid}>{isEditing ? "Update" : "Add"}</button>
          </div>

          {/* grid */}
          {rawMaterials.length > 0 && (
            <>
              <table className="item-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Raw Material</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Prod Date</th>
                    <th>Expiry</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((r, i) => (
                    <tr key={i}>
                      <td>{r.product}</td>
                      <td>{r.raw}</td>
                      <td>{r.price.toFixed(2)}</td>
                      <td>{r.qty}</td>
                      <td>{r.cost}</td>
                      <td>{r.productionDate}</td>
                      <td>{r.expiryDate}</td>
                      <td>
                        <button className="btproedit" onClick={() => handleEdit(r, i)}>
                          Edit
                        </button>
                        <button className="btnprodelete" onClick={() => removeRow(i)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="summary">
                <h3>Total Cost: {totalCost.toFixed(2)}</h3>
                <div className="form-row">
                  <label>Production Qty:</label>
                  <input
                    type="number"
                    value={productionQty}
                    onChange={(e) => setProductionQty(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      const qty = Number(productionQty);
                      if (qty > 0)
                        setUnitCost(Number((totalCost / qty).toFixed(2)));
                      else
                        openAlert(
                          "warning",
                          "Invalid qty",
                          "Enter production qty to calculate unit cost"
                        );
                    }}
                  >
                    Calculate Unit Cost
                  </button>
                </div>
                {unitCost > 0 && (
                  <h3>
                    Unit Cost for{" "}
                    {selectedProduct
                      ? selectedProduct.product_name || selectedProduct
                      : ""}{" "}
                    : <span>{unitCost}</span>
                  </h3>
                )}
              </div>
            </>
          )}

          <div className="button-group">
            <button className="btnprosave" onClick={handleSave}>
              Save
            </button>
            <button
              className="btnproclear"
              onClick={() => {
                setRawMaterials([]);
                setTotalCost(0);
                setProductionQty("");
                setUnitCost(0);
                setRawSearch("");
                setBuyQty("");
                setIsEditing(false);
                setEditIndex(null);
              }}
            >
              Clear
            </button>
          </div>
        </div> 
      </div>
    </div>
  );
}
