import axios from 'axios';

// Create an Axios instance based on your API docs
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Function to set the JWT token in the header for all future requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Auth Endpoints ---
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (userData) => api.post('/auth/login', userData);

// --- Google Maps Endpoints (example from your docs) ---
export const searchGooglePlaces = (query) => api.post('/google/search', { query });

export default api;
