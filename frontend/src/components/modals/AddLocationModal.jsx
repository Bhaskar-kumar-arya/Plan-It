import React, { useState, useEffect } from 'react'; // ✅ Import useEffect
import { useTripStore } from '../../store/tripStore';
import { useReactFlow } from 'reactflow';
import { X, MapPin } from 'lucide-react';

/**
 * A modal to add a new location node.
 * It can be triggered in two ways:
 * 1. Simple 'add': Adds a node to the center of the viewport.
 * 2. 'connect': Adds a node at a specific position and connects it
 * to a source node.
 */
const AddLocationModal = () => {
  // --- Zustand Store (THE FIX) ---
  // Select each piece of state individually.
  // This prevents creating a new object on every render.
  const modalPayload = useTripStore((state) => state.modalPayload);
  const closeModal = useTripStore((state) => state.closeAddLocationModal);
  const socket = useTripStore((state) => state.socket);
  const tripId = useTripStore((state) => state.trip?._id);

  // --- React Flow ---
  const { screenToFlowPosition, setNodes } = useReactFlow();

  // --- Local State ---
  const [name, setName] = useState('');

  // --- Show/Hide Logic ---
  const isOpen = modalPayload && (modalPayload.type === 'add' || modalPayload.type === 'connect');

  // ✅ ADDED: Reset name when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  // --- Event Handlers ---
  const handleClose = () => {
    // We no longer need to reset name here, useEffect handles it.
    closeModal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !socket || !tripId) return;

    const { type } = modalPayload;
    let position;

    if (type === 'connect') {
      // Use the position from the drag-end event
      position = modalPayload.position;
    } else {
      // 'add' type: Place in the center of the current view
      position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }

    const newNodePayload = {
      tripId,
      type: 'location',
      position,
      name: name.trim(),
      details: {
        address: 'Click to add details',
      },
      status: 'idea',
      cost: 0,
    };

    // Emit 'createNode' and wait for the backend to return the created node
    socket.emit('createNode', newNodePayload, (createdNode) => {
      if (createdNode && !createdNode.error) {
        // --- Auto-Connect Logic ---
        if (type === 'connect') {
          const { sourceNodeId } = modalPayload;
          socket.emit('createConnection', {
            tripId,
            fromNodeId: sourceNodeId,
            toNodeId: createdNode._id,
          });
        }

        // --- Auto-Select Logic (Request #4) ---
        // 1. Update our app state (for the sidebar)
        useTripStore.getState().setSelectedNodeId(createdNode._id);
        // 2. Update React Flow's internal state (for the visual selection)
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === createdNode._id,
          }))
        );
      } else {
        console.error('Failed to create node:', createdNode?.error);
      }
    });

    handleClose(); // Close modal immediately
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 bg-background-secondary rounded-lg shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Add New Location
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="locationName"
            className="block text-sm font-medium text-foreground-secondary mb-2"
          >
            Location Name
          </label>
          <input
            type="text"
            id="locationName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="e.g., 'Eiffel Tower'"
          />
          <button
            type="submit"
            className="w-full mt-4 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors"
          >
            Add Location
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;