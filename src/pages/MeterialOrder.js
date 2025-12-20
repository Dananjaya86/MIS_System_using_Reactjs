import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import axios from "axios";
import AlertBox from "../componants/Alertboxre";
import "./meterialordercs.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function MaterialOrderWindow() {
  const [formData, setFormData] = useState({
    orderNo: "",
    supplierCode: "",
    supplierName: "",
    productCode: "",
    productName: "",
    availableStock: "",
    orderQty: "",
    orderDate: "",
    amount: "",
  });

  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [alert, setAlert] = useState({ show: false, type: "info", title: "", message: "" });
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [advancePay, setAdvancePay] = useState(0);

  const [supplierSearch, setSupplierSearch] = useState("");
const [productSearch, setProductSearch] = useState("");

const [unitPrice, setUnitPrice] = useState(0);

const [confirmAction, setConfirmAction] = useState(null);


const [mode, setMode] = useState("VIEW");
const isReadOnly = mode === "VIEW";

const [orderNo, setOrderNo] = useState("");

const [showViewModal, setShowViewModal] = useState(false);
const [viewSearch, setViewSearch] = useState("");
const [viewResults, setViewResults] = useState([]);

const username = localStorage.getItem("username");



  
  const showAlert = (type, title, message) => setAlert({ show: true, type, title, message });
  const closeAlert = () => setAlert({ ...alert, show: false });

 const filteredSuppliers = suppliers.filter(
  (s) =>
    s &&
    ((s.sup_code || "").toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.sup_name || "").toLowerCase().includes(supplierSearch.toLowerCase()))
);

const filteredProducts = products.filter(
  (p) =>
    p &&
    ((p.product_code || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.product_name || "").toLowerCase().includes(productSearch.toLowerCase()))
);

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatAmount = (value) =>
  value
    ? Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";



 
  useEffect(() => {
    loadOrderNo();
  }, []);

  const loadOrderNo = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/material-order/new-order-no");
      setFormData(prev => ({ ...prev, orderNo: res.data.orderNo }));
    } catch (err) {
      showAlert("error", "Error", "Failed to load new order number");
    }
  };


  useEffect(() => {
  if (formData.orderQty && unitPrice) {
    setFormData(prev => ({
      ...prev,
      amount: (formData.orderQty * unitPrice).toFixed(2),
    }));
  }
}, [formData.orderQty, unitPrice]);


const showConfirm = (title, message, onYes) => {
  setConfirmAction(() => onYes);
  setAlert({ show: true, type: "question", title, message });
};


const openView = async () => {
  try {
    setShowViewModal(true);
    const res = await axios.get("http://localhost:5000/api/material-order/search");
    setViewResults(res.data);
  } catch (err) {
    console.error(err);
  }
};



