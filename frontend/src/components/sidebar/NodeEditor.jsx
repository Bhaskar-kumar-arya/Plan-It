//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\sidebar\NodeEditor.jsx
//================================================================================

import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import {
  X,
  MessageSquare,
  CheckSquare,
  Info,
  SendToBack,
} from 'lucide-react';

// --- SELECTORS ---
const selectedNodeIdSelector = (state) => state.selectedNodeId;
const nodesSelector = (state) => state.nodes;
const socketSelector = (state) => state.socket;
const tripSelector = (state) => state.trip;
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId;

// --- Helper to format date for <input type="datetime-local"> ---
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const correctedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return correctedDate.toISOString().slice(0, 16);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

/**
 * This component shows the details for the currently selected node.
 */
const NodeEditor = () => {
  const selectedNodeId = useTripStore(selectedNodeIdSelector);
  const nodes = useTripStore(nodesSelector);
  const socket = useTripStore(socketSelector);
  const trip = useTripStore(tripSelector);
  const setSelectedNodeId = useTripStore(setSelectedNodeIdSelector);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const nodeData = node?.data;
  const nodeType = node?.type;
  const isNote = nodeType === 'note';
  const isBinItem = nodeData?.displayType === 'bin';

  const [localData, setLocalData] = useState(nodeData || {});

  useEffect(() => {
    setLocalData(nodeData || {});
  }, [nodeData]);

  if (!nodeData) {
    return (
      <div className="p-4 text-foreground-secondary">No node selected.</div>
    );
  }

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value,
      },
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimingChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      timing: {
        ...prev.timing,
        [name]: value ? new Date(value).toISOString() : null,
      },
    }));
  };

  const handleUpdate = () => {
    if (JSON.stringify(localData) === JSON.stringify(nodeData)) return;
    if (!socket || !trip) return;

    socket.emit('updateNodeDetails', {
      tripId: trip._id,
      nodeId: selectedNodeId,
      newDetails: localData,
    });
  };

  const handleMoveToCanvas = () => {
    if (!socket || !trip) return;

    const updatedData = {
      ...localData,
      displayType: 'canvas',
      position: { x: 400, y: 400 },
    };

    socket.emit('updateNodeDetails', {
      tripId: trip._id,
      nodeId: selectedNodeId,
      newDetails: updatedData,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-foreground">
            {isBinItem
              ? 'Edit Idea'
              : isNote
              ? 'Edit Note'
              : 'Edit Location'}
          </h2>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-foreground-secondary">
          {isNote ? 'Type: Sticky Note' : localData.details?.address || 'No address'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button className="flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium text-accent border-b-2 border-accent">
          <Info className="h-4 w-4" />
          <span>Details</span>
        </button>
        <button className="flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground">
          <CheckSquare className="h-4 w-4" />
          <span>Tasks</span>
        </button>
        <button className="flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>Comments</span>
        </button>
      </div>

      {/* Details Form */}
      <div className="p-4 space-y-4">
        {isBinItem && (
          <button
            onClick={handleMoveToCanvas}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-accent rounded-md border border-accent/30 hover:bg-accent/10 transition-colors"
          >
            <SendToBack className="h-4 w-4" />
            Move to Canvas
          </button>
        )}

        <div>
          <label className="block text-xs font-medium text-foreground-secondary mb-1">
            {isNote ? 'Title' : 'Name'}
          </label>
          <input
            type="text"
            name="name"
            value={localData.name || ''}
            onChange={handleChange}
            onBlur={handleUpdate}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Location-only fields */}
        {!isNote && (
          <>
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={localData.details?.address || ''}
                onChange={handleDetailsChange}
                onBlur={handleUpdate}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1">
                  Arrival
                </label>
                <input
                  type="datetime-local"
                  name="arrival"
                  value={formatDateTimeLocal(localData.timing?.arrival)}
                  onChange={handleTimingChange}
                  onBlur={handleUpdate}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1">
                  Departure
                </label>
                <input
                  type="datetime-local"
                  name="departure"
                  value={formatDateTimeLocal(localData.timing?.departure)}
                  onChange={handleTimingChange}
                  onBlur={handleUpdate}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                name="cost"
                value={localData.cost || 0}
                onChange={handleChange}
                onBlur={handleUpdate}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </>
        )}

        {/* Note-only fields */}
        {isNote && (
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">
              Notes
            </label>
            <textarea
              name="address"
              rows="4"
              value={localData.details?.address || ''}
              onChange={handleDetailsChange}
              onBlur={handleUpdate}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeEditor;
