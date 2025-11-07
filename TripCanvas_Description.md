# TripCanvas: A Visual & Collaborative Trip Planner

## 1. The Core Idea
TripCanvas is a real-time, visual, and collaborative web application designed to solve the chaos of group travel planning.

It replaces the standard (and messy) process of using fragmented group chats, static lists, and complex spreadsheets. It provides a shared digital canvas where users can visually build, organize, and finalize a complex travel itinerary together.

By integrating directly with Google Maps, it moves beyond a simple whiteboard, offering intelligent, data-rich planning. It's a tool for turning a group's ideas into a concrete, actionable plan.

---

## 2. Core Features

### A. The Visual Itinerary Canvas
The "canvas" is the main screen where all planning happens. It's like an infinite, smart whiteboard for your trip.

- **Create Nodes:** Users can add "Location Nodes" (e.g., hotels, landmarks, restaurants) onto the canvas. These are like smart sticky notes for places.
- **Create a Flow:** Users can draw arrows between nodes to create a visual flow for the trip (e.g., from "Airport" to "Hotel" to "First Landmark").
- **Add Details:** Each node can be clicked to add rich details:
  - Arrival & Departure Times
  - Estimated Cost (for budgeting)
  - Status (Idea, Confirmed, Booked)
  - Notes & Checklists (e.g., "Buy tickets in advance")
- **Dual View:** A powerful toggle lets users instantly switch between two views:
  - 🎨 **Canvas View:** The free-form, creative layout for brainstorming and planning.
  - 📋 **Itinerary View:** A "flattened," clean, step-by-step list generated from the canvas, perfect for use during the actual trip.

### B. Smart Google Maps Integration
This is what makes the canvas "smart" and saves planners time.

- **Find Any Place:** Instantly find and add specific locations, like “Eiffel Tower” or “JFK Airport.”
- **Discover New Places:** Search like “restaurants in Bengaluru” to get smart suggestions.
- **Find What's Nearby:** Right-click a node and “Find Nearby…” (e.g., “coffee shops”).
- **See Travel Times Instantly:** When connecting two nodes, the app automatically shows the travel time and mode (e.g., "🚗 22 min drive").

### C. Real-Time Team Collaboration
TripCanvas is built for teamwork.

- **See It Live:** All users see each other’s actions instantly.
- **Idea Bin:** A shared sidebar where collaborators add “potential” locations for discussion.
- **Focused Discussions:**
  - Per-Node Comments: Discussion threads for each location.
  - Per-Node Tasks: Assign checklist items (e.g., @UserA - Book tickets).
- **Shared Budget:** A live dashboard sums all node costs into a total trip budget.

### D. Planning & Safety Features
- **Activity Feed:** A “History” panel shows a full action log.
- **User Roles:**
  - Admin (Creator): Full control and invites.
  - Editor: Can edit plans.
  - Viewer: Read-only access.

---

## 3. How It Looks: UI Composition

The main application screen is divided into four areas:

### 🔝 Top Navigation Bar
Contains:
- Logo & Trip Title
- View Toggle ([ 🎨 Canvas ] [ 📋 Itinerary ])
- Live collaborator avatars & Share button

### ⬅️ Left Toolbar
- Select Tool (Cursor)
- Add Location (Map Pin)
- Add Note (Sticky Note)
- Zoom Controls

### ⬜ Center Stage (Canvas)
- Zoomable and pannable
- Nodes (location cards)
- Connectors (travel lines showing time & mode)
- Live cursors of collaborators

### ➡️ Right Sidebar
Changes dynamically based on context.

- **Default View:** Shows Idea Bin 💡 and Trip Budget 💸
- **Node View:** When a node is selected:
  - 📝 Details
  - ✅ Tasks
  - 💬 Comments

---

## 4. How It Looks: Theme & Atmosphere

- **Palette:**
  - Background: Deep dark gray
  - Panels: Slightly lighter gray for separation
  - Canvas: Distinct dark gray with a dotted grid
  - Accent Color: Vibrant blue or aqua
  - Text: Off-white and light gray

- **Structure & Feel:**
  - Focus-driven dark theme
  - Clean lines & visual hierarchy
  - Subtle interactive feedback (hover/active glow)

---

## 5. Example User Flow

1. User A creates a trip “Bengaluru Tech Tour.”
2. User B joins as an Editor.
3. User A adds “Kempegowda International Airport.”
4. User B adds “MTR 1924” to Idea Bin.
5. User A finds nearby “Taj Bangalore” and connects it to Airport.
6. Travel line appears showing “🚗 5 min drive.”
7. User B drags “MTR 1924” to canvas and comments, “We have to go here for breakfast.”
8. User A views “History” showing all recent actions.
9. Both switch to 📋 Itinerary View to see the step-by-step plan.
