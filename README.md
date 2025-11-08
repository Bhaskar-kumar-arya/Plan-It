# 🗺️ TripCanvas: MERNIFY Hackathon Submission

**TripCanvas** is a real-time, collaborative trip planning application built for the MERNIFY Hackathon.

TripCanvas provides a shared digital space where multiple users can plan complex, multi-stop trips in real-time. It's a visual, intuitive, and feature-rich platform that goes beyond simple messaging, focusing on creative collaboration and planning.

---

### 🚀 Demo Video

[soon]

---

### ✨ Core Features

TripCanvas is packed with features designed for seamless, real-time collaboration.

#### 1. 🌐 Real-Time Collaboration
* **Live Canvas:** All nodes (locations, notes) and connections are synced in real-time across all collaborators.
* **Live Presence:** See who's currently online and viewing the trip with live avatars in the top bar.
* **Real-time Voice Chat:** Join a WebRTC-powered voice channel to discuss plans live with your team, no external software needed.(though this feature rn has a bug and doesnt always work)
* **Shared Tasks:** A collaborative to-do list for each location (e.g., "Book flight," "Reserve table").
* **Live Comments:** A real-time comment thread for every node, perfect for discussions.

#### 2. 🎨 Visual Planning Canvas
* **Infinite Canvas:** Built with React Flow, the canvas provides a limitless space to drag, drop, and organize your ideas.
* **Location Nodes:** Add any location using a powerful geocoding search (powered by the Photon API, though backend also has google's maps api setup , but due to lack of api key availability , had to use a free api).
* **Note Nodes:** Add sticky notes for general information, reminders, or un-mappable ideas.
* **Connect the Dots:** Draw connections between nodes to visualize your itinerary's flow.

#### 3. 🛠️ Productivity & Planning Tools
* **Find Nearby:** Select any location node and use the "Find Nearby" tool to discover points of interest (like "coffee" or "museums") in the area.
* **Idea Bin:** A holding area for potential locations and ideas. Drag them onto the canvas when you're ready to add them to the itinerary.
* **Budget Tracker:** The sidebar features a budget tracker that automatically sums the "cost" field of every location on your canvas.
* **Share & Join:** Easily share your trip with a unique **Trip ID** and a **Share Code** (password). New users can join instantly from their dashboard.
* **predictive locations** add location nodes with predictive locations modal
---

### 💻 Tech Stack

This project is a full-stack MERN application, adhering to the hackathon's technical guidelines.

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js | UI/UX Development |
| | Zustand | Lightweight global state management. |
| | React Flow | Powering the interactive, node-based canvas. |
| | TailwindCSS | For a clean, modern, and polished UI. |
| **Backend** | Node.js | JavaScript runtime environment. |
| | Express.js | Backend API framework. |
| | MongoDB | NoSQL database for storing all trip data. |
| | Mongoose | Object Data Modeling (ODM) for MongoDB. |
| **Real-time** | Socket.io | WebSockets for all live collaboration features. |
| | WebRTC | Peer-to-peer connection for real-time voice chat. |
| **Services** | JWT | Secure authentication. |
| | Photon API | Open-source geocoding for place search. |

---

### Run the app deployed on Render
#### open website [https://plan-it-frontend-gv0d.onrender.com]

### 🔧 Setup Instructions Local

To run this project locally, you'll need Node.js and MongoDB installed.

#### 1. Backend Setup

```bash
cd backend
npm install
touch .env
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
touch .env
```

#### 3. Running the App

```bash
# Backend
npm start

# Frontend
npm run dev
```

---


