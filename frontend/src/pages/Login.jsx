import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { loginUser } from '../api';
import { Mail, Lock } from 'lucide-react';

// ✅ Move InputWithIcon outside to prevent re-renders causing focus loss
function InputWithIcon({ icon: Icon, type, name, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-foreground-secondary" />
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await loginUser(formData);
      const { token, ...user } = response.data;
      loginAction(user, token);
      navigate('/dashboard'); // Redirect to dashboard or previous page
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center">
          Welcome back to TripCanvas
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputWithIcon
            icon={Mail}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <InputWithIcon
            icon={Lock}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
              className="w-full py-2 px-4 bg-(--accent) text-white font-semibold rounded-md hover:hover:bg-(--accent-hover) cursor-pointer transition duration-200"
          >
            Log In
          </button>
        </form>

        <p className="text-sm text-center text-foreground-secondary">
          Don’t have an account?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
