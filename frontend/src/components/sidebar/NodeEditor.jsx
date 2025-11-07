import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { X, MessageSquare, CheckSquare, Info } from 'lucide-react';

// ✅ --- SEPARATE STABLE SELECTORS ---
const selectedNodeIdSelector = (state) => state.selectedNodeId;
const nodesSelector = (state) => state.nodes;
const socketSelector = (state) => state.socket;
const tripSelector = (state) => state.trip;
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId;

/**
 * This component shows the details for the currently selected node.
 */
const NodeEditor = () => {
  // ✅ --- SELECT EACH VALUE INDIVIDUALLY ---
  const selectedNodeId = useTripStore(selectedNodeIdSelector);
  const nodes = useTripStore(nodesSelector);
  const socket = useTripStore(socketSelector);
  const trip = useTripStore(tripSelector);
  const setSelectedNodeId = useTripStore(setSelectedNodeIdSelector);

  const node = nodes.find((n) => n.id === selectedNodeId);

  // Local state for controlled inputs
  const [localDetails, setLocalDetails] = useState(node?.data || {});

  useEffect(() => {
    // Update local state if the selected node changes
    setLocalDetails(node?.data || {});
  }, [node]);

  if (!node) {
    return (
      <div className="p-4 text-foreground-secondary">No node selected.</div>
    );
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Handle "blur" or "debounce" to send update
  const handleUpdate = () => {
    // Check if data has actually changed
    if (JSON.stringify(localDetails) === JSON.stringify(node.data)) {
      return;
    }
    if (!socket) return; // Add guard

    // Emit the update to the server
    socket.emit('updateNodeDetails', {
      tripId: trip._id,
      nodeId: node.id,
      newDetails: localDetails,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-foreground">
            Edit Location
          </h2>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-foreground-secondary">
          {localDetails.address || 'No address'}
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
            Name
          </label>
          <input
            type="text"
            name="name"
            value={localDetails.name || ''}
            onChange={handleChange}
            onBlur={handleUpdate}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground-secondary mb-1">
            Status
          </label>
          <select
            name="status"
            value={localDetails.status || 'idea'}
            onChange={handleChange}
            onBlur={handleUpdate}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="idea">Idea</option>
            <option value="confirmed">Confirmed</option>
            <option value="booked">Booked</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground-secondary mb-1">
            Estimated Cost ($)
          </label>
          <input
            type="number"
            name="cost"
            value={localDetails.cost || 0}
            onChange={handleChange}
            onBlur={handleUpdate}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground-secondary mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows="4"
            value={localDetails.notes || ''}
            onChange={handleChange}
            onBlur={handleUpdate}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;