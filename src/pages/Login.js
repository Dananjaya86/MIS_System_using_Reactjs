import React, { useState, useContext } from "react";
import "./login.css";
import "./alert.css";
import { useNavigate } from "react-router-dom";
import loginimage from "../img/login.png";
import { AppContext } from "../componants/AppContext";
import { LogIn, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { allowFullAccess } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alertData, setAlertData] = useState(null);

  const showAlert = (type, message, detail) => {
    setAlertData({ type, message, detail });
    setTimeout(() => setAlertData(null), 3000);
  };

  const handleLogin = async () => {
  if (!username || !password) {
    showAlert("error", "Please fill in all fields", "Both username and password are required.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      // permissions returned by backend
      const permissions = data.permissions || {};
      allowFullAccess(permissions);

      showAlert("success", "Login Successful!", `Welcome back, ${data.username}`);
      setTimeout(() => navigate("/Dashboard"), 1000);
    } else {
      showAlert("warning", "Login Failed!", data.message);
    }
  } catch (err) {
    showAlert("error", "Server Error", "Unable to connect. Try again later.");
  }
};

  const handleCancel = () => {
    setUsername("");
    setPassword("");
  };

  const renderAlert = () => {
    if (!alertData) return null;

    const icons = {
      success: <CheckCircle size={48} color="white" />,
      warning: <AlertTriangle size={48} color="white" />,
      error: <XCircle size={48} color="white" />,
    };

    return (
      <div className={`alert-overlay`}>
        <div className={`alert-container alert-${alertData.type}`}>
          <div className="alert-gradient"></div>
          <div className="alert-content">
            <div className="alert-icon-wrapper">
              <div className="alert-icon-container">
                <div className="alert-icon-ping"></div>
                <div className="alert-icon-bg">{icons[alertData.type]}</div>
              </div>
            </div>

            <h3 className="alert-title">{alertData.message}</h3>
            <p className="alert-message">{alertData.detail}</p>

            {alertData.type === "success" && (
              <>
                <p className="alert-detail">Redirecting to your dashboard...</p>
                <div className="progress-container">
                  <div className="progress-bar"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={loginimage} alt="login" />
        <h2>Welcome to Login Page!</h2>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="login-buttons">
          <button className="btn btn-login" onClick={handleLogin}>
            <LogIn size={18} style={{ marginRight: 6 }} />
            Login
          </button>
          <button className="btn btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
      {renderAlert()}
    </div>
  );
}
