import logo from './logo.svg';
import './App.css';
import Dashboard from './pages/Dashboard';
import { BrowserRouter as Router,Route,Routes} from 'react-router-dom'
import CustomerDetails from './pages/CustomerDetails';
import SupplierDetails from './pages/SupplierDetails';
import Login from './pages/Login';

function App() {
  return (
    <Router>
    <div>
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/CustomerDetails" element={<CustomerDetails />} />
        <Route path="/SupplierDetails" element={<SupplierDetails />} />
      </Routes>
    

    </div>
    </Router>

  );
}

export default App;
