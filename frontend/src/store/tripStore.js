
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

/**
 * Helper to format a "flat" backend node into the
 * structure React Flow expects.
 */
const formatNode = (backendNode) => {
  // Destructure the known React Flow props
  const { _id, position, type, ...data } = backendNode;
  
  // Return the correct structure
  return {
    id: _id, // React Flow needs 'id'
    position,
    type,
    data: data, // All other properties (name, details, cost, status) go inside 'data'
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

  // --- ACTIONS ---
  setSocket: (socket) => set({ socket }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setTripData: (data) => {
    set({
      trip: data.trip,
      // ✅ FIX: Use the formatNode helper
      nodes: data.nodes.map(formatNode),
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
      // ✅ FIX: Use the formatNode helper on the new node
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
    // updatedNode is the full backend object
    // ✅ FIX: Use the formatNode helper to re-format it
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
      edges: [...state.edges, { ...newEdge, id: newEdge._id }],
    }));
  },
}));