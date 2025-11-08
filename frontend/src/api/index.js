//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\api\index.js
//================================================================================

import axios from 'axios';

// Create an Axios instance based on your API docs
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
    // baseURL: 'http://localhost:5001/api',
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

// --- Trip Endpoints ---
export const getTrips = () => api.get('/trips');
export const createTrip = (tripData) => api.post('/trips', tripData);
export const getTripById = (tripId) => api.get(`/trips/${tripId}`);
export const deleteTrip = (tripId) => api.delete(`/trips/${tripId}`);
export const getTripBudget = (tripId) => api.get(`/trips/${tripId}/budget`);
export const addCollaborator = (tripId, collaboratorData) =>
  api.post(`/trips/${tripId}/collaborators`, collaboratorData);

export const joinTripWithCode = (tripId, password) =>
  api.post('/trips/join', { tripId, password });

export const setTripShareCode = (tripId, password) =>
  api.put(`/trips/${tripId}/share`, { password });

// ✅ --- UPDATED: Geo Endpoints (Photon) ---
export const searchPhotonPlaces = (query, bias_lat, bias_lon) => {
  const params = { query };
  if (bias_lat && bias_lon) {
    params.bias_lat = bias_lat;
    params.bias_lon = bias_lon;
  }
  return api.post('/geo/search', params);
};

export const reverseGeocode = (lat, lon) =>
  api.get(`/geo/reverse?lat=${lat}&lon=${lon}`);
// ✅ --- END ---

// --- Task & Comment Endpoints ---
export const getTasksForNode = (nodeId) => api.get(`/tasks/node/${nodeId}`);
export const getCommentsForNode = (nodeId) => api.get(`/comments/node/${nodeId}`);

export default api;