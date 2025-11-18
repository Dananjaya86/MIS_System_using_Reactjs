import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "./AppContext";

export default function ProtectedRoute({ page, children }) {
  const { allowedPages } = useContext(AppContext);

  if (!allowedPages) {
    // Permissions not yet loaded
    return <div>Loading …</div>;
  }

  // Dashboard always allowed
  if (page === "Dashboard") {
    return children;
  }

  const key = page.replace(/\s+/g, "");
  if (!allowedPages[key]) {
    return <Navigate to="/Dashboard" replace />;
  }

  return children;
}
