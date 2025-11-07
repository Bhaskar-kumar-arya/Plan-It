import express from 'express';
import {
  searchPlaces,
  findNearby,
  getDirections
} from '../controllers/googleController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this file
router.use(verifyToken);

// @route POST /api/google/search
router.post('/search', searchPlaces);

// @route POST /api/google/nearby
router.post('/nearby', findNearby);

// @route POST /api/google/directions
router.post('/directions', getDirections);

export default router;