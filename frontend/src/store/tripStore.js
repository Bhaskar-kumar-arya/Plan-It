//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\store\tripStore.js
//================================================================================

// frontend/src/store/tripStore.js

import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { createSelector } from 'reselect';

import { getTasksForNode, getCommentsForNode } from '../api';

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
    // travelInfo removed
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
  selectedNodeTasks: [],
  selectedNodeComments: [],

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
    // 1. Update node selection in React Flow
    set((state) => ({
      selectedNodeId: nodeId,
      nodes: state.nodes.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      })),
    }));

    // 2. Fetch data or clear data
    if (nodeId) {
      // Trigger the fetch
      get().fetchTasksAndComments(nodeId);
    } else {
      // Clear data on deselect
      set({ selectedNodeTasks: [], selectedNodeComments: [] });
    }
    },

    fetchTasksAndComments: async (nodeId) => {
    try {
      // Clear old data first to show loading state
      set({ selectedNodeTasks: [], selectedNodeComments: [] });
      
      const [tasksRes, commentsRes] = await Promise.all([
        getTasksForNode(nodeId),
        getCommentsForNode(nodeId),
      ]);

      // Check if the user hasn't clicked another node while we were fetching
      if (get().selectedNodeId === nodeId) {
        set({
          selectedNodeTasks: tasksRes.data,
          selectedNodeComments: commentsRes.data,
        });
      }
    } catch (error) {
      console.error('Failed to fetch tasks/comments', error);
    }
  },

  // ... (onNodesChange, onEdgesChange, etc.) ...

  // ✅ --- NEW ACTIONS: Socket Listeners ---
  // These are called by the listeners in TripCanvasPage.jsx
  addTask: (task) => {
    // Only add if it belongs to the currently selected node
    if (get().selectedNodeId === task.nodeId) {
      set((state) => ({
        selectedNodeTasks: [...state.selectedNodeTasks, task],
      }));
    }
  },
  updateTask: (updatedTask) => {
    set((state) => ({
      selectedNodeTasks: state.selectedNodeTasks.map((t) =>
        t._id === updatedTask._id ? updatedTask : t
      ),
    }));
  },
  removeTask: ({ taskId }) => {
    set((state) => ({
      selectedNodeTasks: state.selectedNodeTasks.filter((t) => t._id !== taskId),
    }));
  },
  addComment: (comment) => {
    // Only add if it belongs to the currently selected node
    if (get().selectedNodeId === comment.nodeId) {
      set((state) => ({
        selectedNodeComments: [...state.selectedNodeComments, comment],
      }));
    }
  },

  // --- REACT FLOW HANDLERS ---

  // ✅ --- UPDATED onNodesChange ---
  // This is the bug fix. We now apply changes *only* to the
  // canvas nodes, then merge them back with the bin nodes.
  onNodesChange: (changes) => {
    // Get the *current* selected ID *before* changes
    const oldSelectedId = get().selectedNodeId;

    // Apply changes and update state
    set((state) => {
      const currentBinNodes = binNodesSelector(state);
      const currentCanvasNodes = canvasNodesSelector(state);
      const newCanvasNodes = applyNodeChanges(changes, currentCanvasNodes);

      const selectionChange = changes.find((c) => c.type === 'select');
      
      // We check for `selectionChange` to correctly determine the new ID
      // If there's no selection change, we keep the existing `state.selectedNodeId`
      const newSelectedId = selectionChange
        ? (selectionChange.selected ? selectionChange.id : null)
        : state.selectedNodeId;

      return {
        nodes: [...newCanvasNodes, ...currentBinNodes],
        selectedNodeId: newSelectedId,
      };
    });
    
    // Get the *new* selected ID *after* state has been set
    const newSelectedId = get().selectedNodeId;
    
    // Now, if the ID has changed, trigger the fetch
    if (newSelectedId !== oldSelectedId) {
      if (newSelectedId) {
        get().fetchTasksAndComments(newSelectedId);
      } else {
        // Clear data on deselect
        set({ selectedNodeTasks: [], selectedNodeComments: [] });
      }
    }
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