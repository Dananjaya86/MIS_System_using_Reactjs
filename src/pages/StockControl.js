import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import AlertBox from "../componants/Alertboxre";
import Namewithdateacc from "../componants/Namewithdateacc";
import "./stockcontrol.css";

export default function StockControl() {
  const [form, setForm] = useState({
    code: "",
    name: "",
    available: "",
    physical: "",
    difference: 0,
    adjustIn: "",
    adjustOut: "",
    remarks: "",
  });

  const [rows, setRows] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showNewButtons, setShowNewButtons] = useState(false);
  const username = localStorage.getItem("username");

  const [showProductPopup, setShowProductPopup] = useState(false);
  const [products, setProducts] = useState([]);

  
  const [productSelected, setProductSelected] = useState(false);

  const [isAdding, setIsAdding] = useState(false);

  const [mode, setMode] = useState("VIEW");
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const [physicalTouched, setPhysicalTouched] = useState(false);

  const [adjustments, setAdjustments] = useState([]);
const [loadingAdjustments, setLoadingAdjustments] = useState(false);

const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 10; 

const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

const currentAdjustments = adjustments.slice(
  indexOfFirstRecord,
  indexOfLastRecord
);

const totalPages = Math.ceil(adjustments.length / recordsPerPage);


  

  const [productSearch, setProductSearch] = useState("");
  const [showSaveButton, setShowSaveButton] = useState(false);

  const [fieldsEditable, setFieldsEditable] = useState({
  physical: false,
  remarks: false,
  adjustIn: false,
  adjustOut: false,
});






 
  const [alert, setAlert] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

useEffect(() => {
  loadStockAdjustments();
}, []);



  /* ---------- AUTO DIFFERENCE ---------- */
  useEffect(() => {
  const available = parseFloat(form.available) || 0;
  const physical = parseFloat(form.physical) || 0;

  const difference = physical - available;

  if (form.difference !== difference) {
    setForm(prev => ({ ...prev, difference }));
  }
}, [form.available, form.physical]);



  const fetchProducts = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/stock/products");
    const data = await res.json();
    setProducts(data);
    setProductSearch("");   
    setShowProductPopup(true);
  } catch (err) {
    showAlert("error", "Error", "Failed to load products");
  }
};


const loadStockAdjustments = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/stock/adjustment");
    const data = await res.json();
    setAdjustments(data);
    setCurrentPage(1); 
  } catch (err) {
    showAlert("error", "Error", "Failed to load stock adjustments");
  }
};






const selectProduct = async (product) => {
  setForm((prev) => ({
    ...prev,
    code: product.product_code,
    name: product.product_name,
  }));

  setProductSelected(true); 
  setShowProductPopup(false);

  try {
    const res = await fetch(
      `http://localhost:5000/api/stock/available/${product.product_code}`
    );
    const data = await res.json();
    setForm((prev) => ({
      ...prev,
      available: data.available_stock || 0,
    }));
  } catch {
    showAlert("error", "Error", "Failed to load available stock");
  }
};




  
  const handleChange = (e) => {
  const { name, value } = e.target;

  
  if (name === "physical" && mode === "EDIT") {
    if (physicalTouched) {
      showAlert("info", "Notice", "You are changing physical stock");
    } else {
      setPhysicalTouched(true); 
    }
  }

  const updatedForm = { ...form, [name]: value };

  const available = parseFloat(updatedForm.available) || 0;
  const physical = parseFloat(updatedForm.physical) || 0;
  const adjustIn = parseFloat(updatedForm.adjustIn) || 0;
  const adjustOut = parseFloat(updatedForm.adjustOut) || 0;

  const adjustedPhysical = physical + adjustIn - adjustOut;
  const difference = adjustedPhysical - available;

  updatedForm.difference = difference;

  setForm(updatedForm);
};



  /* ---------- VALIDATION ---------- */
  const validateForm = () => {
    if (!form.code || !form.name || form.available === "" || form.physical === "") {
      showAlert(
        "warning",
        "Validation Error",
        "Product code, name, available stock and physical stock cannot be empty"
      );
      return false;
    }

    if (form.difference < 0) {
      showAlert(
        "info",
        "Stock Adjustment Needed",
        `Stock adjustment IN needed. Stock difference is ${Math.abs(form.difference)}`
      );
      return false;
    }

    if (form.difference > 0) {
      showAlert(
        "info",
        "Stock Adjustment Needed",
        `Stock adjustment OUT needed. Stock difference is ${form.difference}`
      );
      return false;
    }

    return true;
  };

  /* ---------- ADD ---------- */
  const handleAdd = () => {
    if (!validateForm()) return;

    if (editingIndex !== null) {
      const updated = [...rows];
      updated[editingIndex] = form;
      setRows(updated);
      setEditingIndex(null);
    } else {
      setRows([...rows, form]);
    }

    showAlert("success", "Success", "Item added to grid successfully");
    handleClear();
    setIsAdding(true); 
    setProductSelected(false);
    setShowSaveButton(true);
  };

