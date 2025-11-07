import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import { useTripStore } from '../../store/tripStore';
import CustomNode from './CustomNode';

// ✅ Memoized node types outside the component
const nodeTypes = { custom: CustomNode };

// ✅ Custom equality function for arrays
const shallowArrayEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// ✅ Selectors with custom equality
const nodesSelector = (state) => state.nodes;
const edgesSelector = (state) => state.edges;
const onNodesChangeSelector = (state) => state.onNodesChange;
const onEdgesChangeSelector = (state) => state.onEdgesChange;
const socketSelector = (state) => state.socket;
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId;

const Canvas = () => {
  const { tripId } = useParams();

  // ✅ Use custom equality for arrays
  const nodes = useTripStore(nodesSelector, shallowArrayEqual);
  const edges = useTripStore(edgesSelector, shallowArrayEqual);
  const onNodesChange = useTripStore(onNodesChangeSelector);
  const onEdgesChange = useTripStore(onEdgesChangeSelector);
  const socket = useTripStore(socketSelector);
  const setSelectedNodeId = useTripStore(setSelectedNodeIdSelector);

  // --- Handlers wrapped in useCallback ---
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
    (event, node) => setSelectedNodeId(node.id),
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(
    () => setSelectedNodeId(null),
    [setSelectedNodeId]
  );

  const onConnect = useCallback(
    (connection) => {
      if (!socket) return;
      socket.emit('createConnection', {
        tripId,
        source: connection.source,
        target: connection.target,
      });
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