const filteredViews = viewResults.filter(o => {
  const search = viewSearch.toLowerCase();

  const orderNo = (o.order_no || "").toLowerCase();
  const supplier = (o.supplier_name || "").toLowerCase();

  const dateStr = o.date
    ? new Date(o.date).toISOString().slice(0, 10) 
    : "";

  return (
    orderNo.includes(search) ||
    supplier.includes(search) ||
    dateStr.includes(search)
  );
});



  const viewAndPrint = async (orderNo) => {
  const res = await axios.get(
    `http://localhost:5000/api/material-order/${orderNo}`
  );
  const { order, details, supplier } = res.data;
  generatePDF(order, details, supplier);
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Supplier popup window
  const openSupplierPopup = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/material-order/suppliers");
      setSuppliers(Array.isArray(res.data) ? res.data : []);
      setShowSupplierModal(true);
    } catch (err) {
      showAlert("error", "Error", "Failed to load suppliers");
    }
  };

  const selectSupplier = async (s) => {
  setFormData(prev => ({
    ...prev,
    supplierCode: s.sup_code,
    supplierName: s.sup_name
  }));
  setShowSupplierModal(false);

  try {
    const res = await axios.get(`http://localhost:5000/api/material-order/advance-payment/${s.sup_code}`);
    const { sum, breakdown } = res.data;

    setAdvancePay(sum || 0);

    if (breakdown.length > 0) {
      const formattedBreakdown = breakdown.map(b => b.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
      showAlert("info", "Advance Payment Breakdown", `Advance payment breakdown is ${formattedBreakdown.join(" , ")}`);
    }
  } catch (err) {
    console.error(err);
    showAlert("error", "Error", "Failed to fetch advance payment");
  }
};


  // Product popup window
  const openProductPopup = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/material-order/products"); 
      setProducts(Array.isArray(res.data) ? res.data : []);
      setShowProductModal(true);
    } catch (err) {
      showAlert("error", "Error", "Failed to load products");
    }
  };

  const selectProduct = async (p) => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/material-order/product-info/${p.product_code}`
    );

    setFormData(prev => ({
      ...prev,
      productCode: p.product_code,
      productName: p.product_name,
      availableStock: res.data.availableStock
    }));

    setUnitPrice(res.data.unitCost); 
    setShowProductModal(false);
  } catch (err) {
    showAlert("error", "Error", "Failed to load product stock/price");
  }
};

const clearFormSilently = () => {
  setFormData({
    orderNo: "",
    supplierCode: "",
    supplierName: "",
    productCode: "",
    productName: "",
    availableStock: "",
    orderQty: "",
    orderDate: "",
    amount: "",
  });
  setOrders([]);
  setAdvancePay(0);
  setIsEditing(false);
  setEditIndex(null);
};



const handleNew = () => {
  showConfirm(
    "New Order",
    "Do you want to create a new order?",
    () => {
      setMode("NEW");
    }
  );
};




const handleAdd = () => {
  if (!formData.productCode || !formData.orderQty) {
    showAlert("warning", "Missing Data", "Product and Quantity are required");
    return;
  }

  setOrders(prev => [...prev, { ...formData }]);

  showAlert("success", "Added", "Item added successfully");

  setFormData(prev => ({
    ...prev,
    productCode: "",
    productName: "",
    availableStock: "",
    orderQty: "",
    amount: "",
  }));
};



const handleExit = () => {
  showConfirm(
    "Exit",
    "Unsaved data will be lost. Continue?",
    () => setMode("VIEW")
  );
};


const handleUpdate = () => {
  if (!isEditing || editIndex === null) {
    showAlert("warning", "No Selection", "No item selected to update");
    return;
  }

  showConfirm(
    "Update Item",
    "Do you want to update this order?",
    () => {
      setOrders(prev => {
        const updated = [...prev];
        updated[editIndex] = { ...formData };
        return updated;
      });

      setIsEditing(false);
      setEditIndex(null);
      setMode("NEW");

      setFormData(prev => ({
        ...prev,
        productCode: "",
        productName: "",
        availableStock: "",
        orderQty: "",
        amount: "",
      }));

      showAlert("success", "Updated", "Item updated successfully");
    }
  );
};



const handleModify = (index) => {
  showConfirm(
    "Modify Item",
    "Do you want to modify this order?",
    () => {
      setMode("EDIT");
      setFormData(orders[index]);
      setIsEditing(true);
      setEditIndex(index);
    }
  );
};



  
  const handleSave = async () => {
  if (!formData.supplierCode || orders.length === 0) {
    showAlert("warning", "Warning", "Supplier and at least one product required!");
    return;
  }

  showConfirm(
    "Save Order",
    "Do you want to save this order?",
    async () => {
      try {
        await axios.post("http://localhost:5000/api/material-order/save", {
          orderNo: formData.orderNo,
          supplierCode: formData.supplierCode,
          supplierName: formData.supplierName,
          totalOrderAmount: totalAmount,
          advancePay,
          balanceToBePay: balance,
          loginUser: username,
          orderDate: formData.orderDate,
          items: orders,
        });

        showConfirm(
  "Saved",
  "Order saved successfully! Do you want to print?",
  async () => {
    const res = await axios.get(
      `http://localhost:5000/api/material-order/${formData.orderNo}`
    );
    const { order, details, supplier } = res.data;
    generatePDF(order, details, supplier);
  }
);
        loadOrderNo();
        setMode("VIEW");
        clearFormSilently();
      } catch (err) {
        showAlert("error", "Error", "Failed to save order!");
      }
    }
  );
};

  

  const handleDelete = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const handleClear = () => {
  showConfirm(
    "Clear Form",
    "Do you want to clear entered data?",
    () => {
      clearFormSilently();
    }
  );
};

const formatPDFMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0.00";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


const generatePDF = (order, details, supplier) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text("Milkee Foods Products", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("Halpita, Polgasowita", 105, 22, { align: "center" });
  doc.text("T.P. +94 778 608 207", 105, 28, { align: "center" });

  doc.setFontSize(14);
  doc.text("Material Order", 105, 38, { align: "center" });

  // Supplier (Left)
  doc.setFontSize(10);
  doc.text(`Supplier : ${supplier.sup_name}`, 14, 50);
  doc.text(`Address  : ${supplier.address}`, 14, 56);
  doc.text(`Contact  : ${supplier.contact_person}`, 14, 62);
  doc.text(`Phone    : ${supplier.phone}`, 14, 68);

  // Order (Right)
  doc.text(`Order No : ${order.order_no}`, 140, 50);
  doc.text(`Order Date : ${order.date}`, 140, 56);
  doc.text(`Real Date  : ${new Date(order.real_date).toLocaleString()}`, 140, 62);

  // Table
  const tableData = details.map(d => [
  d.product_code,
  d.product_name,
  d.available_stock,
  d.order_qty,
  formatPDFMoney(d.unit_cost),
  formatPDFMoney(d.amount)
]);


  autoTable(doc, {
  startY: 75,
  head: [[ "Product Code", "Product Name", "Avail. Stock", "Order Qty", "Unit Cost", "Amount" ]],
  body: tableData,
});


  const finalY = doc.lastAutoTable.finalY + 10;

  doc.text(`Total Amount : ${formatPDFMoney(order.total_order_amount)}`, 152, finalY);

 
  
  doc.text(`Prepared By : ${order.login_user || "Unknown"}`, 14, finalY + 20);
  doc.text("Checked By: ___________", 80, finalY + 20);
  doc.text("Authorized By: ___________", 140, finalY + 20);

  doc.save(`Material_Order_${order.order_no}.pdf`);
};

  // Totals
  const totalAmount = orders.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const balance = totalAmount - parseFloat(advancePay || 0);

  return (
    <div className="container3">
      <Menu />
      <div className="content3">
        <h2>Material Order Window</h2>

        
        <div className="form-section">
          <div className="form-left" style={{ position: "relative" }}>
            <label>Order No:</label>
            <input name="orderNo" value={formData.orderNo} onChange={handleChange} readOnly/>

            <label>Supplier Code:</label>
            <input    name="supplierCode"    value={formData.supplierCode}    readOnly  ={isReadOnly}  onClick={!isReadOnly ? openSupplierPopup : undefined}  />

            <label>Supplier Name:</label>
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} readOnly />

            <label>Product Code:</label>
            <input    name="productCode"    value={formData.productCode}    readOnly ={isReadOnly}  onClick={!isReadOnly ? openProductPopup : undefined}  />
            <label>Product Name:</label>
            <input name="productName" value={formData.productName} onChange={handleChange} readOnly />
          </div>

          <div className="form-right">
            <label>Available Stock:</label>
            <input name="availableStock" value={formData.availableStock} onChange={handleChange} readOnly/>
            <label>Order Qty:</label>
            <input name="orderQty" value={formData.orderQty} onChange={handleChange}  readOnly={isReadOnly} />
            <label>Order Date:</label>
            <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} readOnly={isReadOnly}/>
            <label>Amount:</label>
            <input
  name="amount"
  type="text"
  value={formatMoney(formData.amount)}
  onChange={(e) => {
    const raw = e.target.value.replace(/,/g, "");

    if (/^\d*\.?\d*$/.test(raw)) {
      setFormData({ ...formData, amount: raw });
    }
  }} readOnly/>

          </div>
        </div>

        <div className="buttons">
  {mode === "VIEW" && (
    <button className="btnnewmt" onClick={handleNew}>New</button>
  )}

  {mode === "NEW" && (
    <>
      <button className="btnaddmt" onClick={handleAdd}>Add</button>
      <button className="btnsavemt" onClick={handleSave} disabled={orders.length === 0}>
        Save
      </button>
      <button className="btnclearmt" onClick={handleClear}>Clear</button>
      <button className="btnexitmt" onClick={handleExit}>Exit</button>
    </>
  )}

  {mode === "EDIT" && (
    <>
      <button className="btnmodifymt" onClick={handleUpdate}>Update</button>
      <button className="btnexitmt" onClick={handleExit}>Exit</button>
    </>
  )}
