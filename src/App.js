
import './App.css';
import Dashboard from './pages/Dashboard';
import { BrowserRouter as Router,Route,Routes} from 'react-router-dom'
import CustomerDetails from './pages/CustomerDetails';
import SupplierDetails from './pages/SupplierDetails';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Production from './pages/Production';
import GRN from './pages/GRN'
import Sales from './pages/Sales'
import AdvancePayment from './pages/AdvancePayment'
import MeterialOrder from './pages/MeterialOrder'
import GoodsDispatchNote from './pages/GoodsDispatchNote';
import StockControl from './pages/StockControl';
import PaymentSetoff from './pages/PaymentSetoff';
import Expenses from './pages/Expenses';


function App() {
  return (
    <Router>
    <div>
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/CustomerDetails" element={<CustomerDetails />} />
        <Route path="/SupplierDetails" element={<SupplierDetails />} />
        <Route path="/ProductDetails" element={<ProductDetails />} />
        <Route path="/Production" element={<Production />} />
        <Route path="/GRN" element={<GRN/>} />
        <Route path="/Sales" element={<Sales/>} />
        <Route path="/AdvancePayment" element={<AdvancePayment/>} />
        <Route path="/MeterialOrder" element={<MeterialOrder/>} />
        <Route path="/GoodsDispatchNote" element={<GoodsDispatchNote/>} />
        <Route path="/StockControl" element={<StockControl/>} />
        <Route path="/PaymentSetoff" element={<PaymentSetoff/>}/>
        <Route path='Expenses' element={<Expenses/>} />
        
      </Routes>
    

    </div>
    </Router>

  );
}

export default App;
