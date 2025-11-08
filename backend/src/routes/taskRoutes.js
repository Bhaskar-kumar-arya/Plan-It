//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\routes\taskRoutes.js
//================================================================================

import express from 'express';
import { getTasksForNode } from '../controllers/taskController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this file
router.use(verifyToken);

// @route GET /api/tasks/node/:nodeId
router.get('/node/:nodeId', getTasksForNode);

export default router;