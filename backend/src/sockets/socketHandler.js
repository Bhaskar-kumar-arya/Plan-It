//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\sockets\socketHandler.js
//================================================================================

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { JWT_SECRET } from '../config/index.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Node from '../models/Node.js';
import Connection from '../models/Connection.js';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js'; // ✅ --- ADD THIS ---
import Comment from '../models/Comment.js'; // ✅ --- ADD THIS ---

// --- Helper function to log activities ---
const logActivity = async (tripId, userId, action, details) => {
  try {
    // We don't block the main flow, just log in the background
    Activity.create({ tripId, userId, action, details });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// ✅ --- LIVE USER PRESENCE STORE ---
// We use Maps for efficient add/delete operations
// Format: Map<tripId, Map<userId, { username, sockets: Set<socketId> }>>
const liveUsers = new Map();
// ✅ --- END ---


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

      // ✅ --- ATTACH USER INFO ---
      // Attach user info to the socket for use in all events
      socket.user = { _id: user._id, username: user.username };
      // ✅ --- END ---
      next();

    } catch (err) {
      return next(new Error('Authentication error: Token is invalid.'));
    }
  });


  // -----------------------------------------------------------------
  // 2. CONNECTION HANDLER
  // -----------------------------------------------------------------
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User ID: ${socket.user._id}`);

    // --- Helper to broadcast the updated user list for a room ---
    const broadcastLiveUsers = (tripId) => {
      const room = liveUsers.get(tripId);
      if (room) {
        const usersList = Array.from(room.entries()).map(([userId, data]) => ({
          _id: userId,
          username: data.username,
        }));
        io.to(tripId).emit('liveUsersUpdate', usersList);
      }
    };

    // --- Join Trip Room ---
    socket.on('joinTrip', async ({ tripId }) => {
      try {
        // 1. Validate the tripId format
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
        const userId = socket.user._id; // ✅ Get user from socket
        const isOwner = trip.owner.equals(userId);
        const isCollaborator = trip.collaborators.some(c => c.userId.equals(userId));

        if (!isOwner && !isCollaborator) {
          socket.emit('error', { message: 'Forbidden: You do not have access to this trip' });
          return;
        }

        // 4. Join the room
        socket.join(tripId);
        socket.currentTripId = tripId; // ✅ Store tripId on socket
        console.log(`User ${userId} joined trip room: ${tripId}`);
        socket.emit('joinedTrip', tripId);

        // ✅ --- PRESENCE: ADD USER ---
        // Get/create room
        if (!liveUsers.has(tripId)) {
          liveUsers.set(tripId, new Map());
        }
        const room = liveUsers.get(tripId);

        // Get/create user data
        if (!room.has(socket.user._id)) {
          room.set(socket.user._id, {
            username: socket.user.username,
            sockets: new Set(),
          });
          // Broadcast "joined" toast to *others*
          socket.to(tripId).emit('userJoined', socket.user);
        }
        // Add this socket to the user's socket Set
        room.get(socket.user._id).sockets.add(socket.id);

        // Broadcast the full updated list to *everyone*
        broadcastLiveUsers(tripId);
        // ✅ --- END PRESENCE ---

      } catch (error) {
        console.error('Socket Error (joinTrip):', error);
        socket.emit('error', { message: 'Server error while joining trip' });
      }
    });

    socket.on('createTask', async ({ tripId, nodeId, text }, callback) => {
      try {
        const task = await Task.create({
          tripId,
          nodeId,
          text,
          assignedTo: socket.user._id, // Assign to creator by default
        });
        io.to(tripId).emit('taskCreated', task);
        if (callback) callback(task);
      } catch (error) {
        console.error('Socket Error (createTask):', error);
        if (callback) callback({ error: error.message });
      }
    });

    socket.on('updateTask', async ({ tripId, taskId, updates }) => {
      try {
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          { $set: updates }, // e.g., { isCompleted: true } or { text: "new text" }
          { new: true }
        );
        io.to(tripId).emit('taskUpdated', updatedTask);
      } catch (error) {
        console.error('Socket Error (updateTask):', error);
      }
    });

    socket.on('deleteTask', async ({ tripId, taskId }) => {
      try {
        await Task.findByIdAndDelete(taskId);
        io.to(tripId).emit('taskDeleted', { taskId });
      } catch (error) {
        console.error('Socket Error (deleteTask):', error);
      }
    });

    // ✅ --- COMMENT EVENTS ---
    socket.on('createComment', async ({ tripId, nodeId, text }, callback) => {
      try {
        let newComment = await Comment.create({
          tripId,
          nodeId,
          text,
          userId: socket.user._id,
        });
        // We must populate the user info before broadcasting
        newComment = await newComment.populate('userId', 'username');

        io.to(tripId).emit('commentCreated', newComment);
        if (callback) callback(newComment);
      } catch (error) {
        console.error('Socket Error (createComment):', error);
        if (callback) callback({ error: error.message });
      }
    });

    socket.on('deleteComment', async ({ tripId, commentId }) => {
        // Add logic here if you want to allow comment deletion
        // For simplicity, we'll leave this empty, but the structure is here.
        // You would check if socket.user._id matches the comment.userId
    });


    // --- Node Events ---
    socket.on('createNode', async (nodeData, callback) => {
      try {
        const newNode = await Node.create(nodeData);
        io.to(nodeData.tripId).emit('nodeCreated', newNode);
        logActivity(nodeData.tripId, socket.user._id, 'CREATE_NODE', `Added node '${newNode.name}'`); // ✅ Use socket.user
        if (callback) callback(newNode); 
      } catch (error) {
        console.error('Socket Error (createNode):', error);
        if (callback) callback({ error: error.message });
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
        logActivity(tripId, socket.user._id, 'UPDATE_NODE', `Updated node '${updatedNode.name}'`); // ✅ Use socket.user
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
          logActivity(tripId, socket.user._id, 'DELETE_NODE', `Removed node '${deletedNode.name}'`); // ✅ Use socket.user
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
      } catch (error) {
        console.error('Socket Error (createConnection):', error);
      }
    });
    
    socket.on('deleteConnection', async ({ tripId, connectionId }) => {
      try {
        await Connection.findByIdAndDelete(connectionId);
        io.to(tripId).emit('connectionDeleted', connectionId);
        logActivity(tripId, socket.user._id, 'DELETE_CONNECTION', `Removed a connection`); // ✅ Use socket.user
      } catch (error) {
        console.error('Socket Error (deleteConnection):', error);
      }
    });
    
    // --- Ephemeral Events (Cursor) ---
    socket.on('updateCursor', ({ tripId, position }) => {
      socket.to(tripId).emit('cursorMoved', { 
        userId: socket.user._id, // ✅ Use socket.user
        position 
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}, User ID: ${socket.user?._id}`);
      
      // ✅ --- PRESENCE: REMOVE USER ---
      const { user, currentTripId } = socket;
      if (user && currentTripId && liveUsers.has(currentTripId)) {
        const room = liveUsers.get(currentTripId);
        const userData = room.get(user._id);

        if (userData) {
          // Remove this specific socket
          userData.sockets.delete(socket.id);

          // If user has no more open sockets, remove them fully
          if (userData.sockets.size === 0) {
            room.delete(user._id);
            // Broadcast "left" toast to everyone
            io.to(currentTripId).emit('userLeft', user);
          }

          // If room is now empty, clean it up from the main Map
          if (room.size === 0) {
            liveUsers.delete(currentTripId);
          }

          // Broadcast the full updated list
          broadcastLiveUsers(currentTripId);
        }
      }
      // ✅ --- END PRESENCE ---
    });
  });
};