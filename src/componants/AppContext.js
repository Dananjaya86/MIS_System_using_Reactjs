
import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [allowedPages, setAllowedPages] = useState({});

  const allowFullAccess = () => {
    const pages = [
      "Dashboard",
      "CustomerDetails",
      "SupplierDetails",
      "ProductDetails",
      "Production",
      "GRN",
      "Sales",
      "AdvancePayment",
      "MeterialOrder",
      "GoodsDispatchNote",
      "StockControl",
      "PaymentSetoff",
      "Expenses",
      "Bank",
      "Return",
      "Reports",
      "IssueBillBook",
      "Admin"
    ];
    const access = {};
    pages.forEach((p) => (access[p] = true));
    setAllowedPages(access);
  };

  const resetPage = (page) => {
    setAllowedPages((prev) => ({ ...prev, [page]: false }));
  };

  return (
    <AppContext.Provider value={{ allowedPages, allowFullAccess, resetPage }}>
      {children}
    </AppContext.Provider>
  );
}
