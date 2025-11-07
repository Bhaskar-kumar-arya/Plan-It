import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { JWT_SECRET } from '../config/index.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';

/**
 * @desc Verifies the JWT token from the Authorization header
 * Attaches the user object to req.user
 */
export const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token (excluding the password)
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * @desc Middleware factory to check if a user has permission for a trip.
 * @param requiredRole 'viewer' (can view) or 'editor' (can edit) or 'owner' (must be owner)
 * Attaches the trip object to req.trip to prevent re-fetching
 */
export const checkTripPermission = (requiredRole = 'viewer') => 
  asyncHandler(async (req, res, next) => {
    const { tripId } = req.params;
    const userId = req.user._id;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }

    // 1. Check if user is the owner
    const isOwner = trip.owner.equals(userId);
    if (isOwner) {
      req.trip = trip; // Attach trip for the next controller
      return next();
    }

    // 2. If 'owner' was required and user is not owner, deny
    if (requiredRole === 'owner') {
      res.status(403);
      throw new Error('Forbidden: Owner permission required');
    }

    // 3. Check if user is a collaborator
    const collaborator = trip.collaborators.find(c => c.userId.equals(userId));

    if (!collaborator) {
      res.status(403);
      throw new Error('Forbidden: You are not a member of this trip');
    }

    // 4. Check if collaborator has the required role
    // If role is 'editor', 'editor' is required.
    // If role is 'viewer', 'viewer' or 'editor' is fine.
    if (requiredRole === 'editor' && collaborator.role !== 'editor') {
      res.status(403);
      throw new Error('Forbidden: Editor permission required');
    }

    // User is a collaborator with at least 'viewer' permission
    req.trip = trip; // Attach trip for the next controller
    next();
  });