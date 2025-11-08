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
  Search, // ✅ --- ADDED ---
  Loader2, // ✅ --- ADDED ---
  Plus, // ✅ --- ADDED ---
} from 'lucide-react';

import TaskList from './TaskList';
import CommentList from './CommentList';
import { searchPhotonPlaces } from '../../api'; // ✅ --- ADDED ---

// --- SELECTORS ---
const selectedNodeIdSelector = (state) => state.selectedNodeId;
const nodesSelector = (state) => state.nodes;
const socketSelector = (state) => state.socket;
const tripSelector = (state) => state.trip;
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId;

// ... (formatDateTimeLocal helper remains the same) ...
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

// ✅ --- NEW: Find Nearby Component ---
const FindNearby = ({ nodeData, tripId, socket }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const { coordinates } = nodeData.details;
      if (!coordinates || !coordinates.lat) {
        console.error('Source node has no coordinates to search nearby.');
        return;
      }
      const res = await searchPhotonPlaces(query, coordinates.lat, coordinates.lng);
      setResults(res.data);
    } catch (err) {
      console.error('Failed to find nearby places', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToBin = (place) => {
    if (!socket || !tripId) return;

    const newNodePayload = {
      tripId,
      type: 'location',
      position: { x: 0, y: 0 }, // Bin items have no position
      name: place.name,
      details: {
        coordinates: place.coordinates,
        address: place.address,
        country: place.country,
        city: place.city,
        street: place.street,
        osm_id: place.osm_id,
      },
      displayType: 'bin', // Add to Idea Bin
      cost: 0,
    };

    socket.emit('createNode', newNodePayload);
    // Optionally clear query/results
    setQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground-secondary">Find Nearby</h4>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'coffee' or 'museum'"
          className="flex-1 w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="p-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>
      {results.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {results.map((place) => (
            <div key={place.osm_id} className="flex items-center justify-between p-2 bg-background rounded-md">
              <div className="text-sm overflow-hidden">
                <p className="font-medium truncate">{place.name}</p>
                <p className="text-xs text-foreground-secondary truncate">{place.address}</p>
              </div>
              <button
                onClick={() => handleAddToBin(place)}
                title="Add to Idea Bin"
                className="p-1 text-accent hover:bg-accent/10 rounded-md"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// ✅ --- END: Find Nearby Component ---


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
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setLocalData(nodeData || {});
  }, [nodeData]);

  useEffect(() => {
    setActiveTab('details');
  }, [selectedNodeId]);

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
      position: { x: 400, y: 400 }, // Default canvas position
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
        <p className="text-sm text-foreground-secondary truncate">
          {isNote ? 'Type: Sticky Note' : localData.details?.address || 'No address'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium cursor-pointer ${
            activeTab === 'details'
              ? 'text-accent border-b-2 border-accent'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Info className="h-4 w-4" />
          <span>Details</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium cursor-pointer ${
            activeTab === 'tasks'
              ? 'text-accent border-b-2 border-accent'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium cursor-pointer ${
            activeTab === 'comments'
              ? 'text-accent border-b-2 border-accent'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
         <MessageSquare className="h-4 w-4" />
          <span>Comments</span>
        </button>
      </div>

      {/* Details Form */}
      {activeTab === 'details' && (
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
                  Estimated Cost (RS)
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

              {/* ✅ --- ADDED FIND NEARBY --- */}
              <div className="pt-2 border-t border-border">
                <FindNearby nodeData={nodeData} tripId={trip._id} socket={socket} />
             </div>
              {/* ✅ --- END --- */}
            </>
          )}

          {/* Note-only fields */}
          {isNote && (
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1">
                Notes
              </label>
              <textarea
                name="address" // This field is overloaded for notes
                rows="4"
                value={localData.details?.address || ''}
                onChange={handleDetailsChange}
                onBlur={handleUpdate}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <TaskList
          tripId={trip._id}
          nodeId={selectedNodeId}
          socket={socket}
        />
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <CommentList
          tripId={trip._id}
          nodeId={selectedNodeId}
          socket={socket}
        />
      )}
    </div>
  );
};

export default NodeEditor;