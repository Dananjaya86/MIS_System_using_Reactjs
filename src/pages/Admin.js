import React, { useState, useEffect } from "react";
import Menu from "../componants/Menu";
import AlertBox from "../componants/Alertboxre";
import "./admin.css";
import Budget from "./Budget";


export default function Admin() {
  const [form, setForm] = useState({
    employeeNo: "",
    idNo: "",
    firstName: "",
    lastName: "",
    callingName: "",
    address: "",
    phoneNumber: "",
    gender: "",
    birthday: "",
    position: "",
    username: "",
    password: "",
    confirmPassword: "",
    permissions: {},
  });

  const [gridData, setGridData] = useState([]);
  const [isNewMode, setIsNewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isGeneratingEmpNo, setIsGeneratingEmpNo] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [date, setDate] = useState("");
  const [username, setUsername] = useState("");

  const [showBudget, setShowBudget] = useState(false);

 const [alertBox, setAlertBox] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null
});





  const PERMISSIONS = [
    "Customer Details", "Supplier Details", "Product Details", "Production",
    "GRN", "Sale", "Advance Payment", "Material Order",
    "Goods Dispatch Note", "Stock Control", "Payment Setoff",
    "Expenses", "Bank", "Return", "Reports",
  ];

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "Guest");
    const today = new Date();
    setDate(today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
    fetchAdmins();
  }, []);


const showAlert = (
    type,
    title,
    message,
    onConfirm = null
) => {

    setAlertBox({
        show: true,
        type,
        title,
        message,
        onConfirm
    });

};


const closeAlert = () => {

    setAlertBox(prev => ({
        ...prev,
        show: false,
        onConfirm: null
    }));

};


  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchAdmins = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/", { headers: getAuthHeaders() });
      const data = await res.json();
      setGridData(Array.isArray(data) ? data.map(d => ({ ...d, permissions: d.permissions || {} })) : []);
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  const checkUsernameExists = async (username) => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/", { headers: getAuthHeaders() });
      const data = await res.json();
      const exists = data.some(u => u.username.toLowerCase() === username.toLowerCase());
      return exists;
    } catch (err) {
      console.error("Error checking username:", err);
      return false;
    }
  };

  const handleChange = async (e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;

    if (name === "username" && value.trim()) {

    const exists =
        await checkUsernameExists(
            value.trim()
        );

    if (exists) {

        showAlert(
            "warning",
            "Username Already Exists",
            "This username already exists. Please choose another username."
        );

        setForm(prev => ({
            ...prev,
            username: ""
        }));

        return;
    }
}






    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "lastName" && value.trim() && isNewMode) {
      setIsGeneratingEmpNo(true);
      fetch(`http://localhost:5000/api/admin/generate/${value}`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.employeeNo) setForm(prev => ({ ...prev, employeeNo: data.employeeNo }));
        })
        .catch(err => console.error("Error generating empNo:", err))
        .finally(() => setIsGeneratingEmpNo(false));
    }
  };



   // ============================================================
// RESET PASSWORD
// ============================================================

const [showResetModal, setShowResetModal] = useState(false);
const [resetPassword, setResetPassword] = useState("");
const [showResetPassword, setShowResetPassword] = useState(false);

const handleResetPassword = () => {
  if (!form.employeeNo) {
    showAlert(
      "warning",
      "Employee Not Selected",
      "Please select an employee first."
    );
    return;
  }

  // Clear old password
  setResetPassword("");
  setShowResetPassword(false);

  // Open reset password popup
  setShowResetModal(true);
};


// ============================================================
// CONFIRM RESET PASSWORD
// ============================================================

