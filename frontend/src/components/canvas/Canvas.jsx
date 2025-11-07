
import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useTripStore } from '../../store/tripStore';
import CustomNode from './CustomNode';
import CustomNoteNode from './CustomNoteNode';

const nodeTypes = {
  location: CustomNode,
  note: CustomNoteNode,
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
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId;
const activeToolSelector = (state) => state.activeTool;
const setActiveToolSelector = (state) => state.setActiveTool;

const Canvas = () => {
  const { tripId } = useParams();
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useTripStore(nodesSelector, shallowArrayEqual);
  const edges = useTripStore(edgesSelector, shallowArrayEqual);
  const onNodesChange = useTripStore(onNodesChangeSelector);
  const onEdgesChange = useTripStore(onEdgesChangeSelector);
  const socket = useTripStore(socketSelector);
  const setSelectedNodeId = useTripStore(setSelectedNodeIdSelector);
  const activeTool = useTripStore(activeToolSelector);
  const setActiveTool = useTripStore(setActiveToolSelector);

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

  const onNodeClick = useCallback(
    (event, node) => {
      // This is the only place selection should happen
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(
    (event) => {
      // ✅ --- FIX ---
      // We only want to run this logic if the click was *directly* on the pane.
      // React Flow adds the 'react-flow__pane' class to the background.
      // If the click target doesn't have this class, it was on a node, edge,
      // or control, and we should ignore it.
      if (!event.target.classList.contains('react-flow__pane')) {
        return;
      }
      // ✅ --- END FIX ---

      // If we are here, the click was on the background.
      
      // If select tool is active, deselect.
      if (activeTool === 'select') {
        setSelectedNodeId(null);
        return;
      }

      // If add tool is active, create a new node
      if (activeTool === 'addLocation' || activeTool === 'addNote') {
        if (!socket) {
          console.error('Socket not connected');
          return;
        }

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const nodeType = activeTool === 'addLocation' ? 'location' : 'note';

        let newNodePayload;

        if (nodeType === 'location') {
          newNodePayload = {
            tripId,
            type: 'location',
            position,
            name: 'New Location',
            details: {
              address: 'Click to add details',
            },
            status: 'idea',
            cost: 0,
          };
        } else {
          newNodePayload = {
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
        }

        socket.emit('createNode', newNodePayload);
        setActiveTool('select');
      }
    },
    [
      activeTool,
      setActiveTool,
      setSelectedNodeId,
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
        // ✅ FIX: Rename 'source' to 'fromNodeId'
        fromNodeId: connection.source,
        // ✅ FIX: Rename 'target' to 'toNodeId'
        toNodeId: connection.target,
      });
    },
    [socket, tripId]
  );
const onNodesDelete = useCallback(
    (nodesToDelete) => {
      if (!socket) return;
      // Loop and emit an event for each node
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
      // Loop and emit an event for each edge
      for (const edge of edgesToDelete) {
        socket.emit('deleteConnection', {
          tripId,
          connectionId: edge.id,
        });
      }
    },
    [socket, tripId]
  );
  return (
      <div className="w-full h-full bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete} 
          onEdgesDelete={onEdgesDelete} 
          nodeTypes={nodeTypes}
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