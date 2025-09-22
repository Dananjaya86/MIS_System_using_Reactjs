import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { AppProvider } from './componants/AppContext';
import ProtectedRoute from './componants/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerDetails from './pages/CustomerDetails';
import SupplierDetails from './pages/SupplierDetails';
import ProductDetails from './pages/ProductDetails';
import Production from './pages/Production';
import GRN from './pages/GRN';
import Sales from './pages/Sales';
import AdvancePayment from './pages/AdvancePayment';
import MeterialOrder from './pages/MeterialOrder';
import GoodsDispatchNote from './pages/GoodsDispatchNote';
import StockControl from './pages/StockControl';
import PaymentSetoff from './pages/PaymentSetoff';
import Expenses from './pages/Expenses';
import Bank from './pages/Bank';
import ReturnPage from './pages/Return';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/Dashboard" element={<ProtectedRoute page="Dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/CustomerDetails" element={<ProtectedRoute page="CustomerDetails"><CustomerDetails /></ProtectedRoute>} />
          <Route path="/SupplierDetails" element={<ProtectedRoute page="SupplierDetails"><SupplierDetails /></ProtectedRoute>} />
          <Route path="/ProductDetails" element={<ProtectedRoute page="ProductDetails"><ProductDetails /></ProtectedRoute>} />
          <Route path="/Production" element={<ProtectedRoute page="Production"><Production /></ProtectedRoute>} />
          <Route path="/GRN" element={<ProtectedRoute page="GRN"><GRN /></ProtectedRoute>} />
          <Route path="/Sales" element={<ProtectedRoute page="Sales"><Sales /></ProtectedRoute>} />
          <Route path="/AdvancePayment" element={<ProtectedRoute page="AdvancePayment"><AdvancePayment /></ProtectedRoute>} />
          <Route path="/MeterialOrder" element={<ProtectedRoute page="MeterialOrder"><MeterialOrder /></ProtectedRoute>} />
          <Route path="/GoodsDispatchNote" element={<ProtectedRoute page="GoodsDispatchNote"><GoodsDispatchNote /></ProtectedRoute>} />
          <Route path="/StockControl" element={<ProtectedRoute page="StockControl"><StockControl /></ProtectedRoute>} />
          <Route path="/PaymentSetoff" element={<ProtectedRoute page="PaymentSetoff"><PaymentSetoff /></ProtectedRoute>} />
          <Route path="/Expenses" element={<ProtectedRoute page="Expenses"><Expenses /></ProtectedRoute>} />
          <Route path="/Bank" element={<ProtectedRoute page="Bank"><Bank /></ProtectedRoute>} />
          <Route path="/Return" element={<ProtectedRoute page="Return"><ReturnPage /></ProtectedRoute>} />
          

        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
