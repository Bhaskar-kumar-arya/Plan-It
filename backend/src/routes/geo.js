//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\routes\geo.js
//================================================================================

import express from 'express';
import {
  searchPlaces,
  reverseGeocode
} from '../controllers/geoController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this file
router.use(verifyToken);

// @route POST /api/geo/search
router.post('/search', searchPlaces);

// @route GET /api/geo/reverse
router.get('/reverse', reverseGeocode);

export default router;