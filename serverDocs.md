# TripCanvas API Documentation

This document outlines the REST API and Real-Time (Socket.io) API for the TripCanvas backend.

* Base URL: http://localhost:5001
* Frontend Client URL: http://localhost:3000 (for CORS)

## Authentication

Authentication is handled via JSON Web Tokens (JWT).

1. **Login/Register**: First, make a request to `POST /api/auth/login` or `POST /api/auth/register` to get a token.
2. **Store Token**: Store this token on the client (e.g., in state, context, or local storage).
3. **Send Token**: For all Private REST endpoints, you must include the token in the Authorization header.
   * Header: `Authorization: Bearer <your_jwt_token>`
4. **Socket Auth**: For the Real-Time API, you must send this token in the auth object upon connection.

## 1. REST API Endpoints

Used for initial data loading, user management, and non-real-time actions.

### Auth (`/api/auth`)

#### `POST /api/auth/register`

* **Auth**: Public
* **Description**: Creates a new user account.

* **Request Body (JSON)**:

  ```json
  {
    "username": "User A",
    "email": "userA@example.com",
    "password": "password123"
  }
  ```

* **Success Response (201)**:

  ```json
  {
    "_id": "user123",
    "username": "User A",
    "email": "userA@example.com",
    "token": "eyJ..."
  }
  ```

#### `POST /api/auth/login`

* **Auth**: Public
* **Description**: Logs in an existing user.

* **Request Body (JSON)**:

  ```json
  {
    "email": "userA@example.com",
    "password": "password123"
  }
  ```

* **Success Response (200)**:

  ```json
  {
    "_id": "user123",
    "username": "User A",
    "email": "userA@example.com",
    "token": "eyJ..."
  }
  ```

### Trips (`/api/trips`)

All routes in this section are Private and require the `Authorization: Bearer <token>` header.

#### `GET /api/trips`

* **Description**: Gets a list of all trips (owned or collaborating) for the logged-in user.

* **Request Body**: None

* **Success Response (200)**:

  ```json
  [
    {
      "_id": "trip456",
      "name": "Japan 2026",
      "owner": "user123",
      "collaborators": []
    }
  ]
  ```

#### `POST /api/trips`

* **Description**: Creates a new trip, setting the user as the owner.

* **Request Body (JSON)**:

  ```json
  {
    "name": "Bengaluru Tech Tour"
  }
  ```

* **Success Response (201)**:

  ```json
  {
    "_id": "trip789",
    "name": "Bengaluru Tech Tour",
    "owner": "user123",
    "collaborators": [],
    ...
  }
  ```

#### `GET /api/trips/:tripId`

* **Description**: Gets all data for a single trip (nodes, connections, comments, etc.). This is the main "load" call when opening a trip.

* **Params**: tripId (in URL)

* **Request Body**: None

* **Success Response (200)**:

  ```json
  {
    "trip": { ... },
    "nodes": [ ... ],
    "connections": [ ... ],
    "activities": [ ... ],
    "comments": [ ... ],
    "tasks": [ ... ]
  }
  ```

#### `GET /api/trips/:tripId/budget`

* **Description**: Calculates the total cost of all nodes in a trip.

* **Params**: tripId (in URL)

* **Request Body**: None

* **Success Response (200)**:

  ```json
  {
    "totalCost": 1250
  }
  ```

#### `POST /api/trips/:tripId/collaborators`

* **Auth**: Private (Owner Only)
* **Description**: Adds another user to the trip as a collaborator.

* **Params**: tripId (in URL)

* **Request Body (JSON)**:

  ```json
  {
    "email": "userB@example.com",
    "role": "editor"
  }
  ```

* **Success Response (201)**: The updated trip object.

### Google Maps (`/api/google`)

All routes in this section are Private and require the `Authorization: Bearer <token>` header.

#### `POST /api/google/search`

* **Description**: Searches for a place by text query ("Find Any Place").

* **Request Body (JSON)**:

  ```json
  {
    "query": "Eiffel Tower"
  }
  ```

* **Success Response (200)**:

  ```json
  [
    {
      "placeId": "ChIJ...",
      "name": "Eiffel Tower",
      "address": "Champ de Mars, 5 Av. Anatole France...",
      "location": { "lat": 48.85, "lng": 2.29 },
      "icon": "https://..."
    }
  ]
  ```

