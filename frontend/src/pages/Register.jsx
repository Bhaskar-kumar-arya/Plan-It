import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { registerUser } from '../api';
import { UserPlus, Mail, Lock } from 'lucide-react';

// Extracted as a separate component to prevent re-mounting
const InputWithIcon = ({ icon: Icon, type, name, placeholder, value, onChange }) => (
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

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
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
      const response = await registerUser(formData);
      // Log the user in immediately after registration
      const { token, ...user } = response.data;
      loginAction(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center">
          Create your TripCanvas Account
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputWithIcon
            icon={UserPlus}
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
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
            className="w-full py-2 px-4 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 transition duration-200"
          >
            Sign Up
          </button>
        </form>

        <p className="text-sm text-center text-foreground-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}