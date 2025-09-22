// src/componants/Menu.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './menubar.css';

export default function Menu() {

  // List of menu items
  const menuItems = [
    
    { name: "Customer Details", path: "/CustomerDetails" },
    { name: "Supplier Details", path: "/SupplierDetails" },
    { name: "Product Details", path: "/ProductDetails" },
    { name: "Production", path: "/Production" },
    { name: "GRN", path: "/GRN" },
    { name: "Sales", path: "/Sales" },
    { name: "Advance Payment", path: "/AdvancePayment" },
    { name: "Material Order", path: "/MeterialOrder" },
    { name: "Goods Dispatch Note", path: "/GoodsDispatchNote" },
    { name: "Stock Control", path: "/StockControl" },
    { name: "Payment Setoff", path: "/PaymentSetoff" },
    { name: "Expenses", path: "/Expenses" },
    { name: "Bank", path: "/Bank" },
    { name: "Return", path: "/Return" },
    { name: "Reports", path: "/Reports" },
    { name: "Admin", path: "/Admin" },
    { name: "Logout", path: "/" }
  ];

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
        {menuItems.map((item) => (
          <li key={item.name} id={item.name === "Logout" ? "logout" : undefined}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.name}
            </NavLink>
          </li>
        ))}
        <p>Version 1.1.0.1</p>
      </ul>
    </div>
  );
}
