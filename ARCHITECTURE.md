#  Project Architecture & Design

This document provides a high-level overview of the system architecture and database schema for TripCanvas, as required by the MERNIFY Hackathon bonus criteria

## 1. System Flow: Real-time Collaboration

The core of the application relies on a combination of a REST API (for authentication and initial data) and WebSockets (for all real-time updates).

1.  **Authentication:**
    * User registers/logs in via the frontend.
    * A `POST` request is sent to `/api/auth/login`.
    * The Express server validates credentials, and if successful, generates a **JWT**.
    * The JWT is sent to the client, where it's stored (in Zustand/localStorage).

2.  **Joining a Trip (Socket Connection):**
    * User navigates to a trip page (`/tripcanvas/:tripId`).
    * The `useSocket` hook initializes a Socket.io connection, sending the JWT in the `auth` packet.
    * The backend's `socketHandler.js` uses a middleware to verify the JWT. If valid, the connection is established.
    * The client emits `joinTrip` with the `tripId`.
    * The server verifies the user has permission for this trip (owner or collaborator) and then adds the socket to the `tripId` room.

3.  **Real-time Event (e.g., Moving a Node):**
    * **Client A** drags a node on the canvas.
    * On `onNodeDragStop`, the client **emits** `socket.emit('moveNode', { tripId, nodeId, newPosition })`.
    * **Server** (`socketHandler.js`) receives this event.
    * It updates the `Node` document in the MongoDB database.
    * It then **broadcasts** the event to everyone else in the room: `socket.to(tripId).emit('nodeMoved', { nodeId, newPosition })`.
    * **Client B** (and C, D...) has a listener (`socket.on('nodeMoved', ...)`) that receives this event.
    * The listener calls the `updateNodePos` action in the Zustand store, which updates the React Flow canvas.

## 2. Database Schema (Mongoose Models)

The database is structured into several related models to efficiently manage trip data.

### `User`
* `username`: { String, required }
* `email`: { String, required, unique }
* `passwordHash`: { String, required }

### `Trip`
* `name`: { String, required }
* `owner`: { ObjectId, ref: 'User' }
* `collaborators`: [ { `userId`: { ObjectId, ref: 'User' }, `role`: { String, enum: ['editor', 'viewer'] } } ]
* `shareEnabled`: { Boolean, default: false }
* `sharePassword`: { String } (Hashed password)

### `Node`
* `tripId`: { ObjectId, ref: 'Trip', index: true }
* `name`: { String, required }
* `type`: { String, enum: ['location', 'note'] }
* `displayType`: { String, enum: ['canvas', 'bin'] } (Controls if it's on the canvas or in the Idea Bin)
* `position`: { `x`: Number, `y`: Number }
* `details`: { (Geo-data from Photon API)
    * `coordinates`: { `lat`: Number, `lng`: Number }
    * `address`: String
    * `country`: String
    * `city`: String
    * `osm_id`: Number
    }
* `timing`: { `arrival`: Date, `departure`: Date }
* `cost`: { Number, default: 0 }

### `Connection`
* `tripId`: { ObjectId, ref: 'Trip', index: true }
* `fromNodeId`: { ObjectId, ref: 'Node' }
* `toNodeId`: { ObjectId, ref: 'Node' }
* `sourceHandle`: String
* `targetHandle`: String

### `Task`
* `tripId`: { ObjectId, ref: 'Trip' }
* `nodeId`: { ObjectId, ref: 'Node', index: true }
* `text`: { String, required }
* `isCompleted`: { Boolean, default: false }

### `Comment`
* `tripId`: { ObjectId, ref: 'Trip' }
* `nodeId`: { ObjectId, ref: 'Node', index: true }
* `userId`: { ObjectId, ref: 'User' }
* `text`: { String, required }