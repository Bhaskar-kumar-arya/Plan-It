//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\api\index.js
//================================================================================

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

// --- Trip Endpoints ---
export const getTrips = () => api.get('/trips');
export const createTrip = (tripData) => api.post('/trips', tripData);
export const getTripById = (tripId) => api.get(`/trips/${tripId}`);
export const deleteTrip = (tripId) => api.delete(`/trips/${tripId}`);
export const getTripBudget = (tripId) => api.get(`/trips/${tripId}/budget`);
export const addCollaborator = (tripId, collaboratorData) =>
  api.post(`/trips/${tripId}/collaborators`, collaboratorData);

// ✅ --- ADDED SHARE/JOIN ENDPOINTS ---
export const joinTripWithCode = (tripId, password) =>
  api.post('/trips/join', { tripId, password });

export const setTripShareCode = (tripId, password) =>
  api.put(`/trips/${tripId}/share`, { password });
// ✅ --- END ---

// --- Google Maps Endpoints ---
export const searchGooglePlaces = (query) => api.post('/google/search', { query });
export const searchNearbyPlaces = (placeId, query, radius) =>
  api.post('/google/nearby', { placeId, query, radius });
export const getGoogleDirections = (originPlaceId, destinationPlaceId) =>
  api.post('/google/directions', { originPlaceId, destinationPlaceId });

export const getTasksForNode = (nodeId) => api.get(`/tasks/node/${nodeId}`);
export const getCommentsForNode = (nodeId) => api.get(`/comments/node/${nodeId}`);

export default api;