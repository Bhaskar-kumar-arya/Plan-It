//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\routes\commentRoutes.js
//================================================================================

import express from 'express';
import { getCommentsForNode } from '../controllers/commentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this file
router.use(verifyToken);

// @route GET /api/comments/node/:nodeId
router.get('/node/:nodeId', getCommentsForNode);

export default router;