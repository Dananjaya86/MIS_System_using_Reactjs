import React, { useState } from "react";
import Menu from "../componants/Menu";
import "./productdetails.css";

export default function ProductDetails() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    code: "",
    productName: "",
    units: "Nos",
    supplierCode: "",
    supplierName: "",
    availableQty: "",
    unitCost: "",
    addQty: "",
    retailPrice: "",
    wholesalePrice: ""
  });
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // view | new | edit

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // New button
  const handleNew = () => {
    setForm({
      code: "",
      productName: "",
      units: "Nos",
      supplierCode: "",
      supplierName: "",
      availableQty: "",
      unitCost: "",
      addQty: "",
      retailPrice: "",
      wholesalePrice: ""
    });
    setSelectedId(null);
    setMode("new");
  };

  // Save button
  const handleSave = () => {
    if (!form.code || !form.productName) {
      alert("Code and Product Name are required!");
      return;
    }

    if (selectedId !== null) {
      // Modify existing
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedId ? { ...form, id: selectedId } : p))
      );
      alert("Product modified successfully!");
    } else {
      // Add new
      const newProduct = { ...form, id: products.length + 1 };
      setProducts([...products, newProduct]);
      alert("Product saved successfully!");
    }
    handleNew();
    setMode("view");
  };

  // Delete button
  const handleDelete = () => {
    if (selectedId !== null) {
      setProducts((prev) => prev.filter((p) => p.id !== selectedId));
      alert("Product deleted!");
      handleNew();
      setMode("view");
    }
  };

  // Exit button
  const handleExit = () => {
    handleNew();
    setMode("view");
    setSelectedId(null);
  };

  // Click row
  const handleRowClick = (product) => {
    setForm(product);
    setSelectedId(product.id);
    setMode("edit");
  };

  return (
    <div className="container">
      <Menu />

      <div className="right-content">
        <h2>Product Details</h2>

        <div className="form-section">
          <div className="form-left">
            <label>Code:</label>
            <input name="code" value={form.code} onChange={handleChange} />

            <label>Product Name:</label>
            <input name="productName" value={form.productName} onChange={handleChange} />

            <label>Units:</label>
            <select name="units" value={form.units} onChange={handleChange}>
              <option value="Nos">Nos</option>
              <option value="Kg">Kg</option>
              <option value="L">L</option>
            </select>

            <label>Supplier Code:</label>
            <input name="supplierCode" value={form.supplierCode} onChange={handleChange} />

            <label>Supplier Name:</label>
            <input name="supplierName" value={form.supplierName} onChange={handleChange} />
          </div>

          <div className="form-right">
            <label>Available Qty:</label>
            <input name="availableQty" value={form.availableQty} onChange={handleChange} />

            <label>Unit Cost:</label>
            <input name="unitCost" value={form.unitCost} onChange={handleChange} />

            <label>Add Qty:</label>
            <input name="addQty" value={form.addQty} onChange={handleChange} />

            <label>Retail Price:</label>
            <input name="retailPrice" value={form.retailPrice} onChange={handleChange} />

            <label>Wholesale Price:</label>
            <input name="wholesalePrice" value={form.wholesalePrice} onChange={handleChange} />
          </div>
        </div>

        <div className="button-section">
          {mode === "view" && <button onClick={handleNew}>New</button>}
          {(mode === "new" || mode === "edit") && (
            <>
              <button onClick={handleSave}>Save</button>
              {mode === "edit" && <button onClick={handleDelete}>Delete</button>}
              <button onClick={handleExit}>Exit</button>
            </>
          )}
        </div>

        <table className="product-grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Product Name</th>
              <th>Units</th>
              <th>Supplier Code</th>
              <th>Supplier Name</th>
              <th>Available Qty</th>
              <th>Unit Cost</th>
              <th>Add Qty</th>
              <th>Retail Price</th>
              <th>Wholesale Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} onClick={() => handleRowClick(p)}>
                <td>{p.id}</td>
                <td>{p.code}</td>
                <td>{p.productName}</td>
                <td>{p.units}</td>
                <td>{p.supplierCode}</td>
                <td>{p.supplierName}</td>
                <td>{p.availableQty}</td>
                <td>{p.unitCost}</td>
                <td>{p.addQty}</td>
                <td>{p.retailPrice}</td>
                <td>{p.wholesalePrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
