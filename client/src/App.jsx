import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { UIProvider } from './context/UIContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import HelperDashboard from './pages/HelperDashboard';
import './App.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <UIProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/helper" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </UIProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
