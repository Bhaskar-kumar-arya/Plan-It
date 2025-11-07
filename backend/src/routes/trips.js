import express from 'express';
import {
  getTrips,
  createTrip,
  getTripData,
  addCollaborator,
  deleteTrip,
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

// @route GET /api/trips/:tripId
// Requires at least 'viewer' permission
router.route('/:tripId')
  .get(checkTripPermission('viewer'), getTripData);

// @route POST /api/trips/:tripId/collaborators
// Requires 'owner' permission
router.route('/:tripId/collaborators')
  .post(checkTripPermission('owner'), addCollaborator);

// @route DELETE /api/trips/:tripId
// Requires 'owner' permission
router.route('/:tripId')
  .get(checkTripPermission('viewer'), getTripData)
  .delete(checkTripPermission('owner'), deleteTrip);


export default router;