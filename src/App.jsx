// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AllProviders } from './contexts'; 
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import MagneticCursor from './components/ui/MagneticCursor'; 
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage'; 
import DashboardLayout from './components/dashboard/DashboardLayout';
import './styles/globals.css';

// Auth Debugger Component (for development only)
const AuthDebugger = () => {
  const { isAuthenticated, user, loading } = useAuth();
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#f0f0f0',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      border: '1px solid #ccc',
      maxWidth: '250px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>🔐 Auth Debug</h4>
      <div style={{ display: 'grid', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Loading:</span>
          <span style={{ fontWeight: 'bold', color: loading ? '#f39c12' : '#27ae60' }}>
            {loading ? '⏳' : '✅'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Authenticated:</span>
          <span style={{ fontWeight: 'bold', color: isAuthenticated ? '#27ae60' : '#e74c3c' }}>
            {isAuthenticated ? '✅' : '❌'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>User ID:</span>
          <span style={{ fontWeight: 'bold' }}>{user?.id || 'None'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>User Email:</span>
          <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    // Use AllProviders which includes ALL contexts
    <AllProviders>
      <Router>
        {/* Add MagneticCursor here to cover all routes */}
        <MagneticCursor />
        
        {/* Show auth debugger in development mode only */}
        {process.env.NODE_ENV === 'development' && <AuthDebugger />}
        
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