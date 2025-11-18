import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [allowedPages, setAllowedPages] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) setAllowedPages(JSON.parse(stored));
  }, []);

  const allowFullAccess = (permissions) => {
    setAllowedPages(permissions);
    localStorage.setItem("permissions", JSON.stringify(permissions));
  };

  return (
    <AppContext.Provider value={{ allowedPages, allowFullAccess }}>
      {children}
    </AppContext.Provider>
  );
}
