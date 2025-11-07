import React, { useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  MarkerType, // ✅ IMPORT MARKERTYPE
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useTripStore } from '../../store/tripStore';
import CustomNode from './CustomNode';
import CustomNoteNode from './CustomNoteNode';

const nodeTypes = {
  location: CustomNode,
  note: CustomNoteNode,
};

// ✅ DEFINE DEFAULT EDGE OPTIONS
const defaultEdgeOptions = {
  animated: false,
  style: {
    strokeWidth: 2,
    stroke: 'var(--border)', // Use your theme's border color
  },
  markerEnd: {
    type: MarkerType.ArrowClosed, // Add a closed arrow
    color: 'var(--accent)', // Use your theme's accent color
  },
};

// Custom shallow equality for arrays
const shallowArrayEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Stable selectors
const nodesSelector = (state) => state.nodes;
const edgesSelector = (state) => state.edges;
const onNodesChangeSelector = (state) => state.onNodesChange;
const onEdgesChangeSelector = (state) => state.onEdgesChange;
const socketSelector = (state) => state.socket;
const activeToolSelector = (state) => state.activeTool;
const setActiveToolSelector = (state) => state.setActiveTool;
const openAddLocationModalSelector = (state) => state.openAddLocationModal;

const Canvas = () => {
  const { tripId } = useParams();
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useTripStore(nodesSelector, shallowArrayEqual);
  const edges = useTripStore(edgesSelector, shallowArrayEqual);
  const onNodesChange = useTripStore(onNodesChangeSelector);
  const onEdgesChange = useTripStore(onEdgesChangeSelector);
  const socket = useTripStore(socketSelector);
  const activeTool = useTripStore(activeToolSelector);
  const setActiveTool = useTripStore(setActiveToolSelector);
  const openAddLocationModal = useTripStore(openAddLocationModalSelector);

  const connectingNodeId = useRef(null);

  const onNodeDragStop = useCallback(
    (event, node) => {
      if (!socket) return;
      socket.emit('moveNode', {
        tripId,
        nodeId: node.id,
        newPosition: node.position,
      });
    },
    [socket, tripId]
  );

  const onPaneClick = useCallback(
    (event) => {
      if (!event.target.classList.contains('react-flow__pane')) {
        return;
      }

      if (activeTool === 'addNote') {
        if (!socket) {
          console.error('Socket not connected');
          return;
        }

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNodePayload = {
          tripId,
          type: 'note',
          position,
          name: 'New Note',
          details: {
            address: 'Click to edit...', // Note content stored in 'address'
          },
          status: 'idea',
          cost: 0,
        };
        
        socket.emit('createNode', newNodePayload, (createdNode) => {
          if (createdNode && !createdNode.error) {
            useTripStore.getState().setSelectedNodeId(createdNode._id);
          }
        });
        setActiveTool('select');
      }
    },
    [
      activeTool,
      setActiveTool,
      screenToFlowPosition,
      socket,
      tripId,
    ]
  );

  const onConnect = useCallback(
    (connection) => {
      if (!socket) return;
      socket.emit('createConnection', {
        tripId,
        fromNodeId: connection.source,
        toNodeId: connection.target,
      });
    },
    [socket, tripId]
  );

  const onNodesDelete = useCallback(
    (nodesToDelete) => {
      if (!socket) return;
      for (const node of nodesToDelete) {
        socket.emit('deleteNode', {
          tripId,
          nodeId: node.id,
        });
      }
    },
    [socket, tripId]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      if (!socket) return;
      for (const edge of edgesToDelete) {
        socket.emit('deleteConnection', {
          tripId,
          connectionId: edge.id,
        });
      }
    },
    [socket, tripId]
  );

  const onConnectStart = useCallback((_, { nodeId, handleType }) => {
    connectingNodeId.current = { nodeId, handleType };
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      if (!connectingNodeId.current) return;

      const { nodeId: sourceNodeId, handleType: sourceHandleType } =
        connectingNodeId.current;

      connectingNodeId.current = null;

      if (sourceHandleType === 'target') {
        return;
      }

      if (event.target && event.target.classList.contains('react-flow__pane')) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        openAddLocationModal({
          type: 'connect',
          sourceNodeId,
          position,
        });
      }
    },
    [screenToFlowPosition, openAddLocationModal]
  );

  return (
    <div className="w-full h-full bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions} // ✅ ADD THIS PROP
        fitView
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background variant="dots" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
};

export default Canvas;