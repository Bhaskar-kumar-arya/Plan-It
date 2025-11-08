import React, { useState, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { useReactFlow } from 'reactflow';
import { X, MapPin } from 'lucide-react';

const AddLocationModal = () => {
  const modalPayload = useTripStore((state) => state.modalPayload);
  const closeModal = useTripStore((state) => state.closeAddLocationModal);
  const socket = useTripStore((state) => state.socket);
  const tripId = useTripStore((state) => state.trip?._id);
  const { screenToFlowPosition } = useReactFlow();
  const [name, setName] = useState('');

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
      } else if (modalPayload.position) {
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
      details: { address: '' },
      status,
      displayType,
      cost: 0,
    };

    socket.emit('createNode', newNodePayload, (createdNode) => {
      if (createdNode && !createdNode.error) {
        if (type === 'connect') {
          const { connectionType } = modalPayload;
          if (connectionType === 'sourceToTarget') {
            // Original behavior: source -> newNode
            const { sourceNodeId, sourceHandle } = modalPayload;
            socket.emit('createConnection', {
              tripId,
              fromNodeId: sourceNodeId,
              toNodeId: createdNode._id,
              sourceHandle: sourceHandle,
              targetHandle: null,
            });
          } else if (connectionType === 'targetFromSource') {
            // New behavior: newNode -> target
            const { targetNodeId, targetHandle } = modalPayload;
            socket.emit('createConnection', {
              tripId,
              fromNodeId: createdNode._id,
              toNodeId: targetNodeId,
              sourceHandle: null,
              targetHandle: targetHandle,
            });
          }
        }
        if (displayType === 'canvas') {
          useTripStore.getState().setSelectedNodeId(createdNode._id);
        }
      } else {
        console.error('Failed to create node:', createdNode?.error);
      }
    });

    handleClose();
  };

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
          >
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
            autoFocus
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
