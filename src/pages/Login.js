import React, { useState, useContext } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import loginimage from "../img/login.png";
import { AppContext } from "../componants/AppContext";

export default function Login() {
  const navigate = useNavigate();
  const { allowFullAccess } = useContext(AppContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter both username and password!");
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
        allowFullAccess();
        alert(`✅ Login successful! Welcome ${data.username}`);
        navigate("/Dashboard");
      } else {
        alert(`❌ ${data.message || "Invalid username or password"}`);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Please try again later.");
    }
  };

  const handleCancel = () => {
    setUsername("");
    setPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={loginimage} alt="login" />
        <h2>Welcome to Login Page!</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="login-buttons">
          <button className="btn btn-login" onClick={handleLogin}>
            Login
          </button>
          <button className="btn btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