const filteredProducts = products.filter((p) => {
  const search = productSearch.toLowerCase().trim();

  return (
    p.product_name?.toLowerCase().includes(search) ||
    p.product_code?.toLowerCase().includes(search)
  );
});



  /* ---------- EDIT / DELETE CONFIRM ---------- */
  const handleRowClick = (index) => {
  showAlert(
    "question",
    "Confirmation",
    `Do you want to edit or delete the "${rows[index].name}"?`,
    () => enableEditMode(index)
  );
};


const enableEditMode = (index) => {
  setForm(rows[index]);
  setEditingIndex(index);

  setMode("EDIT");
  setShowNewButtons(true);
  setShowDeleteButton(true);
  setIsAdding(false);
  setProductSelected(true);

  setPhysicalTouched(false);   
  closeAlert();
};



const handleExit = () => {
  setMode("VIEW");
  setShowNewButtons(false);
  setShowDeleteButton(false);
  setEditingIndex(null);
  setProductSelected(false);
  setIsAdding(false);
  handleClear();
};

const resetToLoadState = () => {
  setMode("VIEW");
  setShowNewButtons(false);
  setShowDeleteButton(false);
  setShowSaveButton(false);

  setEditingIndex(null);
  setIsAdding(false);
  setProductSelected(false);

  setRows([]);
  handleClear();
};


  

  const handleDelete = (index) => {
  setRows((prev) => prev.filter((_, i) => i !== index));

  handleClear();            
  setEditingIndex(null);
  setShowDeleteButton(false);
  setMode("NEW");           
};


  /* ---------- CLEAR ---------- */
  const handleClear = () => {
    setForm({
      code: "",
      name: "",
      available: "",
      physical: "",
      difference: 0,
      adjustIn: "",
      adjustOut: "",
      remarks: "",
    });
    setEditingIndex(null);
    setPhysicalTouched(false);
  };

  /* ---------- SAVE ---------- */
  const handleSave = async () => {
  if (rows.length === 0) {
    showAlert("warning", "No Data", "No records to save");
    return;
  }

  try {
    for (const row of rows) {
      
      const payload = {
        product_code: row.code,
        product_name: row.name,
        available_stock: parseFloat(row.available) || 0,
        physical_stock: parseFloat(row.physical) || 0,
        adjustment_in: parseFloat(row.adjustIn) || 0,
        adjustment_out: parseFloat(row.adjustOut) || 0,
        differance: parseFloat(row.difference) || 0,
        remarks: row.remarks || "",
        login_user: username || "Unknown",
      };

      const response = await fetch("http://localhost:5000/api/stock/adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Save failed");
      }
    }

    showAlert("success", "Saved", "Stock adjustment saved successfully");
    setRows([]); 
    resetToLoadState();
    loadStockAdjustments();

  } catch (error) {
    showAlert("error", "Save Error", error.message);
  }
};


  
  const showAlert = (type, title, message, onConfirm = null) => {
    setAlert({ show: true, type, title, message, onConfirm });
  };

  const closeAlert = () => {
    setAlert({ ...alert, show: false });
  };

  return (
    <div className="stock-control-container">
      <Menu />
      <div className="stock-control-content">
        <Namewithdateacc/>
                <h1>Stock Control</h1>

      
        <div className="form-gridstok">
          <div className="stockconleft">
            <label>Product Code</label>
            <input
  name="code"
  value={form.code}
  readOnly={mode !== "NEW"}
  onClick={mode === "NEW" ? fetchProducts : undefined}
  placeholder="Click to search product"
/>


            <label>Product Name</label>
            <input name="name" value={form.name} onChange={handleChange} readOnly />

            <label>Available Stock</label>
            <input type="number" name="available" value={form.available} onChange={handleChange} readOnly />

            <label>Physical Stock</label>
            <input type="number" name="physical" value={form.physical} onChange={handleChange}  readOnly={!(mode === "NEW" || mode === "EDIT")} />    </div>

          <div className="stockconright">
            <label>Adjustment Out Stock</label>
            <input type="number" name="adjustIn" value={form.adjustIn} onChange={handleChange}  readOnly={!(form.difference < 0 && (mode === "NEW" || mode === "EDIT"))} />

            <label>Adjustment In Stock</label>
            <input type="number" name="adjustOut" value={form.adjustOut} onChange={handleChange}  readOnly={!(form.difference > 0 && (mode === "NEW" || mode === "EDIT"))} />

            <label>Difference</label>
            <input type="number" value={form.difference} readOnly />

            <label>Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange}  rows={3}  readOnly={!(mode === "NEW" || mode === "EDIT")} /> </div>
        </div>

      
        {!showNewButtons ? (
          <button className="btn new" onClick={() => {  setMode("NEW");  setShowNewButtons(true);  setIsAdding(true); setProductSelected(false);  setPhysicalTouched(false);  handleClear();}}> New</button>

        ) : (
          <div className="button-row"><button className="btn add" onClick={handleAdd}>{editingIndex !== null ? "Update" : "Add"} </button>
          {mode === "EDIT" && showDeleteButton && (<button className="btn delete" onClick={() => handleDelete(editingIndex)}> Delete </button>)}
            <button className="btn clear" onClick={handleClear}>Clear</button>
            <button className="btn exit"  onClick={handleExit}> Exit</button>

          </div>
        )}

    
        <table className="stock-table">
  {rows.length > 0 && (
    <thead>
      <tr>
        <th>Product Code</th>
        <th>Product Name</th>
        <th>Available</th>
        <th>Physical</th>
        <th>Adj. In</th>
        <th>Adj. Out</th>
        <th>Difference</th>
        <th>Remarks</th>
      </tr>
    </thead>
  )}

  <tbody>
    {rows.length === 0 ? (
      <tr>
        <td colSpan="8" style={{ textAlign: "center", padding: "10px" }}>
          No items added yet
        </td>
      </tr>
    ) : (
      rows.map((row, index) => (
        <tr key={index} onClick={() => handleRowClick(index)}>
          <td>{row.code}</td>
          <td>{row.name}</td>
          <td>{row.available}</td>
          <td>{row.physical}</td>
          <td>{row.adjustIn}</td>
          <td>{row.adjustOut}</td>
          <td>{row.difference}</td>
          <td>{row.remarks}</td>
        </tr>
      ))
    )}
  </tbody>
