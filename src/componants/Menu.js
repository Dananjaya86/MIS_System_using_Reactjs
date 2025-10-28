import React from 'react';
import { NavLink } from 'react-router-dom';
import './menubar.css';

export default function Menu() {

  // List of menu items with icons
  const menuItems = [
    { name: "Customer Details", path: "/CustomerDetails", icon: "👥" },
    { name: "Supplier Details", path: "/SupplierDetails", icon: "🏭" },
    { name: "Product Details", path: "/ProductDetails", icon: "📦" },
    { name: "Production", path: "/Production", icon: "⚙️" },
    { name: "GRN", path: "/GRN", icon: "📋" },
    { name: "Sales", path: "/Sales", icon: "💰" },
    { name: "Advance Payment", path: "/AdvancePayment", icon: "💳" },
    { name: "Material Order", path: "/MeterialOrder", icon: "🛒" },
    { name: "Goods Dispatch Note", path: "/GoodsDispatchNote", icon: "🚚" },
    { name: "Stock Control", path: "/StockControl", icon: "📊" },
    { name: "Payment Setoff", path: "/PaymentSetoff", icon: "💸" },
    { name: "Expenses", path: "/Expenses", icon: "📉" },
    { name: "Bank", path: "/Bank", icon: "🏦" },
    { name: "Return", path: "/Return", icon: "↩️" },
    { name: "Reports", path: "/Reports", icon: "📈" },
    { name: "Admin", path: "/Admin", icon: "⚡" },
    { name: "Issue Bill Book", path: "/IssueBillBook", icon: "📓" },
    { name: "Logout", path: "/", icon: "🚪" }
  ];

  return (
    <div className="sidebar">
      <h2>
        <NavLink 
          to="/Dashboard" 
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="menu-icon">📊</span>
          Dashboard
        </NavLink>
      </h2>

      <ul>
        {menuItems.map((item) => (
          <li key={item.name} id={item.name === "Logout" ? "logout" : undefined}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.name}
            </NavLink>
          </li>
        ))}
        <p>Version 1.1.0.1</p>
      </ul>
    </div>
  );
}