# TripCanvas: Backend Architecture Plan

This document outlines the complete backend plan for the **TripCanvas** application, built on the **MERN stack (MongoDB, Express.js, React, Node.js)** with a focus on scalability and real-time collaboration.

---

## 1. Core Tech Stack

- **Runtime:** Node.js  
- **Web Framework:** Express.js  
- **Database:** MongoDB with Mongoose (for clean data models)  
- **Real-Time:** Socket.io (for live collaboration)  
- **Authentication:** JSON Web Tokens (JWT)

**Utilities:**
- `bcryptjs` – For hashing user passwords  
- `jsonwebtoken` – For creating and verifying JWTs  
- `cors` – To handle requests from the React frontend  
- `dotenv` – To manage environment variables (API keys, DB connection strings)

---

## 2. MongoDB Database Schema

The schema is **normalized** for scalability. Each collection references others, ensuring modular and efficient queries.

### A. User Collection
Stores user account and authentication info.

```json
{
  "_id": "ObjectId('user123')",
  "username": "User A",
  "email": "userA@example.com",
  "passwordHash": "hashed_password_string"
}
```

### B. Trip Collection
The main workspace that manages ownership and access control.

```json
{
  "_id": "ObjectId('trip456')",
  "name": "Japan 2026",
  "owner": "ObjectId('user123')",
  "collaborators": [
    {
      "userId": "ObjectId('user789')",
      "role": "editor" // 'editor' or 'viewer'
    }
  ]
}
```

### C. Node Collection
Stores every "Location Node" on the canvas.

```json
{
  "_id": "ObjectId('nodeABC')",
  "tripId": "ObjectId('trip456')",
  "name": "Shibuya Crossing",
  "type": "location",
  "position": { "x": 150, "y": 220 },
  "details": {
    "googlePlaceId": "ChIJ_f0d5-0Y...",
    "address": "Shibuya, Tokyo, Japan"
  },
  "timing": {
    "arrival": "2026-10-20T10:00:00Z",
    "departure": "2026-10-20T11:30:00Z"
  },
  "cost": 0,
  "status": "confirmed"
}
```

### D. Connection Collection
Stores the arrows (connections) between nodes.

```json
{
  "_id": "ObjectId('connXYZ')",
  "tripId": "ObjectId('trip456')",
  "fromNodeId": "ObjectId('nodeHotel')",
  "toNodeId": "ObjectId('nodeABC')",
  "travelInfo": {
    "mode": "drive",
    "timeText": "22 min"
  }
}
```

### E. Activity Collection
Logs all major user actions for version history and accountability.

```json
{
  "_id": "ObjectId('act1')",
  "tripId": "ObjectId('trip456')",
  "userId": "ObjectId('user789')",
  "action": "CREATE_NODE",
  "details": "User B added 'Shibuya Crossing'",
  "timestamp": "2025-11-07T10:05:00Z"
}
```

---

## 3. API Endpoints (Express.js REST API)

The API is **stateless** and uses JWTs for authentication.

### Authentication Routes
#### `POST /api/auth/register`
- **Action:** Create a new user (password hashed using bcryptjs)
- **Returns:** User object + JWT

#### `POST /api/auth/login`
- **Action:** Validate credentials
- **Returns:** User object + JWT

### Trip Routes
#### `GET /api/trips`
- **Auth Required**
- **Action:** Get all trips for the user
- **Returns:** Array of trips

#### `POST /api/trips`
- **Auth Required**
- **Action:** Create a new trip (user becomes owner)
- **Returns:** Created trip object

#### `GET /api/trips/:tripId`
- **Auth Required**
- **Action:** Fetch trip details + related nodes, connections, and activities
- **Returns:** Full trip data object

#### `POST /api/trips/:tripId/collaborators`
- **Auth Required + Must be owner**
- **Action:** Add collaborators to the trip
- **Returns:** Updated trip object

---

## 4. Real-Time Architecture (Socket.io)

### Core Concept: Rooms
Each trip has its own Socket.io **room** (e.g., `trip456`).  
Users joining the trip join that room — ensuring scalability and privacy.

### A. Client → Server Events
- `joinTrip(tripId)` – Join trip room  
- `createNode(nodeData)` – Add node  
- `moveNode(nodeId, newPosition)` – Move node  
- `updateNodeDetails(nodeId, newDetails)` – Update details  
- `deleteNode(nodeId)` – Delete node  
- `createConnection(fromNodeId, toNodeId)` – Add connection  
- `updateCursor(position)` – Share cursor position  

### B. Server → Client Broadcasts
- `nodeCreated(nodeData)`  
- `nodeMoved(nodeId, newPosition)`  
- `nodeUpdated(nodeId, newDetails)`  
- `nodeDeleted(nodeId)`  
- `connectionCreated(connectionData)`  
- `cursorMoved(userId, position)` *(ephemeral, not stored in DB)*

---

## 5. Authentication & Authorization (Middleware)

### 1. verifyToken Middleware
Validates JWTs on protected routes.

**Logic:**
1. Read `Authorization: Bearer <token>` header  
2. Verify using `jsonwebtoken`  
3. Attach user ID to `req.user`  
4. Reject invalid tokens with 401 Unauthorized

### 2. checkTripPermission(requiredRole) Middleware
Implements role-based access control.

**Logic:**
- Get `userId` from `req.user` and `tripId` from `req.params`
- Check if user is owner or collaborator
- If `requiredRole` is provided (like 'editor'), verify user’s role
- Send 403 Forbidden if unauthorized

---

## 6. Backend Folder Structure

Organized for scalability and clarity.

```
/src
  ├── /config
  │   ├── db.js          // MongoDB connection logic
  │   └── index.js       // Loads .env variables
  ├── /controllers
  │   ├── authController.js // Logic for register, login
  │   └── tripController.js // Logic for trip routes
  ├── /middleware
  │   └── authMiddleware.js // verifyToken, checkTripPermission
  ├── /models
  │   ├── User.js
  │   ├── Trip.js
  │   ├── Node.js
  │   ├── Connection.js
  │   └── Activity.js
  ├── /routes
  │   ├── auth.js
  │   └── trips.js
  ├── /sockets
  │   └── socketHandler.js
  └── server.js            // Express + Socket.io initialization
```

---

✅ **Highlights:**
- Modular structure for scalability  
- Real-time collaboration using Socket.io rooms  
- JWT-based secure authentication  
- Clear role-based access control  
- Activity tracking for auditability
