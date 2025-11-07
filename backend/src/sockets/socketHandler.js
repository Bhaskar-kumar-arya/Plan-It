import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { JWT_SECRET } from '../config/index.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Node from '../models/Node.js';
import Connection from '../models/Connection.js';
import Activity from '../models/Activity.js';

// --- Helper function to log activities ---
const logActivity = async (tripId, userId, action, details) => {
  try {
    // We don't block the main flow, just log in the background
    Activity.create({ tripId, userId, action, details });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};


export const socketHandler = (io) => {

  // -----------------------------------------------------------------
  // 1. AUTHENTICATION MIDDLEWARE
  // This runs on every new connection.
  // The client must send its token in socket.handshake.auth
  // -----------------------------------------------------------------
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found.'));
      }

      // Attach user ID to the socket object for use in all events
      socket.userId = user._id;
      next();

    } catch (err) {
      return next(new Error('Authentication error: Token is invalid.'));
    }
  });


  // -----------------------------------------------------------------
  // 2. CONNECTION HANDLER
  // This runs after the authentication middleware is successful.
  // -----------------------------------------------------------------
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User ID: ${socket.userId}`);

    // --- Join Trip Room ---
    // The 'TODO' is now implemented here.
    socket.on('joinTrip', async ({ tripId }) => {
      try {
        // 1. Validate the tripId format (prevents DB errors)
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
          socket.emit('error', { message: 'Invalid trip ID format' });
          return;
        }
        
        // 2. Find the trip
        const trip = await Trip.findById(tripId);
        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        // 3. AUTHORIZATION check
        const userId = socket.userId;
        const isOwner = trip.owner.equals(userId);
        const isCollaborator = trip.collaborators.some(c => c.userId.equals(userId));

        if (!isOwner && !isCollaborator) {
          // User is authenticated but NOT authorized for this trip
          socket.emit('error', { message: 'Forbidden: You do not have access to this trip' });
          return;
        }

        // 4. Join the room
        socket.join(tripId);
        console.log(`User ${userId} joined trip room: ${tripId}`);
        // Notify client they joined successfully
        socket.emit('joinedTrip', tripId); 

      } catch (error) {
        console.error('Socket Error (joinTrip):', error);
        socket.emit('error', { message: 'Server error while joining trip' });
      }
    });


    // --- Node Events ---
    // Now uses socket.userId (trusted) instead of a payload property
    socket.on('createNode', async (nodeData) => {
      try {
        // We can trust socket.userId
        const newNode = await Node.create(nodeData);
        io.to(nodeData.tripId).emit('nodeCreated', newNode);
        
        logActivity(nodeData.tripId, socket.userId, 'CREATE_NODE', `Added node '${newNode.name}'`);
      } catch (error) {
        console.error('Socket Error (createNode):', error);
      }
    });

    socket.on('moveNode', async ({ tripId, nodeId, newPosition }) => {
      try {
        await Node.findByIdAndUpdate(nodeId, { position: newPosition });
        socket.to(tripId).emit('nodeMoved', { nodeId, newPosition });
      } catch (error) {
        console.error('Socket Error (moveNode):', error);
      }
    });

    socket.on('updateNodeDetails', async ({ tripId, nodeId, newDetails }) => {
      try {
        const updatedNode = await Node.findByIdAndUpdate(
          nodeId,
          { $set: newDetails },
          { new: true } 
        );
        
        io.to(tripId).emit('nodeUpdated', updatedNode);
        logActivity(tripId, socket.userId, 'UPDATE_NODE', `Updated node '${updatedNode.name}'`);
      } catch (error) {
        console.error('Socket Error (updateNodeDetails):', error);
      }
    });

    socket.on('deleteNode', async ({ tripId, nodeId }) => {
      try {
        const deletedNode = await Node.findByIdAndDelete(nodeId);
        
        await Connection.deleteMany({
          tripId,
          $or: [{ fromNodeId: nodeId }, { toNodeId: nodeId }]
        });
        
        io.to(tripId).emit('nodeDeleted', nodeId);
        
        if (deletedNode) {
          logActivity(tripId, socket.userId, 'DELETE_NODE', `Removed node '${deletedNode.name}'`);
        }
      } catch (error) {
        console.error('Socket Error (deleteNode):', error);
      }
    });

    // --- Connection Events ---
    socket.on('createConnection', async (connectionData) => {
      try {
        const newConnection = await Connection.create(connectionData);
        io.to(connectionData.tripId).emit('connectionCreated', newConnection);
      } catch (error)
 {
        console.error('Socket Error (createConnection):', error);
      }
    });

      socket.on('deleteConnection', async ({ tripId, connectionId }) => {
      try {
        // 1. Delete the connection from the database
        const deletedConnection = await Connection.findByIdAndDelete(connectionId);

        if (!deletedConnection) {
          // Connection might have already been deleted, just ignore
          return;
        }

        // 2. Broadcast the ID of the deleted connection to all clients
        io.to(tripId).emit('connectionDeleted', connectionId);
        
        // 3. Log the activity
        logActivity(tripId, socket.userId, 'DELETE_CONNECTION', 'Removed a connection');

      } catch (error) {
        console.error('Socket Error (deleteConnection):', error);
        socket.emit('error', { message: 'Failed to delete connection' });
      }
    });
    
    // --- Ephemeral Events (Cursor) ---
    socket.on('updateCursor', ({ tripId, position }) => {
      socket.to(tripId).emit('cursorMoved', { 
        userId: socket.userId, // Trusted ID from our middleware
        position 
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}, User ID: ${socket.userId}`);
      // You could broadcast a 'userLeft' event to rooms this socket was in
    });
  });
};