// frontend/src/store/tripStore.js

import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

/**
 * Helper to format a "flat" backend node into the
 * structure React Flow expects.
 */
const formatNode = (backendNode) => {
  const { _id, position, type, ...data } = backendNode;
  return {
    id: _id, // React Flow needs 'id'
    position,
    type,
    data, // Extra properties go inside 'data'
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
    travelInfo: backendConnection.travelInfo, // Keep extra data
  };
};

/**
 * Zustand store for trip canvas
 */
export const useTripStore = create((set, get) => ({
  // --- STATE ---
  socket: null,
  trip: null,
  nodes: [],
  edges: [],
  activities: [],
  selectedNodeId: null,
  activeTool: 'select',
  modalPayload: null, // ✅ ADDED: To control the 'Add Location' modal

  // --- ACTIONS ---
  setSocket: (socket) => set({ socket }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ✅ ADDED: Modal controls
  openAddLocationModal: (payload) => set({ modalPayload: payload }),
  closeAddLocationModal: () => set({ modalPayload: null }),

  setTripData: (data) => {
    set({
      trip: data.trip,
      nodes: data.nodes.map(formatNode),
      edges: data.connections.map(formatEdge), // ✅ Format edges
      activities: data.activities || [],
      selectedNodeId: null,
    });
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  // --- REACT FLOW HANDLERS ---
  onNodesChange: (changes) => {
    // ✅ MODIFIED: Find selection changes
    const selectionChange = changes.find((c) => c.type === 'select');
    if (selectionChange) {
      // Sync our store with React Flow's selection
      set({
        selectedNodeId: selectionChange.selected ? selectionChange.id : null,
      });
    }

    // ✅ REMOVED: Filter for 'remove' type.
    // We want React Flow to handle all local changes immediately.
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    // ✅ REMOVED: Filter for 'remove' type.
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
      edges: [...state.edges, formatEdge(newEdge)],
    }));
  },

  removeEdge: (connectionId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== connectionId),
    }));
  },
}));