</div>

        
        <table>
          <thead>
            <tr>
              <th>Order No</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Available Stock</th>
              <th>Order Qty</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row, index) => (
              <tr key={index}>
                <td>{row.orderNo}</td>
                <td>{row.productCode}</td>
                <td>{row.productName}</td>
                <td>{row.availableStock}</td>
                <td>{row.orderQty}</td>
                <td>{formatAmount(row.amount)}</td>
                <td>
                  <button className="btnmodifymt" onClick={() => handleModify(index)}>Modify</button>
                  <button className="btndeletemt" onClick={() => handleDelete(index)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        

       
        <div className="summary">
          <label>Total Order Amount:</label>
          <input type="text" value={formatMoney(totalAmount)} readOnly/>
          <label>Advance Pay:</label>
          <input type="text" value={formatMoney(advancePay)} onChange={(e) => {const raw = e.target.value.replace(/,/g, "");if (/^\d*\.?\d*$/.test(raw)) {setAdvancePay(raw);} }} readOnly/>
          <label>Balance to be Paid:</label>
          <input type="text" value={formatMoney(balance)} readOnly/>
        </div>

       
        
        {showSupplierModal && (
  <div className="popup-dropdown">
    <div className="popup-box">
      <div className="popup-header">
        <h3>Supplier List</h3>
        <button className="close-btn" onClick={() => setShowSupplierModal(false)}>X</button>
      </div>
      <input
        type="text"
        placeholder="Search Supplier..."
        value={supplierSearch}
        onChange={(e) => setSupplierSearch(e.target.value)}
        className="popup-search"
      />
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredSuppliers.map((s) => (
            <tr key={s.sup_code} onClick={() => selectSupplier(s)}>
              <td>{s.sup_code}</td>
              <td>{s.sup_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
        
        {showProductModal && (
  <div className="popup-dropdown">
    <div className="popup-box">
      <div className="popup-header">
        <h3>Product List</h3>
        <button className="close-btn" onClick={() => setShowProductModal(false)}>X</button>
      </div>
      <input
        type="text"
        placeholder="Search Product..."
        value={productSearch}
        onChange={(e) => setProductSearch(e.target.value)}
        className="popup-search"
      />
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.product_code} onClick={() => selectProduct(p)}>
              <td>{p.product_code}</td>
              <td>{p.product_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}





       
        <div className="buttons">
          
          <button className="btnviewmt" onClick={openView}>View</button>
        </div>
      </div>

      {showViewModal && (
  <div className="popup-dropdown">
    <div className="popup-box">
      <div className="popup-header">
        <h3>View Orders</h3>
        <button onClick={() => setShowViewModal(false)}>X</button>
      </div>

      <input
        className="popup-search"
        placeholder="Search by Order No, Supplier, Date"
        value={viewSearch}
        onChange={e => setViewSearch(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>Order No</th>
            <th>Supplier</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredViews.map(o => (
            <tr key={o.order_no} onClick={() => viewAndPrint(o.order_no)}>
              <td>{o.order_no}</td>
              <td>{o.supplier_name}</td>
              <td>{o.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}


     
      <AlertBox
  show={alert.show}
  type={alert.type}
  title={alert.title}
  message={alert.message}
  onClose={closeAlert}
  onConfirm={() => {
    if (confirmAction) confirmAction();
    closeAlert();
  }}
/>

    </div>
  );
}
