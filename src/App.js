
import './App.css';
import Dashboard from './pages/Dashboard';
import { BrowserRouter as Router,Route,Routes} from 'react-router-dom'
import CustomerDetails from './pages/CustomerDetails';
import SupplierDetails from './pages/SupplierDetails';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Production from './pages/Production';
import GRN from './pages/GRN'

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
      </Routes>
    

    </div>
    </Router>

  );
}

export default App;