#### `POST /api/google/nearby`

* **Description**: Searches for a query near a specific placeId ("Find What's Nearby").

* **Request Body (JSON)**:

  ```json
  {
    "placeId": "ChIJ...", // Place ID of the Eiffel Tower
    "query": "coffee shops",
    "radius": 3000 // Optional, in meters
  }
  ```

* **Success Response (200)**: A list of place objects, same format as `/search`.

#### `POST /api/google/directions`

* **Description**: Gets travel time/mode between two nodes ("See Travel Times Instantly").

* **Request Body (JSON)**:

  ```json
  {
    "originPlaceId": "ChIJ...",
    "destinationPlaceId": "ChIJ..."
  }
  ```

* **Success Response (200)**:

  ```json
  {
    "timeText": "22 min",
    "distanceText": "5.1 km",
    "mode": "drive"
  }
  ```

## 2. Real-Time API (Socket.io)

Used for all live collaboration.

### Connection

On the client, you must connect to the socket server and send your JWT for authentication.

```javascript
// Example client-side connection
import { io } from 'socket.io-client';

const token = "your_jwt_token"; // Get this from your auth state
const socket = io("http://localhost:5001", {
  auth: {
    token: token
  }
});
```

### Joining a Room

After connecting, you must join a trip's "room" to receive live updates.

```javascript
// Client emits this
socket.emit('joinTrip', { tripId: "trip456" });

// Server responds on success
socket.on('joinedTrip', (tripId) => {
  console.log(`Successfully joined trip ${tripId}`);
});

// Server responds on error (e.g., not authorized)
socket.on('error', (error) => {
  console.error(error.message); // e.g., "Forbidden: You do not have access to this trip"
});
```

### Client → Server Events (Emitting)

Events your frontend sends to the server.

| Event | Payload (Data Object) | Description |
|-------|-----------------------|-------------|
| `createNode` | `{ tripId, name, type, position, details, ... }` | Create a new node. |
| `moveNode` | `{ tripId, nodeId, newPosition: { x, y } }` | Update a node's position. |
| `updateNodeDetails` | `{ tripId, nodeId, newDetails: { ... } }` | Update node data (name, cost, status). |
| `deleteNode` | `{ tripId, nodeId }` | Delete a node (also deletes its links, comments, tasks). |
| `createConnection` | `{ tripId, fromNodeId, toNodeId, travelInfo }` | Create a new arrow between nodes. |
| `createComment` | `{ tripId, nodeId, text }` | Add a new comment to a node. |
| `deleteComment` | `{ commentId, tripId }` | Delete one of your own comments. |
| `createTask` | `{ tripId, nodeId, text, assignedTo? }` | Create a new task on a node. |
| `updateTask` | `{ taskId, tripId, updates: { ... } }` | Update a task (text, isCompleted, assignedTo). |
| `deleteTask` | `{ taskId, tripId }` | Delete a task. |
| `updateCursor` | `{ tripId, position: { x, y } }` | (Ephemeral) Broadcasts your cursor to others. |

### Server → Client Events (Listening)

Events your frontend listens for to update its state (e.g., Redux, Zustand, Context).

| Event | Payload (Data) | Description |
|-------|----------------|-------------|
| `nodeCreated` | `newNodeObject` | A new node was added. Add it to your state. |
| `nodeMoved` | `{ nodeId, newPosition }` | A node was moved. Update its position. |
| `nodeUpdated` | `updatedNodeObject` | A node's details changed. Update it in your state. |
| `nodeDeleted` | `nodeId` | A node was deleted. Remove it (and its comments/tasks) from state. |
| `connectionCreated` | `newConnectionObject` | A new connection was added. |
| `commentCreated` | `newCommentObject (populated)` | A new comment was added. |
| `commentDeleted` | `commentId` | A comment was deleted. Remove it. |

### Services

| Event | Payload (Data) | Description |
|-------|----------------|-------------|
| `taskCreated` | `newTaskObject (populated)` | A new task was created. |
| `taskUpdated` | `updatedTaskObject (populated)` | A task was updated. |
| `taskDeleted` | `taskId` | A task was deleted. Remove it. |
| `cursorMoved` | `{ userId, position }` | A collaborator's cursor moved. |