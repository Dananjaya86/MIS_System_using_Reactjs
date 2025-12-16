import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "./AppContext";
import "./menubar.css";

export default function Menu() {
  const { allowedPages } = useContext(AppContext);

  if (!allowedPages) return <div className="sidebar"><p>Loading menu…</p></div>;

  const menuItems = [
    { label: "Dashboard", path: "/Dashboard", icon: "📊", always: true },
    { label: "Customer Details", path: "/CustomerDetails", icon: "👥" },
    { label: "Supplier Details", path: "/SupplierDetails", icon: "🏭" },
    { label: "Product Details", path: "/ProductDetails", icon: "📦" },
    { label: "Production", path: "/Production", icon: "⚙️" },
    { label: "GRN", path: "/GRN", icon: "📋" },
    { label: "Sales", path: "/Sales", icon: "💰" },
    { label: "Advance Payment", path: "/AdvancePayment", icon: "💳" },
    { label: "Meterial Order", path: "/MeterialOrder", icon: "🛒" },
    { label: "Goods Dispatch Note", path: "/GoodsDispatchNote", icon: "🚚" },
    { label: "Stock Control", path: "/StockControl", icon: "📊" },
    { label: "Payment Setoff", path: "/PaymentSetoff", icon: "💸" },
    { label: "Expenses", path: "/Expenses", icon: "📉" },
    { label: "Bank", path: "/Bank", icon: "🏦" },
    { label: "Return", path: "/Return", icon: "↩️" },
    { label: "Reports", path: "/Reports", icon: "📈" },
    { label: "Admin", path: "/Admin", icon: "⚡" },
    { label: "IssueBillBook", path: "/IssueBillBook", icon: "📔" },
    { label: "Logout", path: "/", icon: "🚪", always: true }
  ];

  const keyFromLabel = (label) => label.replace(/\s+/g, "");

  return (
    <div className="sidebar">
      <ul>
        {menuItems.map(item => {
          if (!item.always && !allowedPages[keyFromLabel(item.label)]) return null;
          return (
            <li key={item.label}>
              <NavLink to={item.path}>
                <span className="menu-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          );
        })}
        <p>Version 1.1.0.1</p>
      </ul>
    </div>
  );
}
