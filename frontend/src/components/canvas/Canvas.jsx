//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\canvas\Canvas.jsx
//================================================================================

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useTripStore, canvasNodesSelector } from '../../store/tripStore';
import CustomNode from './CustomNode';
import CustomNoteNode from './CustomNoteNode';

const nodeTypes = {
  location: CustomNode,
  note: CustomNoteNode,
};

const defaultEdgeOptions = {
  animated: false,
  style: {
    strokeWidth: 2,
    stroke: 'var(--border)',
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: 'var(--accent)',
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

  // Get from store
  const nodes = useTripStore(canvasNodesSelector, shallowArrayEqual);
  const edges = useTripStore(edgesSelector, shallowArrayEqual);
  const onNodesChange = useTripStore(onNodesChangeSelector);
  const onEdgesChange = useTripStore(onEdgesChangeSelector);
  const socket = useTripStore(socketSelector);
  const activeTool = useTripStore(activeToolSelector);
  const setActiveTool = useTripStore(setActiveToolSelector);
  const openAddLocationModal = useTripStore(openAddLocationModalSelector);

  const connectingNodeId = useRef(null);
  const reactFlowWrapper = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Shortcut listener
  useEffect(() => {
    // Store the latest mouse position
    const handleMouseMove = (event) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleKeyDown = (event) => {
      // 1. Check for Spacebar
      if (event.code !== 'Space') {
        return;
      }

      // 2. Check if user is typing in an input (e.g., sidebar, modal)
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      
      // 3. Prevent default (page scroll)
      event.preventDefault();

      // 4. Get mouse position and convert to flow coordinates
      const { x, y } = mousePositionRef.current;
      const position = screenToFlowPosition({ x, y });

      // 5. Open the modal, passing the position
      openAddLocationModal({
        type: 'add',
        position: position,
      });
    };

    // Attach listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screenToFlowPosition, openAddLocationModal]);

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
            address: 'Click to edit...',
          },
          status: 'confirmed',
          displayType: 'canvas',
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
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
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

  const onConnectStart = useCallback((_, { nodeId, handleType, handleId }) => {
    connectingNodeId.current = { nodeId, handleType, handleId };
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      if (!connectingNodeId.current) return;

      const {
        nodeId: startNodeId,
        handleType: startHandleType,
        handleId: startHandleId,
      } = connectingNodeId.current;

      connectingNodeId.current = null;


      if (event.target && event.target.classList.contains('react-flow__pane')) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (startHandleType === 'source') {
          // Original behavior: source -> newNode
          openAddLocationModal({
            type: 'connect',
            connectionType: 'sourceToTarget',
            sourceNodeId: startNodeId,
            sourceHandle: startHandleId,
            position,
          });
        } else if (startHandleType === 'target') {
          // New behavior: newNode -> target
          openAddLocationModal({
            type: 'connect',
            connectionType: 'targetFromSource',
            targetNodeId: startNodeId,
            targetHandle: startHandleId,
            position,
          });
        }
      
      }
    },
    [screenToFlowPosition, openAddLocationModal]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes('application/json')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((event) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);

      if (!socket) return;

      try {
        const nodeData = JSON.parse(event.dataTransfer.getData('application/json'));
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNodePayload = {
          tripId,
          type: nodeData.type || 'location',
          position,
          name: nodeData.name,
          details: nodeData.details,
          status: 'confirmed',
          displayType: 'canvas',
          cost: nodeData.cost || 0,
        };

        socket.emit('createNode', newNodePayload, (createdNode) => {
          if (createdNode && !createdNode.error) {
            useTripStore.getState().setSelectedNodeId(createdNode._id);
          }
        });
      } catch (err) {
        console.error('Failed to parse drop data', err);
      }
    },
    [screenToFlowPosition, socket, tripId]
  );

  return (
    <div
      className="w-full h-full bg-background relative"
      ref={reactFlowWrapper}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
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
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background variant="dots" gap={16} size={1} />
      </ReactFlow>

      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm border-2 border-dashed border-accent pointer-events-none">
          <p className="text-accent text-lg font-semibold">
            Drop to create new node
          </p>
        </div>
      )}
    </div>
  );
};

export default Canvas;