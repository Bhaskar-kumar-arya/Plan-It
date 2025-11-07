import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/store';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // Import the real dashboard
import TripCanvasPage from './pages/TripCanvasPage'; // Import the new placeholder

// A protected route component
function ProtectedRoute({ children }) {
  const isAuth = useAuthStore((state) => state.isAuth);
  return isAuth ? children : <Navigate to="/login" replace />;
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
      <Route
        path="/tripcanvas/:tripId"
        element={
          <ProtectedRoute>
            <TripCanvasPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      {/* If logged in, /dashboard is the default, else /login */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;