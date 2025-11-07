import asyncHandler from 'express-async-handler';
import Trip from '../models/Trip.js';
import Node from '../models/Node.js';
import Connection from '../models/Connection.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

/**
 * @desc Get all trips for the logged-in user
 * @route GET /api/trips
 * @access Private (verifyToken)
 */
export const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({
    $or: [{ owner: req.user._id }, { 'collaborators.userId': req.user._id }],
  }).sort({ updatedAt: -1 });
  
  res.json(trips);
});

/**
 * @desc Create a new trip
 * @route POST /api/trips
 * @access Private (verifyToken)
 */
export const createTrip = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Please provide a trip name');
  }

  const trip = await Trip.create({
    name,
    owner: req.user._id,
  });

  res.status(201).json(trip);
});

/**
 * @desc Get full details for a single trip
 * @route GET /api/trips/:tripId
 * @access Private (verifyToken + checkTripPermission('viewer'))
 */
export const getTripData = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  // The trip object is already attached by checkTripPermission middleware
  const trip = req.trip;

  // Fetch all related data
  const nodes = await Node.find({ tripId });
  const connections = await Connection.find({ tripId });
  const activities = await Activity.find({ tripId })
    .sort({ timestamp: -1 })
    .limit(50) // Limit to last 50 activities for performance
    .populate('userId', 'username'); // Populate user info

  res.json({
    trip,
    nodes,
    connections,
    activities,
  });
});

/**
 * @desc Add a collaborator to a trip
 * @route POST /api/trips/:tripId/collaborators
 * @access Private (verifyToken + checkTripPermission('owner'))
 */
export const addCollaborator = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const trip = req.trip; // Attached by middleware

  if (!email || !role) {
    res.status(400);
    throw new Error('Please provide user email and role');
  }

  // Find the user to add
  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    res.status(404);
    throw new Error('User not found with that email');
  }

  // Check if user is the owner
  if (trip.owner.equals(userToAdd._id)) {
    res.status(400);
    throw new Error('User is already the owner of this trip');
  }

  // Check if user is already a collaborator
  const isAlreadyCollaborator = trip.collaborators.some(
    c => c.userId.equals(userToAdd._id)
  );
  if (isAlreadyCollaborator) {
    res.status(400);
    throw new Error('User is already a collaborator');
  }

  // Add new collaborator
  trip.collaborators.push({
    userId: userToAdd._id,
    role: role,
  });

  await trip.save();

  res.status(201).json(trip);
});