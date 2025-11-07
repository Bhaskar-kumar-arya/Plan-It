//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\modals\AddLocationModal.jsx
//================================================================================

import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { useReactFlow } from 'reactflow'; // ✅ --- We still need screenToFlowPosition ---
import { X, MapPin } from 'lucide-react';

/**
 * A modal to add a new location node.
 * It can be triggered in three ways:
 * 1. 'add': From left toolbar. Creates a 'canvas' node.
 * 2. 'connect': From dragging edge. Creates a 'canvas' node.
 * 3. 'bin': From Idea Bin. Creates a 'bin' node.
 */
const AddLocationModal = () => {
  // --- Zustand Store ---
  const modalPayload = useTripStore((state) => state.modalPayload);
  const closeModal = useTripStore((state) => state.closeAddLocationModal);
  const socket = useTripStore((state) => state.socket);
  const tripId = useTripStore((state) => state.trip?._id);

  // --- React Flow ---
  // ✅ --- REMOVED setNodes, we only need screenToFlowPosition ---
  const { screenToFlowPosition } = useReactFlow();

  // --- Local State ---
  const [name, setName] = useState('');

  // --- Show/Hide Logic ---
  const isOpen =
    modalPayload &&
    (modalPayload.type === 'add' ||
      modalPayload.type === 'connect' ||
      modalPayload.type === 'bin');

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
    closeModal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !socket || !tripId) return;

    const { type } = modalPayload;
    let position;
    let displayType;
    let status;

    if (type === 'bin') {
      position = { x: 0, y: 0 };
      displayType = 'bin';
      status = 'idea';
    } else {
      displayType = 'canvas';
      status = 'confirmed';
      if (type === 'connect') {
        position = modalPayload.position;
      } else {
        position = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }
    }

    const newNodePayload = {
      tripId,
      type: 'location',
      position,
      name: name.trim(),
      details: {
        address: 'Click to add details',
      },
      status,
      displayType,
       cost: 0,
    };

    socket.emit('createNode', newNodePayload, (createdNode) => {
      if (createdNode && !createdNode.error) {
        if (type === 'connect') {
          const { sourceNodeId, sourceHandle } = modalPayload;
          socket.emit('createConnection', {
            tripId,
            fromNodeId: sourceNodeId,
           toNodeId: createdNode._id,
            sourceHandle: sourceHandle,
            targetHandle: null,
          });
        }

        // --- Auto-Select Logic ---
        if (displayType === 'canvas') {
          // ✅ --- THIS IS ALL WE NEED ---
          // The store will handle updating the 'selected' prop
          // which will cause React Flow to re-render with the border.
          useTripStore.getState().setSelectedNodeId(createdNode._id);
          // ✅ --- REMOVED IMPERATIVE setNodes(...) CALL ---
        }
      } else {
        console.error('Failed to create node:', createdNode?.error);
      }
    });

    handleClose();
  };

  // ... (return JSX remains the same) ...
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 bg-background-secondary rounded-lg shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            {modalPayload.type === 'bin' ? 'Add New Idea' : 'Add New Location'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
Click to see difference          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="locationName"
            className="block text-sm font-medium text-foreground-secondary mb-2"
          >
            {modalPayload.type === 'bin' ? 'Idea Name' : 'Location Name'}
          </label>
          <input
            type="text"
            id="locationName"
            value={name}
            onChange={(e) => setName(e.target.value)}
_           autoFocus
            className="w-full px-3 py-2 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="e.g., 'Eiffel Tower'"
          />
          <button
            type="submit"
           className="w-full mt-4 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors"
          >
            {modalPayload.type === 'bin' ? 'Add Idea' : 'Add Location'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;