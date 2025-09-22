// src/componants/ProtectedRoute.js
import { useContext } from "react";
import { AppContext } from "./AppContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ page, children }) {
  const { allowedPages } = useContext(AppContext);

  if (!allowedPages[page]) {
    alert("You cannot access this page directly!");
    return <Navigate to="/" replace />;
  }

  return children;
}
