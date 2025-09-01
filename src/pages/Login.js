import React from 'react'
import './login.css'
import { useNavigate } from 'react-router-dom';
import loginimage from "../img/login.png"


export default function Login() {

const navigate = useNavigate();

  function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "" || password === "") {
      alert("Please enter both username and password!");
      return;
    }

    alert("Login successful! Welcome to Dashboard...");
    navigate("/dashboard");  
  }

  function cancel() {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
  }


  return (
    <div className="login-page">
    <div className="login-card">
      <img src={loginimage} alt="login image"></img>
      <h2>Welcome to Login Page!</h2>
      <input type="text" id="username" placeholder="Username" />
      <input type="password" id="password" placeholder="Password" />
      <div>
        <button className="btn btn-login" onClick={login}>Login</button>
        <button className="btn btn-cancel" onClick={cancel}>Cancel</button>
      </div>
    </div>
  </div>
  )
}
