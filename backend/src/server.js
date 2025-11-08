//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\server.js
//================================================================================

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

// Config
import { PORT } from './config/index.js';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import geoRoutes from './routes/geo.js'; // ✅ --- RENAMED FROM 'googleRoutes' ---
import taskRoutes from './routes/taskRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

// Middleware
import { errorHandler } from './middleware/errorMiddleware.js';

// Socket Handler
import { socketHandler } from './sockets/socketHandler.js';

// --- Connect to Database ---
connectDB();

// --- Basic Server Setup ---
const app = express();
const server = http.createServer(app);

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/geo', geoRoutes); // ✅ --- UPDATED ---
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// --- Handle Socket.io Connections ---
socketHandler(io);

// --- Custom Error Handler ---
app.use(errorHandler);

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});