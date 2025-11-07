import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { useReactFlow } from 'reactflow';
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
  const { screenToFlowPosition, setNodes } = useReactFlow();

  // --- Local State ---
  const [name, setName] = useState('');

  // --- Show/Hide Logic ---
  const isOpen =
    modalPayload &&
    (modalPayload.type === 'add' ||
      modalPayload.type === 'connect' ||
      modalPayload.type === 'bin'); // ✅ Listen for 'bin' type

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

    // ✅ --- NEW LOGIC ---
    if (type === 'bin') {
      // Adding to the Idea Bin
      position = { x: 0, y: 0 }; // Position doesn't matter for bin
      displayType = 'bin';
      status = 'idea'; // Items in the bin are always 'idea'
    } else {
      // Adding to the canvas
      displayType = 'canvas';
      status = 'confirmed'; // Default for new canvas items

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
    }
    // ✅ --- END OF NEW LOGIC ---

    const newNodePayload = {
      tripId,
      type: 'location',
      position,
      name: name.trim(),
      details: {
        address: 'Click to add details',
      },
      status, // ✅ Set dynamic status
      displayType, // ✅ Set dynamic displayType
      cost: 0,
    };

    // Emit 'createNode' and wait for the backend to return the created node
    socket.emit('createNode', newNodePayload, (createdNode) => {
      if (createdNode && !createdNode.error) {
        // ✅ --- UPDATED AUTO-CONNECT LOGIC ---
        if (type === 'connect') {
          // Get the source handle from the payload
          const { sourceNodeId, sourceHandle } = modalPayload;
          socket.emit('createConnection', {
            tripId,
            fromNodeId: sourceNodeId,
            toNodeId: createdNode._id,
            sourceHandle: sourceHandle, // <-- Pass the source handle
            targetHandle: null, // Let backend/db default to null
          });
        }
        // ✅ --- END ---

        // --- Auto-Select Logic (only for canvas nodes) ---
        if (displayType === 'canvas') {
          useTripStore.getState().setSelectedNodeId(createdNode._id);
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              selected: n.id === createdNode._id,
            }))
          );
        }
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
            {/* ✅ Dynamic Title */}
            {modalPayload.type === 'bin' ? 'Add New Idea' : 'Add New Location'}
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
            {/* ✅ Dynamic Label */}
            {modalPayload.type === 'bin' ? 'Idea Name' : 'Location Name'}
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
            {/* ✅ Dynamic Button Text */}
            {modalPayload.type === 'bin' ? 'Add Idea' : 'Add Location'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;