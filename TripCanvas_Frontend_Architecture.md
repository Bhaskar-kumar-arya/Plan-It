# TripCanvas: Frontend Architecture Plan

This document outlines the frontend plan for the **TripCanvas** application, built with **React.js** and designed for a real-time, high-performance, and polished user experience.

---

## 1. Core Tech Stack

- **Framework:** React.js  
- **Canvas Library:** React Flow  
  This is the most critical library. It provides the out-of-the-box solution for rendering nodes and connections, handling panning, zooming, and element selection. This saves us from building a complex SVG canvas from scratch.

- **State Management:** Zustand  
  A lightweight, fast, and simple global state manager. We will use this to hold the "single source of truth" for all trip data (nodes, connections, users) and the Socket.io instance. It's much simpler than Redux for a hackathon.

- **Styling:** Tailwind CSS  
  Hits the "Polished UI" bonus. We will use its dark mode utilities (`dark:bg-gray-900`, etc.) to implement the dark theme.

- **Routing:** React Router (`react-router-dom`)  
  To handle navigation between the login/register pages, the user's dashboard, and the main TripCanvas page.

- **Real-Time:** Socket.io Client  
- **Data Fetching:** Axios (for clean API requests and easy auth header management)  
- **Icons:** lucide-react (for a clean, modern icon set that fits the theme).

---

## 2. Frontend Folder Structure

This structure separates concerns and makes the app easy to manage.

```
/src
  ├── /api
  │   └── index.js       // All Axios API functions (login, getTripData, etc.)
  ├── /components
  │   ├── /canvas        // All components related to React Flow
  │   │   ├── Canvas.jsx     // The main <ReactFlow> component wrapper
  │   │   └── CustomNode.jsx // Our styled, dark-theme Location Node
  │   ├── /layout        // The main UI structure
  │   │   ├── TopBar.jsx
  │   │   ├── LeftToolbar.jsx
  │   └── /sidebar       // Components for the Right Sidebar
  │       ├── RightSidebar.jsx // Main container
  │       ├── IdeaBin.jsx
  │       ├── BudgetTracker.jsx
  │       └── NodeEditor.jsx   // Shows Details, Tasks, Comments
  ├── /hooks
  │   └── useSocket.js   // A custom hook to initialize and manage socket listeners
  ├── /pages
  │   ├── Login.jsx
  │   ├── Register.jsx
  │   ├── Dashboard.jsx      // Shows the user's list of trips
  │   └── TripCanvasPage.jsx // The main application page
  ├── /store
  │   └── store.js         // Zustand global state store
  ├── /utils
  │   └── ProtectedRoute.jsx // Handles authentication logic
  └── App.jsx                // Main router setup
```

---

## 3. State Management (Zustand Store)

Our `store.js` file will be the **"brain"** of the app. It holds all shared data and the core real-time logic.

### State:
- `socket`: The active Socket.io instance  
- `trip`: The current trip's details (`{ name, owner, collaborators }`)  
- `nodes`: An array of Node objects for React Flow  
- `edges`: An array of Edge objects (connections) for React Flow  
- `activities`: The array for the Version History feed  
- `selectedNodeId`: The ID of the node the user has clicked on  

### Actions (Functions in the store):
- `initSocket(token)`: Connects to the Socket.io server and sets up all listeners.  
- `fetchTripData(tripId)`: Calls the `GET /api/trips/:tripId` endpoint and populates `trip`, `nodes`, `edges`, and `activities`.  
- `addNode(nodeData)`: Adds a new node to the `nodes` array.  
- `updateNodePosition(nodeId, newPosition)`: Updates a node's position.  
- `deleteNode(nodeId)`: Removes a node from the `nodes` array.  
- `setSelectedNodeId(nodeId)`: Sets the currently selected node to show in the sidebar.  

---

## 4. Component & Data Flow (The User Experience)

This is how the main components interact.

### `TripCanvasPage.jsx` (The Conductor):
1. On mount, it gets the `tripId` from the URL.  
2. It calls the `fetchTripData(tripId)` action from the Zustand store.  
3. It calls the `initSocket(token)` action from the Zustand store.  
4. This component’s `initSocket` function is where we define all Socket.io listeners (e.g., `socket.on('nodeCreated', ...)`).  
5. When a listener fires, it calls the corresponding action in the Zustand store (e.g., `socket.on('nodeMoved', (data) => useStore.getState().updateNodePosition(data.nodeId, data.position))`).  
6. It renders the main layout: **TopBar, LeftToolbar, RightSidebar, and Canvas.**  

### `Canvas.jsx` (The Interactive Map):
- Renders the `<ReactFlow>` component.  
- Subscribes to the `nodes` and `edges` arrays from the Zustand store.  
- Passes `CustomNode.jsx` to the `nodeTypes` prop of React Flow.  
- Defines emitters for user actions, e.g.:  
  - `onNodeDragStop`: Emits `socket.emit('moveNode', ...)`.  
  - `onNodeClick`: Calls `useStore.getState().setSelectedNodeId(...)`.  
  - `onConnect`: Emits `socket.emit('createConnection', ...)`.  

**Result:** When the store updates (from a socket event), React Flow automatically re-renders with the new data. No manual DOM manipulation is needed.

### `RightSidebar.jsx` (The Context Panel):
- Subscribes to `selectedNodeId` from the Zustand store.  
- If `selectedNodeId` is `null`: It renders the `IdeaBin` and `BudgetTracker` components.  
- If `selectedNodeId` is set: It renders the `NodeEditor` component and passes it the node’s data.  
- When a user updates a detail (e.g., changes arrival time), the `NodeEditor` emits the change directly via `socket.emit('updateNodeDetails', ...)`.  

---

## 5. The Real-Time Loop (Example: Moving a Node)

This is the core of the collaboration:

1. **User A** drags a CustomNode on their screen.  
2. The `Canvas.jsx` component’s `onNodeDragStop` event fires.  
3. It gets the socket from the Zustand store and emits:  
   ```js
   socket.emit('moveNode', { nodeId: '...', position: {...} });
   ```  
4. The Backend receives this, updates MongoDB, and broadcasts to the room.  
5. **User B’s** `TripCanvasPage.jsx` catches the `socket.on('nodeMoved', ...)` event.  
6. It calls the Zustand action: `useStore.getState().updateNodePosition(...)`.  
7. **User B’s** Zustand store updates.  
8. **User B’s** `Canvas.jsx` component automatically re-renders, and the node moves on their screen.  
   → No manual DOM manipulation is needed.  

---

## 6. Authentication Flow

- `App.jsx` defines all routes (Login, Register, Dashboard, TripCanvasPage).  
- The `/dashboard` and `/tripcanvas/:id` routes are wrapped in a `ProtectedRoute.jsx` component.  

### `Login.jsx`:
- User submits form. We call our `api.login()` function.  
- On success:
  ```js
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  navigate('/dashboard');
  ```

### `ProtectedRoute.jsx`:
- Checks `localStorage` for a token.  
- **Token exists?** → Renders the requested page.  
- **No token?** → Redirects to `/login`.  

### Logout:
- A button in the TopBar clears the token from `localStorage`, removes the axios header, and navigates to `/login`.

---
