//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\controllers\taskController.js
//================================================================================

import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';

/**
 * @desc    Get all tasks for a specific node
 * @route   GET /api/tasks/node/:nodeId
 * @access  Private
 */
export const getTasksForNode = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const tasks = await Task.find({ nodeId }).sort({ createdAt: 'asc' });

  res.json(tasks);
});

// Note: create, update, delete will be handled by socket.io