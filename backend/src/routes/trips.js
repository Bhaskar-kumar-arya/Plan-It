//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\routes\trips.js
//================================================================================

import express from 'express';
import {
  getTrips,
  createTrip,
  getTripData,
  addCollaborator,
  deleteTrip,
  setShareSettings, // ✅ --- ADDED ---
  joinTrip, // ✅ --- ADDED ---
} from '../controllers/tripController.js';
import { verifyToken, checkTripPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this file
router.use(verifyToken);

// @route GET /api/trips
// @route POST /api/trips
router.route('/')
  .get(getTrips)
  .post(createTrip);

// ✅ --- ADDED JOIN ROUTE ---
// This must be a specific route *before* the dynamic /:tripId route
// @route POST /api/trips/join
router.post('/join', joinTrip);

// @route GET /api/trips/:tripId
// @route DELETE /api/trips/:tripId
// Requires at least 'viewer' permission
router.route('/:tripId')
  .get(checkTripPermission('viewer'), getTripData)
  .delete(checkTripPermission('owner'), deleteTrip);

// @route POST /api/trips/:tripId/collaborators
// Requires 'owner' permission
router.route('/:tripId/collaborators')
  .post(checkTripPermission('owner'), addCollaborator);

// ✅ --- ADDED SHARE ROUTE ---
// @route PUT /api/trips/:tripId/share
// Requires 'owner' permission
router.route('/:tripId/share')
  .put(checkTripPermission('owner'), setShareSettings);


export default router;