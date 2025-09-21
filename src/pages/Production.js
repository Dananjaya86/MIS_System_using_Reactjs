import React, { useState } from "react";
import "./production.css";
import Menu from "../componants/Menu";

export default function Production() {

  /* need to add other product detais */
  const products = {
    watalappan: ["Eggs", "Jaggery", "Vanilla", "Cups", "Cardomum", "Sticker"],
    jelly: ["Jelly", "Sugar", "Gelatine", "Cups", "Sticker", "Milk"],
    caramel: ["Milk", "Sugar", "Caramel Essence", "Cups", "Sticker", "Eggs"],
    biscuits: [
      "Biscuits",
      "Butter",
      "Cream",
      "Cups",
      "Sticker",
      "Milk",
      "Cocoa Powder",
      "Icing Suger",
    ],
  };


  /* need to add other product detais with prices */
  const initialRawMaterialPrices = {
    Eggs: { price: 29, stock: 260 },
    Cardomum: { price: 9, stock: 1500 },
    "Cocoa Powder": { price: 9, stock: 1500 },
    "Icing Suger": { price: 9, stock: 1500 },
    Cups: { price: 8.4, stock: 2500 },
    Sticker: { price: 1.8, stock: 350 },
    Jaggery: { price: 350, stock: 10 },
    Vanilla: { price: 2.1, stock: 30 },
    Jelly: { price: 40, stock: 60 },
    Sugar: { price: 25, stock: 200 },
    Gelatine: { price: 70, stock: 50 },
    Milk: { price: 2.75, stock: 800 },
    "Caramel Essence": { price: 120, stock: 20 },
    Biscuits: { price: 15, stock: 300 },
    Butter: { price: 80, stock: 40 },
    Cream: { price: 90, stock: 60 },
  };

  const [rawMaterialPrices, setRawMaterialPrices] = useState(initialRawMaterialPrices);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedRaw, setSelectedRaw] = useState("");
  const [buyQty, setBuyQty] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [productionQty, setProductionQty] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [editIndex, setEditIndex] = useState(null);

  // Batch + Dates
  const [batchNo, setBatchNo] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const handleAddOrUpdate = () => {
    const qty = Number(buyQty);

    if (!selectedRaw || qty <= 0) {
      alert("Please select a raw material and enter a valid quantity!");
      return;
    }
    if (!productionDate || !expiryDate) {
      alert("Please select Production Date and Expiry Date!");
      return;
    }

    const material = rawMaterialPrices[selectedRaw];
    if (!material) return alert("Invalid raw material selected!");
    if (qty > material.stock) return alert("Not enough stock!");

    const cost = material.price * qty;
    const updatedStock = material.stock - qty;

    setRawMaterialPrices((prev) => ({
      ...prev,
      [selectedRaw]: { ...material, stock: updatedStock },
    }));

    if (editIndex !== null) {
      const updatedMaterials = [...rawMaterials];
      const oldRow = updatedMaterials[editIndex];


      // Return previous qty back to stock
      setRawMaterialPrices((prev) => ({
        ...prev,
        [oldRow.raw]: {
          ...prev[oldRow.raw],
          stock: prev[oldRow.raw].stock + Number(oldRow.qty),
        },
      }));

      updatedMaterials[editIndex] = {
        product: selectedProduct,
        raw: selectedRaw,
        price: material.price,
        qty,
        balance: updatedStock,
        cost,
        productionDate,
        expiryDate,
      };

      const newTotal = updatedMaterials.reduce((sum, row) => sum + row.cost, 0);
      setRawMaterials(updatedMaterials);
      setTotalCost(newTotal);
      setEditIndex(null);
    } else {
      const newRow = {
        product: selectedProduct,
        raw: selectedRaw,
        price: material.price,
        qty,
        balance: updatedStock,
        cost,
        productionDate,
        expiryDate,
      };

      setRawMaterials((prev) => [...prev, newRow]);
      setTotalCost((prev) => prev + cost);
    }

    setSelectedRaw("");
    setBuyQty("");
  };

  const handleEditRow = (index) => {
    const row = rawMaterials[index];
    setSelectedRaw(row.raw);
    setBuyQty(row.qty);
    setProductionDate(row.productionDate);
    setExpiryDate(row.expiryDate);
    setEditIndex(index);
  };

  const handleDeleteRow = (index) => {
    const row = rawMaterials[index];
    setRawMaterialPrices((prev) => ({
      ...prev,
      [row.raw]: { ...prev[row.raw], stock: prev[row.raw].stock + Number(row.qty) },
    }));

    const updatedMaterials = rawMaterials.filter((_, i) => i !== index);
    setRawMaterials(updatedMaterials);

    const newTotal = updatedMaterials.reduce((sum, row) => sum + row.cost, 0);
    setTotalCost(newTotal);
  };

  const calculateUnitCost = () => {
    const qty = Number(productionQty);
    if (qty > 0) {
      setUnitCost(Number((totalCost / qty).toFixed(2)));
    } else {
      alert("Please enter a valid production quantity!");
    }
  };

  const handleClear = () => {
    setSelectedProduct("");
    setSelectedRaw("");
    setBuyQty("");
    setRawMaterials([]);
    setProductionQty("");
    setTotalCost(0);
    setUnitCost(0);
    setBatchNo("");
    setProductionDate("");
    setExpiryDate("");
    setRawMaterialPrices(initialRawMaterialPrices);
    setEditIndex(null);
    alert("Form cleared!");
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit?")) {
      window.location.href = "/";
    }
  };

  return (
    <div className="main-layout">
      <div className="menu-section">
        <Menu />
      </div>

      <div className="content-section">
        <div className="production-container">
          <h2>Production</h2>


          {/* Batch details and need to implement batch number auto generate*/}
          <div className="batch-details">
            <div className="form-row">
              <label>Batch No:</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="Enter batch number"
              />
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

          {/* Product selection */}
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
              {Object.keys(products).map((key) => (
                <option key={key} value={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
              ))}
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
                min="1"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
              />
              <button onClick={handleAddOrUpdate}>
                {editIndex !== null ? "Update" : "Add"}
              </button>
            </div>
          )}

          {rawMaterials.length > 0 && (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Raw Material</th>
                    <th>Price</th>
                    <th>Used Qty</th>
                    <th>Balance</th>
                    <th>Cost</th>
                    <th>Production Date</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
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
                      <td>{row.productionDate}</td>
                      <td>{row.expiryDate}</td>
                      <td>
                        <button className="btproedit" onClick={() => handleEditRow(index)}>Edit</button>
                        <button className="btnprodelete" onClick={() => handleDeleteRow(index)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="summary">
                <h3>Total Cost: {totalCost}</h3>

                <div className="form-row">
                  <label>Production Qty:</label>
                  <input
                    type="number"
                    min="1"
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
            </>
          )}

          <div className="button-group">
            <button className="btnprosave"
              onClick={() =>
                alert(
                  `Production saved successfully!\nBatch: ${batchNo || "-"}\nProduction Date: ${
                    productionDate || "-"
                  }\nExpiry Date: ${expiryDate || "-"}`
                )
              }
            >
              Save
            </button>

            <button className="btnproexit" onClick={handleExit}>Exit</button>
            <button className="btnproclear" onClick={handleClear}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
