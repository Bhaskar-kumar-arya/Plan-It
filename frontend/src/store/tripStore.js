//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\store\tripStore.js
//================================================================================

// frontend/src/store/tripStore.js

import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { createSelector } from 'reselect'; // ✅ Import reselect

/**
 * Helper to format a "flat" backend node into the
 * structure React Flow expects.
 */
const formatNode = (backendNode) => {
  // ✅ All properties are now spread into 'data' except id, position, type
  const { _id, position, type, ...data } = backendNode;
  return {
    id: _id,
    position,
    type,
    data, // This now includes 'name', 'status', 'displayType', 'details', etc.
  };
};

/**
 * Helper to format a backend connection into the
 * structure React Flow expects.
 */
const formatEdge = (backendConnection) => {
  return {
    id: backendConnection._id, // React Flow needs 'id'
    source: backendConnection.fromNodeId, // React Flow needs 'source'
    target: backendConnection.toNodeId, // React Flow needs 'target'
    // ✅ --- ADDED ---
    sourceHandle: backendConnection.sourceHandle,
    targetHandle: backendConnection.targetHandle,
    // ✅ --- END ---
    travelInfo: backendConnection.travelInfo, // Keep extra data
  };
};

// --- ✅ NEW SELECTORS ---
// Base selector for all nodes
const selectNodes = (state) => state.nodes;

// Memoized selector for nodes visible on the canvas
export const canvasNodesSelector = createSelector(
  [selectNodes],
  (nodes) => nodes.filter((n) => n.data.displayType === 'canvas')
);

// Memoized selector for nodes visible in the Idea Bin
export const binNodesSelector = createSelector(
  [selectNodes],
  (nodes) => nodes.filter((n) => n.data.displayType === 'bin')
);
// --- END OF NEW SELECTORS ---

/**
 * Zustand store for trip canvas
 */
export const useTripStore = create((set, get) => ({
  // --- STATE ---
  socket: null,
  trip: null,
  nodes: [], // This will hold ALL nodes (bin and canvas)
  edges: [],
  activities: [],
  selectedNodeId: null,
  activeTool: 'select',
  modalPayload: null,
  isShareModalOpen: false, // ✅ --- ADDED ---

  // --- ACTIONS ---
  setSocket: (socket) => set({ socket }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  openAddLocationModal: (payload) => set({ modalPayload: payload }),
  closeAddLocationModal: () => set({ modalPayload: null }),

  // ✅ --- ADDED SHARE MODAL ACTIONS ---
  openShareModal: () => set({ isShareModalOpen: true }),
  closeShareModal: () => set({ isShareModalOpen: false }),
  // ✅ --- END ---

  setTripData: (data) => {
    set({
      trip: data.trip,
      nodes: data.nodes.map(formatNode), // Format all nodes
      edges: data.connections.map(formatEdge), // Format all edges
      activities: data.activities || [],
      selectedNodeId: null,
    });
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  // --- REACT FLOW HANDLERS ---
  onNodesChange: (changes) => {
    const selectionChange = changes.find((c) => c.type === 'select');
    if (selectionChange) {
      set({
        selectedNodeId: selectionChange.selected ? selectionChange.id : null,
      });
    }

    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  // --- SOCKET LISTENER ACTIONS ---
  addNode: (newNode) => {
    set((state) => ({
      nodes: [...state.nodes, formatNode(newNode)],
    }));
  },

  updateNodePos: ({ nodeId, newPosition }) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position: newPosition } : n
      ),
    }));
  },

  updateNodeDetails: (updatedNode) => {
    const formatted = formatNode(updatedNode);
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === formatted.id ? formatted : n
      ),
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  addEdge: (newEdge) => {
    set((state) => ({
      edges: [...state.edges, formatEdge(newEdge)], // Use formatter
    }));
  },

  removeEdge: (connectionId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== connectionId),
    }));
  },
}));