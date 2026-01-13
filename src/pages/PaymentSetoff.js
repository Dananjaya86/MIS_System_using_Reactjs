  import React, { useState } from "react";
  import Menu from "../componants/Menu";
  import "./paymentsetoff.css";
  import { useEffect } from "react";
  import AlertBox from "../componants/Alertboxre"
  import Namewithdateacc from "../componants/Namewithdateacc"

  export default function PaymentSetoff() {
    const [type, setType] = useState("select");
    const [mode, setMode] = useState("view");
    const [gridData, setGridData] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [search, setSearch] = useState("");
    const [popupData, setPopupData] = useState([]);
    const [selectedAdvanceId, setSelectedAdvanceId] = useState(null);
    const [readOnlyInvoice, setReadOnlyInvoice] = useState(true);
    
    const [showAdvancePopup, setShowAdvancePopup] = useState(false);
  const [advanceData, setAdvanceData] = useState([]);

    const [partyList, setPartyList] = useState([]);

    const [isSaving, setIsSaving] = useState(false);
    

    const [showCustomerPopup, setShowCustomerPopup] = useState(false);
    const [typeLocked, setTypeLocked] = useState(false);

    const currentType = type;
  const isAdvanceMode = currentType === "advancepay";


    
    const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null, 
  });


    const showAlert = (type, title, message, onConfirm = null) => {
    setAlertConfig({ show: true, type, title, message, onConfirm });
  };


  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, show: false }));
  };



    const [form, setForm] = useState({
      invoiceNumber: "",
      code: "",
      name: "",
      manualBillNo: "",
      totalCredit: "",
      paidAmount: "",
      advancePayment: "",
      balanceAmount: "",
    });

  useEffect(() => {
    if (type !== "customer" && type !== "supplier" && type !== "advancepay") {
      setPartyList([]);
      return;
    }

    const loadComboData = async () => {
      try {
        let url = "";

        if (currentType  === "customer") {
          url = "http://localhost:5000/api/customers";
        } else if (currentType  === "supplier") {
          url = "http://localhost:5000/api/suppliers";
        } else if (currentType  === "advancepay") {
          url = "http://localhost:5000/api/paysetoff/advance";
        }

        const res = await fetch(url);
        const result = await res.json();

        console.log("Combo API response:", result);

        
        if (Array.isArray(result)) {
          setPartyList(result);
        } else if (Array.isArray(result.data)) {
          setPartyList(result.data);
        } else {
          setPartyList([]);
        }
      } catch (err) {
        console.error("Combo load error:", err);
        setPartyList([]);
      }
    };

    loadComboData();
  }, [type]);



    const handlePartyChange = async (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;

    const selectedParty = partyList.find(p => p.code === selectedCode);

    setForm(prev => ({
      ...prev,
      code: selectedParty?.code || "",
      name: selectedParty?.name || "",
      advancePayment: "0.00",
      advancePayId: null,
    }));

    setSelectedAdvanceId(null);

    try {
      const res = await fetch(
        `http://localhost:5000/api/paysetoff/advance/by-party?code=${selectedCode}`
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length === 1) {
        
        setForm(prev => ({
          ...prev,
          advancePayment: Number(data[0].advance_payment_amount).toFixed(2),
          advancePayId: data[0].advance_pay_id,
        }));
      }

      if (Array.isArray(data) && data.length > 1) {
        
        setAdvanceData(data);
        setShowAdvancePopup(true);
      }

    } catch (err) {
      console.error("Advance fetch error:", err);
    }
  };





    // ---------------- FETCH POPUP DATA ----------------
    const fetchPopupData = async (currentType  = type) => {
    try {
      let url = "";

      if (currentType  === "customer") {
        url = "http://localhost:5000/api/paysetoff/pending?party=cus";
      } else if (currentType  === "supplier") {
        url = "http://localhost:5000/api/paysetoff/pending?party=sup";
      } else if (currentType  === "advancepay") {
        url = "http://localhost:5000/api/paysetoff/advance";
      } else {
        return;
      }

      const res = await fetch(url);
      const data = await res.json();

      console.log("Popup raw data:", data);

      // ❌ not an array → reset
      if (!Array.isArray(data)) {
        console.error("Expected array but got:", data);
        setPopupData([]);
        return;
      }

      /* ===============================
         NORMALIZE DATA BASED ON TYPE
        =============================== */
      if (currentType  === "advancepay") {
    const normalized = data.map(r => ({
      advance_pay_id: r.advance_pay_id,
      party_code: r.party_code,
      party_name: r.party_name,
      advance_payment_amount: Number(r.advance_payment_amount || 0).toFixed(2),
      setoff_date: r.setoff_date
        ? new Date(r.setoff_date).toLocaleDateString()
        : ""
    }));

    setPopupData(normalized);
  }
  else {
    // CUSTOMER / SUPPLIER: include pending balance
    const normalized = data.map((r) => {
      if (currentType === "supplier") {
        
        return {
          invoice_no: r.grn_number || r.ref_number || "", 
          party_code: r.supplier_code || r.party_code || "",
          party_name: r.supplier_name || r.party_name || "",
          balance_payment: Number(r.balance_payment || 0).toFixed(2),
          payment_date: r.payment_date || "",
        };
      } else {
        
        return {
          invoice_no: r.invoice_no || r.ref_number || "",
          party_code: r.party_code || r.customer_code || "",
          party_name: r.party_name || r.customer_name || "",
          balance_payment: Number(r.balance_payment || 0).toFixed(2),
          payment_date: r.payment_date || "",
        };
      }
    });
    setPopupData(normalized);
      }
    } catch (err) {
      console.error("Popup load error", err);
      setPopupData([]); 
    }
  };



  const fetchAdvanceByParty = async (partyCode) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/paysetoff/advance/by-party?code=${partyCode}`
      );
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) return;

      // advance  auto select
      if (data.length === 1) {
        setForm(prev => ({
          ...prev,
          advancePayment: Number(data[0].advance_payment_amount).toFixed(2),
          advancePayId: data[0].advance_pay_id,
        }));
        setSelectedAdvanceId(data[0].advance_pay_id);
        return;
      }

      
      setAdvanceData(data);
      setShowAdvancePopup(true);

    } catch (err) {
      console.error("Advance fetch error:", err);
    }
  };




    // ---------------- FILTER ----------------
    const filteredData =Array.isArray(popupData)
    ? popupData.filter(row =>
      Object.values(row).some(val =>
        String(val ?? "").toLowerCase().includes(search.toLowerCase())
      )
    )
  : [];


    
    const handleTypeChange = async (e) => {
    const newType = e.target.value;

    setType(newType);
    setMode("new");

    if (newType !== "select") {
      setTypeLocked(true);
    }

    // reset form
    setForm({
      invoiceNumber: "",
      code: "",
      name: "",
      manualBillNo: "",
      totalCredit: "",
      paidAmount: "0.00",
      advancePayment: "",
      balanceAmount: "",
      advancePayId: null,
    });

    // ADVANCE PAYMENT load popup 
    if (newType === "advancepay") {
      setSearch("");
      await fetchPopupData(newType); 
      setShowPopup(true);
      return;
    }

    setShowPopup(false);
    setShowCustomerPopup(false);
  };







    const handleSelectAdvance = (row) => {
    const advanceAmount = Number(row.advance_payment_amount || 0);

    setForm(prev => ({
      ...prev,
      code: row.party_code || "",
      name: row.party_name || "",
      invoiceNumber: row.advance_pay_id, 
      advancePayment: advanceAmount.toFixed(2),
      advancePayId: row.advance_pay_id,
      paidAmount: advanceAmount.toFixed(2), 
    }));

    setSelectedAdvanceId(row.advance_pay_id);
    setShowPopup(false); 
    setShowAdvancePopup(false); 

  };








    // ---------------- HANDLERS ----------------
    const handleChange = (e) => { const { name, value } = e.target; setForm((prev) => { 
      let newForm = { ...prev, [name]: value }; 
      if (name === "paidAmount") {
  const paid = parseFloat(value || 0);
  const adv = parseFloat(prev.advancePayment || 0);
  const credit = parseFloat(prev.totalCredit || 0);

  let balance = 0;

  // 🔵 Advance Pay Mode
  if (currentType === "advancepay") {
    balance = adv - paid;     // remaining advance
  }
  // 🔵 Customer / Supplier
  else {
    balance = credit - paid - adv;
  }

  newForm.balanceAmount = balance > 0 ? balance.toFixed(2) : "0.00";
}

        return newForm; }); 
      };

    const handleSelectRow = (row) => {
    const totalCredit = row.balance_payment
      ? parseFloat(row.balance_payment)
      : 0;

  setForm((prev) => ({
    ...prev,
    invoiceNumber: currentType === "advancepay" ? row.advance_pay_id : row.invoice_no || row.ref_number,
    code: row.party_code || "",
    name: row.party_name || "",
    totalCredit: currentType === "advancepay" ? "" : (row.balance_payment ? parseFloat(row.balance_payment).toFixed(2) : "0.00"),
    paidAmount: currentType === "advancepay" ? Number(row.advance_payment_amount).toFixed(2) : "0.00",
    advancePayId: row.advance_pay_id || null,
  }));


    setShowPopup(false);

    //  FETCH ADVANCE AFTER invoice/GRN selection
    if (currentType !== "advancepay") {
      fetchAdvanceByParty(row.party_code);
    }
  };


  const handleClear = () => {
  showAlert(
    "warning",
    "Clear All",
    "This will clear the form and grid. Do you want to continue?",
    () => {
      closeAlert(); 

      
      setForm({
        invoiceNumber: "",
        code: "",
        name: "",
        manualBillNo: "",
        totalCredit: "",
        paidAmount: "0.00",
        advancePayment: "",
        balanceAmount: "",
        advancePayId: null,
      });

      
      setGridData([]);

      
      setType("select");        
      setTypeLocked(false);     
      setMode("view");

      
      setSelectedAdvanceId(null);
      setPopupData([]);
      setAdvanceData([]);
      setShowPopup(false);
      setShowCustomerPopup(false);
      setShowAdvancePopup(false);
      setSearch("");
    }
  );
};






    const handleNew = () => {
  
  setForm({
    invoiceNumber: "",
    code: "",
    name: "",
    manualBillNo: "",
    totalCredit: "",
    paidAmount: "0.00",
    advancePayment: "",
    balanceAmount: "",
    advancePayId: null,
  });

  
  setGridData([]);

  
  setType("select");
  setTypeLocked(false);

 
  setMode("new");
  setSelectedAdvanceId(null);
  setPopupData([]);
  setAdvanceData([]);
  setShowPopup(false);
  setShowCustomerPopup(false);
  setShowAdvancePopup(false);
  setSearch("");
};


    const handleAdd = () => {
    /* ===============================
       ADVANCE PAYMENT MODE
      =============================== */
    if (currentType === "advancepay") {
      if (!form.advancePayId) {
        showAlert("error", "No Advance", "Please select an advance payment");
        return;
      }

      const paid = Number(form.paidAmount || 0);
const adv = Number(form.advancePayment || 0);
const balance = adv - paid;

const newRow = {
  ...form,
  id: Date.now(),
  paidAmount: paid.toFixed(2),
  balanceAmount: balance > 0 ? balance.toFixed(2) : "0.00",
  totalCredit: adv.toFixed(2),
  status: balance > 0 ? "Pending" : "Settled",
  advancePayId: form.advancePayId,
};

// 🔥 Force React refresh
setGridData(prev => [...prev, newRow]);
      setShowAdvancePopup(false);
      setShowPopup(false);
      setMode("view");
      return;
    }

    /* ===============================
       CUSTOMER / SUPPLIER MODE
      =============================== */
    if (!form.invoiceNumber || form.invoiceNumber.trim() === "") {
      showAlert("error", "No Data", "Do not have data to insert");
      return;
    }

    if (
      form.paidAmount === "" ||
      isNaN(form.paidAmount) ||
      parseFloat(form.paidAmount) <= 0
    ) {
      showAlert("error", "Invalid Amount", "Please enter valid payment amount");
      return;
    }

    const balance = parseFloat(form.balanceAmount || 0);
    const status = balance === 0 ? "Settled" : "Pending";

    //  Combine pending balance warning with paid amount confirmation
    const message =
      balance !== 0
        ? `Pending balance payment is ${form.balanceAmount}.\nYour paid amount is "${form.paidAmount}". Do you want to continue?`
        : `Your paid amount is "${form.paidAmount}". Do you want to continue?`;

    showAlert(
      "question",
      "Confirm Payment",
      message,
      () => {
        
        const newRow = {
          ...form,
          id: Date.now(),
          status,
          advancePayId: form.advancePayId || null,
        };

        setGridData((prev) => [...prev, newRow]);

        
        setForm({
          invoiceNumber: "",
          code: "",
          name: "",
          manualBillNo: "",
          totalCredit: "",
          paidAmount: "0.00",
          advancePayment: "",
          balanceAmount: "",
          advancePayId: null,
          
        });
      

        setSelectedAdvanceId(null);
        setShowAdvancePopup(false);
        setShowPopup(false);
        setMode("view");
        
      }
    );
  };



  const handleSelectCustomerSupplier = async (row) => {
    const balancePayment = Number(row.balance_payment || 0).toFixed(2);

    
    setForm(prev => ({
      ...prev,
      invoiceNumber: row.invoice_no || row.ref_number,
      code: row.party_code,
      name: row.party_name,
      totalCredit: balancePayment,
      paidAmount: "0.00",
      balanceAmount: balancePayment,
      advancePayment: "0.00",
    }));

    setShowCustomerPopup(false);
    setShowPopup(false);

    
    try {
      const res = await fetch(
        `http://localhost:5000/api/paysetoff/advance/by-party?code=${row.party_code}`
      );
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) return;

      if (data.length === 1) {
        
        setForm(prev => ({
          ...prev,
          advancePayment: Number(data[0].advance_payment_amount).toFixed(2),
          advancePayId: data[0].advance_pay_id,
        }));
      } else if (data.length > 1) {
        
        setAdvanceData(data);
        setShowAdvancePopup(true);
      }
    } catch (err) {
      console.error("Advance fetch error:", err);
    }
  };





    const handleEdit = (id) => {
      const item = gridData.find((row) => row.id === id);
      if (item) {
        setForm(item);
        setMode("new");
        setGridData(gridData.filter((row) => row.id !== id));
      }
    };

    const handleDelete = (id) => {
      setGridData(gridData.filter((row) => row.id !== id));
    };
    
    

  const handleSave = () => {
    if (gridData.length === 0) {
      showAlert("error", "No Data", "Nothing to save");
      return;
    }

    const hasInvalidPaid = gridData.some(
    (row) => Number(row.paidAmount) <= 0 && !isAdvanceMode
  );

    if (hasInvalidPaid) {
      showAlert(
        "error",
        "Invalid Amount",
        "Paid amount must be greater than zero"
      );
      return;
    }

    showAlert(
      "question",
      "Confirm Save",
      "Do you want to save this payment?",
      async () => {
        closeAlert();          
        await savePaymentSetoff();
      }
    );
  };




  const savePaymentSetoff = async () => {
    setIsSaving(true);

    try {
      const res = await fetch("http://localhost:5000/api/paysetoff/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
    gridData,
    selectedAdvanceId,
    payment_date: new Date(),
    user_login: localStorage.getItem("username"),
  }),

      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showAlert(
        "success",
        "Saved",
        `Payment setoff details saved under "${data.payment_id}" successfully`
      );

      setGridData([]);
      setMode("view");

    } catch (err) {
      showAlert("error", "Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };


    
    return (
      <div className="payment-setoff-container">
        <Menu />
        <div className="payment-setoff-content">
          <Namewithdateacc/>
          <h1 className="title">Payment Setoff</h1>

          
          <div className="type-selector">
            <label className="label-bold">Select Type: </label>
            
    <select
    value={type}
    onChange={handleTypeChange}
    className="input-field"
    disabled={mode === "view" || typeLocked} 
  >
    <option value="select">-- Select Type --</option>
    <option value="customer">Customer</option>
    <option value="supplier">Supplier</option>
    <option value="advancepay">Advance Payment</option>
  </select>



          </div>

          {/* Form */}
          <div className="form-grid">
            <div className="form-column">
              <label>
                {currentType  === "customer"
                  ? "Invoice Number"
                  : currentType  === "supplier"
                  ? "GRN Number"
                  : "Advance Pay ID"}
              </label>

              <input
    name="invoiceNumber"
    value={form.invoiceNumber}
    className="input-field"
    readOnly
    onClick={() => {
      setSearch("");
      setType(currentType  === "customer" ? "customer" : "supplier"); 
      fetchPopupData();
      setShowCustomerPopup(true); 
    }}
  />



              <label>
                {currentType  === "customer"
                  ? "Customer Code"
                  : currentType  === "supplier"
                  ? "Supplier Code"
                  : "Party Code"}
              </label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className="input-field"
                readOnly
              />

              <label>
                {currentType  === "customer"
                  ? "Customer Name"
                  : currentType  === "supplier"
                  ? "Supplier Name"
                  : "Party Name"}
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                readOnly
              />

              <label>Manual Bill Number</label>
              <input
                name="manualBillNo"
                value={form.manualBillNo}
                onChange={handleChange}
                className="input-field"
                readOnly
              />
            </div>

            <div className="form-column">
              <label>To be pay Amount</label>
              <input
                name="totalCredit"
                value={form.totalCredit}
                onChange={handleChange}
                className="input-field"
                readOnly
              />

              <label>Paid Amount</label>
              <input
    type="number"
    name="paidAmount"
    value={form.paidAmount || ""}
    min="0"
    step="0.01"
    onChange={handleChange}
    className="input-field"
    readOnly={type !== "advancepay" && mode !== "new"} 
  />

              <label>Advance Payment</label>
              <input
                name="advancePayment"
                value={form.advancePayment}
                onChange={handleChange}
                className="input-field"
                readOnly
              />

              <label>Balance Amount</label>
              <input
                name="balanceAmount"
                value={form.balanceAmount}
                onChange={handleChange}
                className="input-field"
                readOnly
              />
            </div>
          </div>

          {/* Popup */}
          {(showPopup || showCustomerPopup) && (
    <div className="popup-overlay">
      <div className="popup-window">
        <h3>
          {currentType  === "customer"
            ? "Pending Customer Payments"
            : currentType  === "supplier"
            ? "Pending Supplier Payments"
            : "Advance Payments"}
        </h3>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />

        <table className="data-grid">
          <thead>
            <tr>
              <th>
                {currentType  === "advancepay"
                  ? "Advance Pay ID"
                  : currentType  === "customer"
                  ? "Invoice No"
                  : "GRN No"}
              </th>
              <th>{currentType  === "advancepay" ? "Party Code" : currentType  === "customer" ? "Customer Code" : "Supplier Code"}</th>
              <th>{currentType  === "advancepay" ? "Party Name" : currentType  === "customer" ? "Customer Name" : "Supplier Name"}</th>
              <th>
                {currentType  === "advancepay"
                  ? "Setoff Date"
                  : "Pending Amount"}
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length > 0 ? (
              filteredData
                .filter((row) =>
                  Object.values(row).some((val) =>
                    String(val ?? "")
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                )
                .map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() =>
                      currentType  === "advancepay"
                        ? handleSelectAdvance(row)
                        : handleSelectCustomerSupplier(row)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      {currentType  === "advancepay"
                        ? row.advance_pay_id
                        : type === "customer"
                        ? row.invoice_no
                        : row.invoice_no}
                    </td>
                    <td>{row.party_code}</td>
                    <td>{row.party_name}</td>
                    <td>
                      {currentType  === "advancepay"
                        ? row.advance_payment_amount
                        : row.balance_payment}
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          className="btn btn-exit"
          onClick={() =>
            currentType  === "advancepay"
              ? setShowPopup(false)
              : setShowCustomerPopup(false)
          }
        >
          Close
        </button>
      </div>
    </div>
  )}


          {showAdvancePopup && (
    <div className="popup-overlay">
      <div className="popup-window">
        <h3>Pending Advance Payments</h3>
        <table className="data-grid">
          <thead>
    <tr>
      <th>Advance Pay ID</th>
      <th>Party Code</th>
      <th>Party Name</th>
      <th>Advance Amount</th>
      <th>Setoff Date</th>
    </tr>
  </thead>

          <tbody>
            {advanceData.length > 0 ? (
              advanceData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleSelectAdvance(row)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.advance_pay_id}</td>
                  <td>{row.party_code}</td>
                  <td>{row.party_name}</td>
                  <td>{Number(row.advance_payment_amount).toFixed(2)}</td>
                  <td>{row.setoff_date }</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No pending advance payments
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <button
          className="btn btn-exit"
          onClick={() => setShowAdvancePopup(false)}
        >
          Close
        </button>
      </div>
    </div>
  )}



          {/* Buttons */}
          <div className="button-group">
            {mode === "view" && (
              <>
                <button className="btn btn-new" onClick={handleNew}>
                  New
                </button>
                <button className="btn btn-exit">Exit</button>
              </>
            )}

            {mode === "new" && (
    <button className="btn btn-add" onClick={handleAdd}>
      Add
    </button>
  )}

  

    <button className="btn btn-clear" onClick={handleNew}>
      Clear
    </button>

  

  {mode === "new" && type !== "advancepay" && (
    <>
    
    </>
  )}
          </div>

          {/* Grid */}
          <table className="data-grid">
    <thead>
      <tr>
        <th>
          {currentType  === "customer"
            ? "Invoice No"
            : currentType  === "supplier"
            ? "GRN No"
            : "Advance pay ID"}
        </th>
        <th>
          {currentType  === "customer"
            ? "Customer Code"
            : currentType  === "supplier"
            ? "Supplier Code"
            : "Party Code"}
        </th>
        <th>
          {currentType  === "customer"
            ? "Customer"
            : currentType  === "supplier"
            ? "Supplier"
            : "Party"}
        </th>
        <th>Manual Bill No</th>
        <th>Paid</th>
        <th>Advance Pay</th>
        <th>Balance</th>
        {!isAdvanceMode && <th>Advance Pay ID</th>}
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {gridData.map((row) => (
        <tr key={row.id}>
          <td>{row.invoiceNumber}</td>
          <td>{row.code}</td>
          <td>{row.name}</td>
          <td>{row.manualBillNo}</td>
          <td>{row.paidAmount}</td>
          <td>{row.advancePayment}</td>
          <td>{row.balanceAmount}</td>
          {!isAdvanceMode && <td>{row.advancePayId || "-"}</td>}
          <td>{row.status}</td>
          <td className="action-buttons">
            <button
              className="btn btn-edit"
              onClick={() => handleEdit(row.id)}
            >
              Edit
            </button>
            <button
              className="btn btn-delete"
              onClick={() => handleDelete(row.id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>


          {gridData.length > 0 && (
            <button
      className="btn btn-save"
      onClick={handleSave}
      disabled={gridData.length === 0 || isSaving}
    >
            {isAdvanceMode ? "Set Off" : "Save"}
            </button>
          )}

          <div className="button-group">
            <button className="btn btn-print">Print</button>
            <button className="btn btn-view">View</button>
          </div>

        {/* Custom Alert Box */}
      <AlertBox
    show={alertConfig.show}
    type={alertConfig.type}
    title={alertConfig.title}
    message={alertConfig.message}
    onClose={closeAlert}
    onConfirm={alertConfig.onConfirm}   
  />


        </div>
      </div>
    );
  }
