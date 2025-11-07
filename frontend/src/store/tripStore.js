import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

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

  // --- ACTIONS ---
  setSocket: (socket) => set({ socket }),

  setTripData: (data) => {
    set({
      trip: data.trip,
      nodes: data.nodes.map((n) => ({ ...n, id: n._id })),
      edges: data.connections.map((e) => ({ ...e, id: e._id })),
      activities: data.activities || [],
      selectedNodeId: null,
    });
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  // --- REACT FLOW HANDLERS ---
  onNodesChange: (changes) => {
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
      nodes: [...state.nodes, { ...newNode, id: newNode._id }],
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
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === updatedNode._id ? { ...updatedNode, id: updatedNode._id } : n
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
      edges: [...state.edges, { ...newEdge, id: newEdge._id }],
    }));
  },
}));