const handleConfirmResetPassword = async () => {
  if (!resetPassword) {
    showAlert(
      "warning",
      "Password Required",
      "Please enter a new password."
    );
    return;
  }

  if (resetPassword.length < 6) {
    showAlert(
      "warning",
      "Invalid Password",
      "Password must contain at least 6 characters."
    );
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showAlert(
        "error",
        "Authentication Error",
        "Your login session has expired. Please login again."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/admin/reset-password/${form.employeeNo}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: resetPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Password reset failed."
      );
    }

    // Close modal
    setResetPassword("");
    setShowResetPassword(false);
    setShowResetModal(false);

    showAlert(
      "success",
      "Password Reset Successful",
      `Password for Employee ${form.employeeNo} has been reset successfully.`
    );

  } catch (error) {
    console.error("Reset password error:", error);

    showAlert(
      "error",
      "Reset Password Failed",
      error.message || "Unable to reset password."
    );
  }
};



  const handlePermissionChange = (perm) => {
    if (isReadOnly) return;
    setForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] },
    }));
  };

  const resetForm = () => {
    setForm({
      employeeNo: "",
      idNo: "",
      firstName: "",
      lastName: "",
      callingName: "",
      address: "",
      phoneNumber: "",
      gender: "",
      birthday: "",
      position: "",
      username: "",
      password: "",
      confirmPassword: "",
      permissions: {},
    });
  };

  const handleNew = () => {
    setIsNewMode(true);
    setIsEditMode(false);
    setIsReadOnly(false);
    setShowCredentials(true);
    resetForm();
  };

  const handleExit = () => {
    resetForm();
    setIsNewMode(false);
    setIsEditMode(false);
    setIsReadOnly(true);
    setShowCredentials(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.lastName.trim()) {

    showAlert(
        "warning",
        "Last Name Required",
        "Please enter the last name to generate the Employee Number."
    );

    return;
}


if (!form.employeeNo) {

    showAlert(
        "warning",
        "Employee Number Missing",
        "Please enter the last name again to generate the Employee Number."
    );

    return;
}


if (
    !form.username.trim() ||
    !form.password.trim()
) {

    showAlert(
        "warning",
        "Login Details Required",
        "Username and password are required."
    );

    return;
}


if (
    form.password !==
    form.confirmPassword
) {

    showAlert(
        "error",
        "Password Mismatch",
        "Password and Confirm Password do not match."
    );

    return;
}

    const body = { ...form, login_user: username };

    try {
      const res = await fetch("http://localhost:5000/api/admin/add", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {

    showAlert(
        "error",
        "Add Failed",
        data.error ||
        "Failed to add admin."
    );

    return;
}

      showAlert(
    "success",
    "Admin Added Successfully",
    `Employee Number: ${data.employeeNo}`
);
      await fetchAdmins();
      handleExit();
    } catch (err) {
      console.error("Add failed:", err);
      showAlert(
    "error",
    "Add Failed",
    "Failed to add the administrator. Please check the server or try again."
);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.employeeNo) {

    showAlert(
        "warning",
        "Employee Not Selected",
        "Please select an employee from the table first."
    );

    return;
}


if (
    form.password !==
    form.confirmPassword
) {

    showAlert(
        "error",
        "Password Mismatch",
        "Password and Confirm Password do not match."
    );

    return;
}

    const body = { ...form, login_user: username };
    if (!form.password) delete body.password;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/update/${form.employeeNo}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {

    showAlert(
        "error",
        "Update Failed",
        data.error ||
        "Update failed."
    );

    return;
}

      showAlert(
    "success",
    "Update Successful",
    data.message
);
      await fetchAdmins();
      handleExit();
    } catch (err) {
      console.error("Edit failed:", err);
      showAlert(
    "error",
    "Update Failed",
    "Update failed. Please check the console or try again."
);
    }
  };

  const handleDelete = async () => {

    if (!form.employeeNo) {

        showAlert(
            "warning",
            "Employee Not Selected",
            "Please select an employee first."
        );

        return;
    }


    showAlert(
        "question",
        "Delete Employee?",
        `Are you sure you want to delete Employee ${form.employeeNo}?`,
        async () => {

            try {

                const res =
                    await fetch(
                        `http://localhost:5000/api/admin/delete/${form.employeeNo}`,
                        {
                            method: "PUT",
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                                login_user:
                                    username
                            })
                        }
                    );


                const data =
                    await res.json();


                if (!res.ok) {

                    showAlert(
                        "error",
                        "Delete Failed",
                        data.error ||
                        "Unable to delete the employee."
                    );

                    return;
                }


                showAlert(
                    "success",
                    "Employee Deleted",
                    data.message ||
                    "Employee deleted successfully."
                );


                await fetchAdmins();

                handleExit();


            } catch (err) {

                console.error(
                    "Delete failed:",
                    err
                );


                showAlert(
                    "error",
                    "Delete Failed",
                    "Failed to delete the employee. Please try again."
                );

            }

        }
    );

};

  const handleRowClick = (row) => {
    setForm({
      employeeNo: row.employeeNo || "",
      idNo: row.idNo || "",
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      callingName: row.callingName || "",
      address: row.address || "",
      phoneNumber: row.phoneNumber || "",
      gender: row.gender || "",
      birthday: row.birthday ? row.birthday.split("T")[0] : "",
      position: row.position || "",
      username: row.username || "",
      password: "",
      confirmPassword: "",
      permissions: row.permissions || {},
    });

    setIsNewMode(false);
    setIsEditMode(true);
    setIsReadOnly(false);
    setShowCredentials(false);
  };

  const filteredData = gridData.filter(row =>
    Object.values(row).some(val =>
      (val?.toString() || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const indexOfLastRow = currentPage * rowsPerPage;
  const currentRows = filteredData.slice(indexOfLastRow - rowsPerPage, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="admin-containerad">
      <Menu />

      <div className="dashboard-headerad">
        <span className="dashboard-usernamead">👤 {username}</span>
        <span className="dashboard-datead">📅 {date}</span>
      </div>

      <div className="admin-contentad">
        <h1 className="titlead">Admin Panel</h1>

        
        <form onSubmit={isNewMode ? handleAdd : handleEdit} className="form-boxad">
          <div className="form-grid-two-columnad">
            
            <div className="left-boxad">
              <div className="left-inner-gridad">
                {[
                  { label: "Employee Number", name: "employeeNo" },
                  { label: "ID Number", name: "idNo" },
                  { label: "First Name", name: "firstName" },
                  { label: "Last Name", name: "lastName" },
                  { label: "Calling Name", name: "callingName" },
                  { label: "Address", name: "address" },
                  { label: "Phone", name: "phoneNumber" },
                  { label: "Gender", name: "gender", type: "select" },
                  { label: "Birthday", name: "birthday", type: "date" },
                  { label: "Position", name: "position" },
                ].map(field => (
                  <div key={field.name} className="form-itemad form-itemadm">
                    <label className="labelad">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="input-fieldad input-fieldadm"
                        disabled={isReadOnly}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        className="input-fieldad input-fieldadm"
                        readOnly={isReadOnly || field.name === "employeeNo"}
                      />
                    )}
                  </div>
                ))}

                {showCredentials && (
                  <>
                    <div className="form-itemad form-itemadm">
                      <label className="labelad">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        className="input-fieldad input-fieldadm"
                        readOnly={isReadOnly}
                      />
                    </div>

                    <div className="form-itemad form-itemadm">
                      <label className="labelad">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="input-fieldad input-fieldadm"
                        readOnly={isReadOnly}
                      />
                    </div>

                    <div className="form-itemad form-itemadm">
                      <label className="labelad">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="input-fieldad input-fieldadm"
                        readOnly={isReadOnly}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            
            <div className="right-boxad small-rightad">
              <label className="permission-titlead">Permissions</label>
              <div className="permission-gridad small-permission-gridad">
                {PERMISSIONS.map(perm => (
                  <div
                    key={perm}
                    className={`checkbox-itemad ${form.permissions[perm] ? "checkedad" : ""}`}
                  >
                    <label className="checkbox-labelad">{perm}</label>
                    <input
                      type="checkbox"
                      checked={!!form.permissions[perm]}
                      onChange={() => handlePermissionChange(perm)}
                      disabled={isReadOnly}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          
          <div className="button-groupad">
            {!isNewMode && !isEditMode && (
              <>
                <button type="button" className="btnad btn-newad" onClick={handleNew}>New</button>
                <button type="button" className="btnad btn-exitad" onClick={handleExit}>Exit</button>
              </>
            )}

            {isNewMode && (
              <>
                <button
                  type="submit"
                  className="btnad btn-addad"
                  disabled={!form.employeeNo || isGeneratingEmpNo}
                >
                  Add
                </button>
                {isGeneratingEmpNo && form.lastName && (
                  <span style={{ color: "red", marginLeft: "10px" }}>Generating employeeNo...</span>
                )}
                <button type="button" className="btnad btn-clearad" onClick={resetForm}>Clear</button>
                <button type="button" className="btnad btn-exitad" onClick={handleExit}>Exit</button>
              </>
            )}

            {isEditMode && (
              <>
                <button type="submit" className="btnad btn-editad">Save Changes</button>
                <button type="button" className="btnad btn-deletead" onClick={handleDelete}>Delete</button>
                <button type="button" className="btnad btn-clearad" onClick={resetForm}>Clear</button>
                <button type="button" className="btnad btn-exitad" onClick={handleExit}>Exit</button>
                <button type="button" onClick={handleResetPassword} style={{
      backgroundColor: "#f59e0b",
      color: "white",
      border: "none",
      padding: "10px 18px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    Reset Password
  </button>
              </>
            )}
          </div>
        </form>

{showResetModal && (
  <div className="reset-modal-overlay">

    <div className="reset-modal">

      {/* HEADER */}
      <div className="reset-modal-header">

        <div className="reset-modal-icon">
          🔐
        </div>

        <div className="reset-modal-title">
          <h2>Reset Password</h2>
          <p>Update employee login password</p>
        </div>

        <button
          type="button"
          className="reset-close-btn"
          onClick={() => setShowResetModal(false)}
        >
          ×
        </button>

      </div>


      {/* EMPLOYEE */}
      <div className="reset-employee-card">

        <div className="reset-user-icon">
          👤
        </div>

        <div>
          <span>Employee Number</span>
          <strong>{form.employeeNo}</strong>
        </div>

      </div>


      {/* PASSWORD */}
      <div className="reset-password-section">

        <label>New Password</label>

        <div className="reset-password-wrapper">

          <input
            type={showResetPassword ? "text" : "password"}
            value={resetPassword}
            onChange={(e) =>
              setResetPassword(e.target.value)
            }
            placeholder="Enter new password"
            autoFocus
          />

          <button
            type="button"
            className="reset-eye-btn"
            onClick={() =>
              setShowResetPassword(!showResetPassword)
            }
          >
            {showResetPassword ? "🙈" : "👁️"}
          </button>

        </div>

        <div className="reset-password-hint">
          Password must contain at least 6 characters.
        </div>

      </div>


      {/* BUTTONS */}
      <div className="reset-modal-buttons">

        <button
          type="button"
          className="reset-cancel-btn"
          onClick={() => {
            setResetPassword("");
            setShowResetModal(false);
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          className="reset-confirm-btn"
          onClick={handleConfirmResetPassword}
        >
          🔐 Reset Password
        </button>

      </div>

    </div>

  </div>
)}
        

        
        <div className="search-paginationad">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="search-boxad"
          />
          <button
    className="btnbudget"
    onClick={() => setShowBudget(true)}
>
    Budget
</button>
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="rows-selectad"
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>

        
        <table className="data-gridad">
          <thead>
            <tr>
              <th>Emp No</th>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>Birthday</th>
              <th>Position</th>
              <th>Username</th>
              <th>Permissions</th>
              <th>Login User</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map(row => (
              <tr key={row.employeeNo} onClick={() => handleRowClick(row)}>
                <td>{row.employeeNo}</td>
                <td>{row.idNo}</td>
                <td>{row.firstName}</td>
                <td>{row.lastName}</td>
                <td>{row.phoneNumber}</td>
                <td>{row.gender}</td>
                <td>{row.birthday ? new Date(row.birthday).toLocaleDateString() : ""}</td>
                <td>{row.position}</td>
                <td>{row.username}</td>
                <td>{Object.keys(row.permissions || {}).filter(p => row.permissions[p]).join(", ")}</td>
                <td>{row.login_user || ""}</td>
                <td>{row.date ? new Date(row.date).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        
        <div className="paginationad">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`page-btnad ${currentPage === i + 1 ? "activead" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {showBudget && (
          <Budget
            onClose={() => setShowBudget(false)}
          />
        )}

         <AlertBox
    show={alertBox.show}
    type={alertBox.type}
    title={alertBox.title}
    message={alertBox.message}
    onClose={closeAlert}
    onConfirm={alertBox.onConfirm}
/>

      </div>
    </div>
  );
}
