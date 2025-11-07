

import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { X, MessageSquare, CheckSquare, Info } from 'lucide-react';

// --- SEPARATE STABLE SELECTORS ---
const selectedNodeIdSelector = (state) => state.selectedNodeId;
const nodesSelector = (state) => state.nodes;
const socketSelector = (state) => state.socket;
const tripSelector = (state) => state.trip;
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId;

/**
 * This component shows the details for the currently selected node.
 */
const NodeEditor = () => {
  // --- SELECT EACH VALUE INDIVIDUALLY ---
  const selectedNodeId = useTripStore(selectedNodeIdSelector);
  const nodes = useTripStore(nodesSelector);
  const socket = useTripStore(socketSelector);
  const trip = useTripStore(tripSelector);
  const setSelectedNodeId = useTripStore(setSelectedNodeIdSelector);

  // React Flow bundles all properties into 'data'
  const nodeData = nodes.find((n) => n.id === selectedNodeId)?.data;
  const nodeType = nodes.find((n) => n.id === selectedNodeId)?.type;
  const isNote = nodeType === 'note';

  // ✅ FIX 4: Use the 'data' object from the node for local state
  const [localData, setLocalData] = useState(nodeData || {});

  useEffect(() => {
    // Update local state if the selected node (via nodeData) changes
    setLocalData(nodeData || {});
  }, [nodeData]);

  if (!nodeData) {
    return (
      <div className="p-4 text-foreground-secondary">No node selected.</div>
    );
  }

  // ✅ FIX 5: Create a new handler for nested 'details'
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

  // Handle input changes for root-level properties
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (JSON.stringify(localData) === JSON.stringify(nodeData)) {
      return; // No changes
    }
    if (!socket || !trip) return;

    // Emit the *entire* updated data block
    socket.emit('updateNodeDetails', {
      tripId: trip._id,
      nodeId: selectedNodeId,
      newDetails: localData, // Send the whole data object
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-foreground">
            {isNote ? 'Edit Note' : 'Edit Location'}
          </h2>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-foreground-secondary">
          {/* ✅ FIX 6: Read from nested details object */}
          {isNote
            ? 'Type: Sticky Note'
            : localData.details?.address || 'No address'}
        </p>
      </div>

      {/* Tabs (Mocked for now) */}
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
        <div>
          <label className="block text-xs font-medium text-foreground-secondary mb-1">
            {isNote ? 'Title' : 'Name'}
          </label>
          <input
            type="text"
            name="name" // Root property
            value={localData.name || ''}
            onChange={handleChange} // Use root handler
            onBlur={handleUpdate}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Conditionally show fields for LOCATIONS only */}
        {!isNote && (
          <>
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Address
              </label>
              <input
                type="text"
                name="address" // ✅ Nested property
                value={localData.details?.address || ''} // ✅ Read from nested
                onChange={handleDetailsChange} // ✅ Use nested handler
                onBlur={handleUpdate}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Status
              </label>
              <select
                name="status" // Root property
                value={localData.status || 'idea'}
                onChange={handleChange} // Use root handler
                onBlur={handleUpdate}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="idea">Idea</option>
                <option value="confirmed">Confirmed</option>
          _     <option value="booked">Booked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                name="cost" // Root property
                value={localData.cost || 0}
                onChange={handleChange} // Use root handler
                onBlur={handleUpdate}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
f             />
            </div>
          </>
        )}

        {/* Conditionally show NOTES field for NOTES only */}
        {isNote && (
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">
              Notes
            </label>
            <textarea
              name="address" // ✅ Nested property (note content)
              rows="4"
              value={localData.details?.address || ''} // ✅ Read from nested
              onChange={handleDetailsChange} // ✅ Use nested handler
              onBlur={handleUpdate}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"/>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeEditor;