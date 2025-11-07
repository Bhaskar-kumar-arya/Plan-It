// src/pages/Dashboard.jsx
import React from 'react';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-gray-200">
      <h1 className="text-4xl font-bold">Welcome, {user?.username || 'User'}</h1>
      <p className="mt-4 text-gray-400">
        This is your dashboard. Your trips will be listed here.
      </p>
      <button
        onClick={logout}
        className="px-4 py-2 mt-6 font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Log Out
      </button>
    </div>
  );
};

export default Dashboard;