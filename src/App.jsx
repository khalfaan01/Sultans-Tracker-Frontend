// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AllProviders } from './contexts'; // Import from index.jsx
import MagneticCursor from './components/ui/MagneticCursor'; 
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage'; // Import HomePage directly
import DashboardLayout from './components/dashboard/DashboardLayout';
import './styles/globals.css';

function App() {
  return (
    // Use AllProviders which includes ALL contexts
    <AllProviders>
      <Router>
        {/* Add MagneticCursor here to cover all routes */}
        <MagneticCursor />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Keep DashboardLayout for nested routes if needed */}
          <Route path="/dashboard/*" element={<DashboardLayout />} />
        </Routes>
      </Router>
    </AllProviders>
  );
}

export default App;