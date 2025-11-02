
import React, { useState, useEffect, useRef } from "react";
import Menu from "../componants/Menu";
import "./productdetails.css";
import Namewithdateacc from "../componants/Namewithdateacc";
import AlertBox from "../componants/Alertboxre";

const apiBase = "http://localhost:5000/api/products";

export default function ProductDetails() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_code: "",
    product_name: "",
    goods_type: "",
    units: "Nos",
    supplier_code: "",
    supplier_name: "",
    available_stock: "",
    unit_cost: "",
    qty: "",
    retail_price: "",
    whole_sale_price: "",
  });
  const [selectedCode, setSelectedCode] = useState(null);
  const [mode, setMode] = useState("view"); 
  const [multipleEntry, setMultipleEntry] = useState(false);

  
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });
  const showAlert = (type, title, message, onConfirm = null, onCancel = null) =>
    setAlertConfig({ show: true, type, title, message, onConfirm, onCancel });
  const closeAlert = () => setAlertConfig((p) => ({ ...p, show: false }));

  
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierDebounceRef = useRef(null);

  
  const getLoginUser = () => localStorage.getItem("username") || "Guest";
  const getRealDate = () => new Date().toISOString();

  
  const filteredProducts = products.filter(
    (p) =>
      (p.product_name || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (p.product_code || "").toLowerCase().includes(searchText.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  
  useEffect(() => {
    fetchProducts();
    const login_user = getLoginUser();
    fetch(`${apiBase}/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_user, real_date: getRealDate() }),
    }).catch((err) => console.warn("visit log failed:", err));
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  }

  
  const handleChange = async (e) => {
    const { name, value } = e.target;

    
    if (name === "supplier_name" || name === "supplier_code") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (supplierDebounceRef.current) clearTimeout(supplierDebounceRef.current);
      if (value && value.length >= 2) {
        supplierDebounceRef.current = setTimeout(() => {
          fetchSupplierOptions(value);
        }, 350);
      } else {
        setSupplierOptions([]);
        setShowSupplierDropdown(false);
      }
      return;
    }

   
    if (name === "goods_type") {
      setForm((prev) => ({ ...prev, goods_type: value }));
      try {
        const type = value === "Raw Material" ? "RM" : "FG";
        const res = await fetch(`${apiBase}/code/${type}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        if (data.nextCode) setForm((prev) => ({ ...prev, product_code: data.nextCode }));
      } catch (err) {
        console.error("Get next code error:", err);
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function fetchSupplierOptions(q) {
    try {
      const res = await fetch(`${apiBase}/suppliers/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setSupplierOptions(data.data || []);
        setShowSupplierDropdown(true);
      } else {
        setSupplierOptions([]);
        setShowSupplierDropdown(false);
      }
    } catch (err) {
      console.error("Supplier search error:", err);
      setShowSupplierDropdown(false);
    }
  }

  function selectSupplier(option) {
    setForm((prev) => ({ ...prev, supplier_code: option.sup_code, supplier_name: option.sup_name }));
    setShowSupplierDropdown(false);
  }

  function startNewForm() {
    setForm({
      product_code: "",
      product_name: "",
      goods_type: "",
      units: "Nos",
      supplier_code: "",
      supplier_name: "",
      available_stock: "",
      unit_cost: "",
      qty: "",
      retail_price: "",
      whole_sale_price: "",
    });
    setSelectedCode(null);
    setMode("new");
  }

  const handleNew = () =>
    showAlert(
      "question",
      "Multiple Entry",
      "Do you want to enter multiple products?",
      () => { setMultipleEntry(true); startNewForm(); closeAlert(); },
      () => { setMultipleEntry(false); startNewForm(); closeAlert(); }
    );

  
  const handleSaveConfirmed = async () => {
    try {
      const url = `${apiBase}/save`;
      const login_user = getLoginUser();
      const payload = { ...form, login_user, real_date: getRealDate() };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        showAlert("success", "Saved", data.message || "Product saved");
        fetchProducts();
        multipleEntry ? startNewForm() : handleExit();
      } else showAlert("error", "Error", data.message || "Save failed");
    } catch (err) {
      console.error("Save error:", err);
      showAlert("error", "Error", "Server connection failed!");
    }
  };

  const handleSave = () => {
    if (!form.product_name || !form.goods_type)
      return showAlert("warning", "Missing Fields", "Select goods type and enter product name!");
    showAlert("question", "Confirm Save", "Do you want to save this product?", handleSaveConfirmed);
  };

  
  const handleUpdateConfirmed = async () => {
    try {
      const url = `${apiBase}/update`;
      const login_user = getLoginUser();
      const payload = { ...form, login_user, real_date: getRealDate() };

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        showAlert("success", "Updated", data.message || "Product updated");
        fetchProducts();
        handleExit();
      } else showAlert("error", "Error", data.message || "Update failed");
    } catch (err) {
      console.error("Update error:", err);
      showAlert("error", "Error", "Server connection failed!");
    }
  };

  const handleUpdate = () => {
    if (!selectedCode)
      return showAlert("warning", "No selection", "Select a product to update.");
    showAlert("question", "Confirm Update", "Do you want to update this product?", handleUpdateConfirmed);
  };

  
  const handleDeleteConfirmed = async () => {
    try {
      const url = `${apiBase}/delete`;
      const login_user = getLoginUser();
      const payload = { code: selectedCode, login_user, real_date: getRealDate() };
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        showAlert("success", "Deleted", data.message || "Product deleted");
        fetchProducts();
        handleExit();
      } else showAlert("error", "Error", data.message || "Delete failed");
    } catch (err) {
      console.error("Delete error:", err);
      showAlert("error", "Error", "Server connection failed!");
    }
  };

  const handleDelete = () => {
    if (!selectedCode)
      return showAlert("warning", "No selection", "Select a product to delete.");
    showAlert("question", "Confirm Delete", "Do you want to delete this product?", handleDeleteConfirmed);
  };

  
  const handleExit = () => {
    startNewForm();
    setMode("view");
    setMultipleEntry(false);
  };

  
  function handleRowClick(p) {
    setForm({
      product_code: p.product_code,
      product_name: p.product_name,
      goods_type: p.goods_type,
      units: p.units || "Nos",
      supplier_code: p.supplier_code || "",
      supplier_name: p.supplier_name || "",
      available_stock: p.available_stock || "",
      unit_cost: p.unit_cost || "",
      qty: p.qty || "",
      retail_price: p.retail_price || "",
      whole_sale_price: p.whole_sale_price || "",
    });
    setSelectedCode(p.product_code);
    setMode("edit");
    setShowSupplierDropdown(false);
  }

 
  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  
  const handleSupplierKey = (e) => {
    if (e.key === "Escape") setShowSupplierDropdown(false);
  };

  // Render
  return (
    <div className="containerpr">
      <Menu />
      <div className="right-contentpr">
        <Namewithdateacc />
        <h2>Product Details</h2>

        <AlertBox
          show={alertConfig.show}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
          onConfirm={() => { alertConfig.onConfirm?.(); closeAlert(); }}
          onCancel={() => { alertConfig.onCancel?.(); closeAlert(); }}
        />

        {multipleEntry && <div className="multi-banner">🔁 Multiple Entry Mode Active</div>}

        {mode === "new" && (
          <div className="radio-section">
            <p><strong>Which goods do you need to enter?</strong></p>
            <label>
              <input type="radio" name="goods_type" value="Raw Material" checked={form.goods_type === "Raw Material"} onChange={handleChange} />
              Raw Material
            </label>
            <label style={{ marginLeft: 8 }}>
              <input type="radio" name="goods_type" value="Finish Goods" checked={form.goods_type === "Finish Goods"} onChange={handleChange} />
              Finish Goods
            </label>
          </div>
        )}

        <div className="form-sectionpr">
          <div className="form-leftpr">
            <label>Code:</label>
            <input name="product_code" value={form.product_code} readOnly />
            <label>Product Name:</label>
            <input name="product_name" value={form.product_name} onChange={handleChange} readOnly={mode === "view"} />
            <label>Units:</label>
            <select name="units" value={form.units} onChange={handleChange} disabled={mode === "view"}>
              <option value="Nos">Nos</option>
              <option value="Unit">Unit</option>
              <option value="Kg">Kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
            </select>
            <label>Supplier Code:</label>
            <input name="supplier_code" value={form.supplier_code} onChange={handleChange} onKeyDown={handleSupplierKey} readOnly={mode === "view"} autoComplete="off" />
            <label>Supplier Name:</label>
            <input name="supplier_name" value={form.supplier_name} onChange={handleChange} onKeyDown={handleSupplierKey} readOnly={mode === "view"} autoComplete="off" />
            {showSupplierDropdown && supplierOptions.length > 0 && mode !== "view" && (
              <div className="supplier-dropdown">
                {supplierOptions.map((s) => (
                  <div key={s.sup_code} className="supplier-option" onMouseDown={() => selectSupplier(s)}>
                    <strong>{s.sup_code}</strong> — {s.sup_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-rightpr">
            <label>Available Stock:</label>
            <input name="available_stock" value={form.available_stock} onChange={handleChange} readOnly={mode === "view"} />
            <label>Unit Cost:</label>
            <input name="unit_cost" value={form.unit_cost} onChange={handleChange} readOnly={mode === "view"} />
            <label>Qty:</label>
            <input name="qty" value={form.qty} onChange={handleChange} readOnly={mode === "view"} />
            <label>Retail Price:</label>
            <input name="retail_price" value={form.retail_price} onChange={handleChange} readOnly={mode === "view"} />
            <label>Whole Sale Price:</label>
            <input name="whole_sale_price" value={form.whole_sale_price} onChange={handleChange} readOnly={mode === "view"} />
          </div>
        </div>

        <div className="button-section">
          {mode === "view" && <button className="btnprnew" onClick={handleNew}>New</button>}
          {(mode === "new" || mode === "edit") && (
            <>
              {mode === "new" ? (
                <button className="btnprsave" onClick={handleSave}>Save</button>
              ) : (
                <button className="btnprsave" onClick={handleUpdate}>Update</button>
              )}
              {mode === "edit" && <button className="btnprdelete" onClick={handleDelete}>Delete</button>}
              <button className="btnprexit" onClick={handleExit}>Exit</button>
            </>
          )}
        </div>

        <div className="search-sectionprd" style={{ margin: "10px 0" }}>
          <input type="text" placeholder="Search by Code or Name..." value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} className="search-input" />
        </div>

        <table className="product-grid">
          <thead>
            <tr>
              <th>Code</th>
              <th>Goods Type</th>
              <th>Product Name</th>
              <th>Units</th>
              <th>Supplier Code</th>
              <th>Supplier Name</th>
              <th>Stock</th>
              <th>Unit Cost</th>
              <th>Qty</th>
              <th>Retail</th>
              <th>Wholesale</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p.product_code} onClick={() => handleRowClick(p)} style={{ cursor: "pointer", backgroundColor: selectedCode === p.product_code ? "#e0f7fa" : "white" }}>
                <td>{p.product_code}</td>
                <td>{p.goods_type}</td>
                <td>{p.product_name}</td>
                <td>{p.units}</td>
                <td>{p.supplier_code}</td>
                <td>{p.supplier_name}</td>
                <td>{p.available_stock}</td>
                <td>{p.unit_cost}</td>
                <td>{p.qty}</td>
                <td>{p.retail_price}</td>
                <td>{p.whole_sale_price}</td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && <tr><td colSpan="11" style={{ textAlign: "center" }}>No products found</td></tr>}
          </tbody>
        </table>

        <div className="paginationprod" style={{ marginTop: 10 }}>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => handlePageChange(i + 1)} style={{ fontWeight: currentPage === i + 1 ? "bold" : "normal", margin: 4 }}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