</table>


     
        <div className="button-row">  {showSaveButton && (<button className="btn save" onClick={handleSave}>Save</button>
  )}
</div>


<div style={{ marginTop: "30px" }}>
  <h3>Stock Adjustment History</h3>

  {loadingAdjustments && <p>Loading...</p>}

  {!loadingAdjustments && adjustments.length === 0 && (
    <p>No stock adjustments found</p>
  )}

  {!loadingAdjustments && adjustments.length > 0 && (
    <table className="stock-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Available</th>
          <th>Physical</th>
          <th>Adj In</th>
          <th>Adj Out</th>
          <th>Diff</th>
          <th>Remarks</th>
          <th>User</th>
          <th>Date</th>
        </tr>
      </thead>

      <tbody>
        {currentAdjustments.map((row, i) => (
          <tr key={i}>
            <td>{row.product_code}</td>
            <td>{row.product_name}</td>
            <td>{row.available_stock}</td>
            <td>{row.physical_stock}</td>
            <td style={{ color: "green" }}>{row.adjustment_in}</td>
            <td style={{ color: "red" }}>{row.adjustment_out}</td>
            <td>{row.differance}</td>
            <td>{row.remarks}</td>
            <td>{row.login_user}</td>
            <td>{new Date(row.real_date).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}



{totalPages > 1 && (
  <div className="pagination">
    <button
      className="btn"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(prev => prev - 1)}
    >
      Prev
    </button>

    <span style={{ margin: "0 10px" }}>
      Page {currentPage} of {totalPages}
    </span>

    <button
      className="btn"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(prev => prev + 1)}
    >
      Next
    </button>
  </div>
)}


</div>


      </div>



      

      {showProductPopup && (
  <div className="popup-overlay">
    <div className="popup-box">
      <h3>Select Product</h3>

      
      <input
        type="text"
  placeholder="Search by product name or code"
  value={productSearch}
  onChange={(e) => setProductSearch(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "10px",
          padding: "6px"
        }}
      />

      <table className="stock-table">
        <thead>
          <tr>
            <th>Product Code</th>
            <th>Product Name</th>
          </tr>
        </thead>
        <tbody>
  {filteredProducts.length === 0 ? (
    <tr>
      <td colSpan="2" style={{ textAlign: "center" }}>
        No products found
      </td>
    </tr>
  ) : (
    filteredProducts.map((p, i) => (
      <tr key={i} onClick={() => selectProduct(p)}>
        <td>{p.product_code}</td>
        <td>{p.product_name}</td>
      </tr>
    ))
  )}
</tbody>

      </table>

      <button className="btn exit" onClick={() => setShowProductPopup(false)}>
        Close
      </button>
    </div>
  </div>
)}


     
      <AlertBox
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
      />
    </div>
  );
}
