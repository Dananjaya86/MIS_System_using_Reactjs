// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import './login.css';
import { useNavigate } from 'react-router-dom';
import loginimage from "../img/login.png";
import { AppContext } from '../componants/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { allowFullAccess } = useContext(AppContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      alert("Please enter both username and password!");
      return;
    }

    if (username === "dananjaya" && password === "123*") {
      allowFullAccess();
      alert("Login successful! Welcome to Dashboard...");
      navigate("/Dashboard");
    } else {
      alert("Invalid username or password!");
    }
  };

  const handleCancel = () => {
    setUsername('');
    setPassword('');
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
          <button className="btn btn-login" onClick={handleLogin}>Login</button>
          <button className="btn btn-cancel" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
