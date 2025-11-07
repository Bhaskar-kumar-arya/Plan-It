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
  // -----------------------------------------------------------------
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User ID: ${socket.userId}`);

    // --- Join Trip Room ---
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
    socket.on('createNode', async (nodeData, callback) => {
      try {
        const newNode = await Node.create(nodeData);
        // Broadcast to everyone in the room
        io.to(nodeData.tripId).emit('nodeCreated', newNode);
        
        logActivity(nodeData.tripId, socket.userId, 'CREATE_NODE', `Added node '${newNode.name}'`);

        // Send the created node back to the person who emitted
        if (callback) callback(newNode); 
      } catch (error) {
        console.error('Socket Error (createNode):', error);
        if (callback) callback({ error: error.message }); // Send error back
      }
    });

    socket.on('moveNode', async ({ tripId, nodeId, newPosition }) => {
      try {
        await Node.findByIdAndUpdate(nodeId, { position: newPosition });
        // Broadcast to others
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
        
        // Broadcast to everyone
        io.to(tripId).emit('nodeUpdated', updatedNode);
        logActivity(tripId, socket.userId, 'UPDATE_NODE', `Updated node '${updatedNode.name}'`);
      } catch (error) {
        console.error('Socket Error (updateNodeDetails):', error);
      }
    });

    socket.on('deleteNode', async ({ tripId, nodeId }) => {
      try {
        const deletedNode = await Node.findByIdAndDelete(nodeId);
        
        // Delete all connections attached to this node
        await Connection.deleteMany({
          tripId,
          $or: [{ fromNodeId: nodeId }, { toNodeId: nodeId }]
        });
        
        // Broadcast to everyone
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
        // ✅ The connectionData object now contains all fields,
        // including sourceHandle and targetHandle (which can be null)
        const newConnection = await Connection.create(connectionData);
        io.to(connectionData.tripId).emit('connectionCreated', newConnection);
      } catch (error)
 {
        console.error('Socket Error (createConnection):', error);
      }
    });
    
    // ✅ --- ADDED THIS BLOCK ---
    socket.on('deleteConnection', async ({ tripId, connectionId }) => {
      try {
        // 1. Delete the connection from the database
            await Connection.findByIdAndDelete(connectionId);
        
        // 2. Broadcast to all clients in the room
        io.to(tripId).emit('connectionDeleted', connectionId);
        
        // 3. Log activity
        logActivity(tripId, socket.userId, 'DELETE_CONNECTION', `Removed a connection`);

      } catch (error) {
        console.error('Socket Error (deleteConnection):', error);
      }
    });
    // ✅ --- END OF ADDED BLOCK ---
    
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