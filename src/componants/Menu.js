import React from 'react';
import './menubar.css';
import { NavLink } from 'react-router-dom';


export default function Menu() {
  return (
    <div className="sidebar">
      <h2>
        <NavLink
          to="/Dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
      </h2>

      <ul>
        <li><NavLink to="/CustomerDetails" className={({ isActive }) => (isActive ? "active" : "")}>Customer Details</NavLink></li>
        <li><NavLink to="/SupplierDetails" className={({ isActive }) => (isActive ? "active" : "")}>Supplier Details</NavLink></li>
        <li><NavLink to="/ProductDetails" className={({ isActive }) => (isActive ? "active" : "")}>Product Details</NavLink></li>
        <li><NavLink to="/Production" className={({ isActive }) => (isActive ? "active" : "")}>Production</NavLink></li>
        <li><NavLink to="/GRN" className={({ isActive }) => (isActive ? "active" : "")}>GRN</NavLink></li>
        <li><NavLink to="/Sales" className={({ isActive }) => (isActive ? "active" : "")}>Sales</NavLink></li>
        <li><NavLink to="/AdvancePayment" className={({ isActive }) => (isActive ? "active" : "")}>Advance Payment</NavLink></li>
        <li><NavLink to="/MeterialOrder" className={({ isActive }) => (isActive ? "active" : "")}>Materal Order</NavLink></li>
        <li><NavLink to="/GoodsDispatchNote" className={({ isActive }) => (isActive ? "active" : "")}>Goods Dispatch Note</NavLink></li>
        <li><NavLink to="/StockControl" className={({ isActive }) => (isActive ? "active" : "")}>Stock Control</NavLink></li>
        <li><NavLink to="/PaymentSetoff" className={({ isActive }) => (isActive ? "active" : "")}>Payment Setoff</NavLink></li>
        <li><NavLink to="/Expenses" className={({ isActive }) => (isActive ? "active" : "")}>Expencess</NavLink></li>
        <li><NavLink to="/Bank" className={({ isActive }) => (isActive ? "active" : "")}>Bank</NavLink></li>
        <li><NavLink to="/Return" className={({ isActive }) => (isActive ? "active" : "")}>Return</NavLink></li>
        <li><NavLink to="/Reports" className={({ isActive }) => (isActive ? "active" : "")}>Reports</NavLink></li>
        <li><NavLink to="/Admin" className={({ isActive }) => (isActive ? "active" : "")}>Admin</NavLink></li>
        <li id="logout"><NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>Logout</NavLink></li>

        <p>Version 1.1.0.1</p>
      </ul>
    </div>
  );
}
