// Production.js
import React, { useState } from "react";
import "./production.css";
import Menu from "../componants/Menu";

export default function Production() {
  const products = {
    watalappan: ["Eggs", "Jaggery", "Vanilla"],
    jelly: ["Jelly", "Sugar", "Gelatine"],
    caramel: ["Milk", "Sugar", "Caramel Essence"],
    biscuits: ["Biscuits", "Butter", "Cream"],
  };

  const rawMaterialPrices = {
    Eggs: { price: 29, stock: 260 },
    Jaggery: { price: 350, stock: 10 },
    Vanilla: { price: 100, stock: 30 },
    Jelly: { price: 40, stock: 60 },
    Sugar: { price: 25, stock: 200 },
    Gelatine: { price: 70, stock: 50 },
    Milk: { price: 30, stock: 150 },
    "Caramel Essence": { price: 120, stock: 20 },
    Biscuits: { price: 15, stock: 300 },
    Butter: { price: 80, stock: 40 },
    Cream: { price: 90, stock: 60 },
  };

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedRaw, setSelectedRaw] = useState("");
  const [buyQty, setBuyQty] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [productionQty, setProductionQty] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [unitCost, setUnitCost] = useState(0);

  const handleAdd = () => {
    if (!selectedRaw || !buyQty) {
      alert("Please select a raw material and enter quantity!");
      return;
    }

    const material = rawMaterialPrices[selectedRaw];
    const cost = material.price * buyQty;
    const balance = material.stock - buyQty;

    const newRow = {
      product: selectedProduct,
      raw: selectedRaw,
      price: material.price,
      qty: buyQty,
      balance: balance,
      cost: cost,
    };

    setRawMaterials([...rawMaterials, newRow]);
    setTotalCost(totalCost + cost);
    setSelectedRaw("");
    setBuyQty("");
  };

  const calculateUnitCost = () => {
    if (productionQty > 0) {
      setUnitCost((totalCost / productionQty).toFixed(2));
    } else {
      alert("Please enter production quantity!");
    }
  };

  const handleSave = () => {
    alert("Production saved successfully!");
  };

  const handleModify = () => {
    alert("Production modified successfully!");
  };

  const handleDelete = () => {
    alert("Production deleted successfully!");
  };

  const handleClear = () => {
    setSelectedProduct("");
    setSelectedRaw("");
    setBuyQty("");
    setRawMaterials([]);
    setProductionQty("");
    setTotalCost(0);
    setUnitCost(0);
    alert("Form cleared!");
  };

  const handleExit = () => {
    alert("Exiting production page!");
    // If you want to redirect: window.location.href = "/";
  };

  return (
    <div className="main-layout">
      <div className="menu-section">
        <Menu />
      </div>

      <div className="content-section">
        <div className="production-container">
          <h2>Production</h2>

          <div className="form-row">
            <label>Select Product:</label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setRawMaterials([]);
                setTotalCost(0);
                setUnitCost(0);
              }}
            >
              <option value="">Select Item</option>
              <option value="watalappan">Watalappan</option>
              <option value="jelly">Jelly Pudding</option>
              <option value="caramel">Caramel</option>
              <option value="biscuits">Biscuits Pudding</option>
            </select>
          </div>

          {selectedProduct && (
            <div className="form-row">
              <label>Raw Material:</label>
              <select
                value={selectedRaw}
                onChange={(e) => setSelectedRaw(e.target.value)}
              >
                <option value="">Select item</option>
                {products[selectedProduct].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedRaw && (
            <div className="form-row">
              <p>
                Price: <b>{rawMaterialPrices[selectedRaw].price}</b> | Stock:{" "}
                <b>{rawMaterialPrices[selectedRaw].stock}</b>
              </p>
              <label>Buy Qty:</label>
              <input
                type="number"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
              />
              <button onClick={handleAdd}>Add</button>
            </div>
          )}

          {rawMaterials.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Raw Material</th>
                  <th>Price</th>
                  <th>Used Qty</th>
                  <th>Balance</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterials.map((row, index) => (
                  <tr key={index}>
                    <td>{row.product}</td>
                    <td>{row.raw}</td>
                    <td>{row.price}</td>
                    <td>{row.qty}</td>
                    <td>{row.balance}</td>
                    <td>{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {rawMaterials.length > 0 && (
            <div className="summary">
              <h3>Total Cost: {totalCost}</h3>

              <div className="form-row">
                <label>Production Qty:</label>
                <input
                  type="number"
                  value={productionQty}
                  onChange={(e) => setProductionQty(e.target.value)}
                />
                <button onClick={calculateUnitCost}>Calculate Unit Cost</button>
              </div>

              {unitCost > 0 && (
                <h3>
                  Unit Cost for {selectedProduct}: <span>{unitCost}</span>
                </h3>
              )}
            </div>
          )}

          <div className="button-group">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleModify}>Modify</button>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={handleExit}>Exit</button>
            <button onClick={handleClear}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
