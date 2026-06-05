import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import HelperDashboard from './pages/HelperDashboard';
import './App.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.isHelper) return <Navigate to="/helper" />;
  return children;
}

function HelperRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (!user.isHelper) return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/helper" element={
              <HelperRoute>
                <HelperDashboard />
              </HelperRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
