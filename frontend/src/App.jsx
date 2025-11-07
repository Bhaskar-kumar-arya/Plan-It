import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/store';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';

// A placeholder for your main app page
const Dashboard = () => {
  const logout = useAuthStore((state) => state.logout);
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
      <p className="text-foreground-secondary">You are logged in.</p>
      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover"
      >
        Logout
      </button>
    </div>
  );
};

// A protected route component
function ProtectedRoute({ children }) {
  const isAuth = useAuthStore((state) => state.isAuth);
  return isAuth ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Add your /tripcanvas/:id route here later */}
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;