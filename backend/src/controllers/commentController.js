//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\controllers\commentController.js
//================================================================================

import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';

/**
 * @desc    Get all comments for a specific node
 * @route   GET /api/comments/node/:nodeId
 * @access  Private
 */
export const getCommentsForNode = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;

  const comments = await Comment.find({ nodeId })
    .populate('userId', 'username') // Populate the user's name
    .sort({ createdAt: 'asc' }); // Show oldest first

  res.json(comments);
});

// Note: create, update, delete will be handled by socket.io