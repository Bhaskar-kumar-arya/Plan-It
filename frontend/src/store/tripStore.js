//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\store\tripStore.js
//================================================================================

// frontend/src/store/tripStore.js

import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { createSelector } from 'reselect';

// ... (formatNode, formatEdge, selectNodes, canvasNodesSelector, binNodesSelector helpers remain the same) ...
const formatNode = (backendNode) => {
  const { _id, position, type, ...data } = backendNode;
  return {
    id: _id,
    position,
    type,
    data,
  };
};
const formatEdge = (backendConnection) => {
  return {
    id: backendConnection._id,
    source: backendConnection.fromNodeId,
    target: backendConnection.toNodeId,
    sourceHandle: backendConnection.sourceHandle,
    targetHandle: backendConnection.targetHandle,
    travelInfo: backendConnection.travelInfo,
  };
};
const selectNodes = (state) => state.nodes;
export const canvasNodesSelector = createSelector(
  [selectNodes],
  (nodes) => nodes.filter((n) => n.data.displayType === 'canvas')
);
export const binNodesSelector = createSelector(
  [selectNodes],
  (nodes) => nodes.filter((n) => n.data.displayType === 'bin')
);


export const useTripStore = create((set, get) => ({
  // ... (state remains the same) ...
  socket: null,
  trip: null,
  nodes: [],
  edges: [],
  activities: [],
  selectedNodeId: null,
  activeTool: 'select',
  modalPayload: null,
  isShareModalOpen: false,
  liveUsers: [],

  // ... (actions setSocket, setActiveTool, modals, setTripData remain the same) ...
  setSocket: (socket) => set({ socket }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  openAddLocationModal: (payload) => set({ modalPayload: payload }),
  closeAddLocationModal: () => set({ modalPayload: null }),
  openShareModal: () => set({ isShareModalOpen: true }),
  closeShareModal: () => set({ isShareModalOpen: false }),
  setTripData: (data) => {
    set({
      trip: data.trip,
      nodes: data.nodes.map(formatNode),
      edges: data.connections.map(formatEdge),
      activities: data.activities || [],
      selectedNodeId: null,
      liveUsers: [],
    });
  },

  // ✅ --- UPDATED setSelectedNodeId ---
  // This now handles updating the 'selected' prop on the nodes array,
  // which tells React Flow to draw the blue border.
  setSelectedNodeId: (nodeId) => {
    set((state) => ({
      selectedNodeId: nodeId,
      nodes: state.nodes.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      })),
    }));
  },

  // --- REACT FLOW HANDLERS ---

  // ✅ --- UPDATED onNodesChange ---
  // This is the bug fix. We now apply changes *only* to the
  // canvas nodes, then merge them back with the bin nodes.
  onNodesChange: (changes) => {
    set((state) => {
      // Get the current state of bin and canvas nodes
      const currentBinNodes = binNodesSelector(state);
      const currentCanvasNodes = canvasNodesSelector(state);

      // Apply the changes only to the canvas nodes
      const newCanvasNodes = applyNodeChanges(changes, currentCanvasNodes);

      // Check if a selection change occurred
      const selectionChange = changes.find((c) => c.type === 'select');
      const newSelectedId = selectionChange
        ? (selectionChange.selected ? selectionChange.id : null)
        : state.selectedNodeId; // Keep existing if no change

      return {
        // The new 'nodes' state is the *combination* of the
        // updated canvas nodes and the untouched bin nodes.
        nodes: [...newCanvasNodes, ...currentBinNodes],
        selectedNodeId: newSelectedId,
      };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  // ... (Socket listener actions addNode, updateNodePos, etc. remain the same) ...
  // ...
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
  setLiveUsers: (users) => set({ liveUsers: users }),
}));