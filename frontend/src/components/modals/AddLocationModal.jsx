//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\modals\AddLocationModal.jsx
//================================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTripStore } from '../../store/tripStore';
import { useReactFlow } from 'reactflow';
import { X, MapPin, Loader2, LocateFixed, Search } from 'lucide-react';
import { searchPhotonPlaces, reverseGeocode } from '../../api';

// Simple debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// Extracted SearchInput component with keyboard navigation
const SearchInput = ({
  query,
  setQuery,
  results,
  onSelect,
  isLoading,
  placeholder,
  icon,
  inputRef, // ✅ --- ADDED: To accept a ref for auto-focus
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // ✅ --- ADDED: For keyboard selection
  const containerRef = useRef(null);

  useEffect(() => {
    // Reset active index when results change
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ --- ADDED: Keyboard navigation handler ---
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex > -1 && results[activeIndex]) {
        onSelect(results[activeIndex]);
        setIsFocused(false);
      }
    } else if (event.key === 'Escape') {
      setIsFocused(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          {React.cloneElement(icon, { className: "h-5 w-5 text-foreground-secondary" })}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown} // ✅ --- ADDED
          ref={inputRef} // ✅ --- ADDED
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      {isFocused && (query.length > 2 || results.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-background-secondary border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <div className="p-3 text-sm text-foreground-secondary">Searching...</div>}
          {!isLoading && results.length === 0 && query.length > 2 && (
            <div className="p-3 text-sm text-foreground-secondary">No results found.</div>
          )}
          {results.map((place, index) => (
            <div
              key={place.osm_id}
              onMouseEnter={() => setActiveIndex(index)} // ✅ --- ADDED: Sync hover
              onClick={() => {
                onSelect(place);
                setIsFocused(false);
              }}
              className={`
                p-3 text-sm cursor-pointer
                ${index === activeIndex ? 'bg-blue-900' : 'hover:bg-background'}
              `} // ✅ --- ADDED: Highlight
            >
              <div className="font-medium">{place.name}</div>
              <div className="text-xs text-foreground-secondary">{place.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AddLocationModal = () => {
  const modalPayload = useTripStore((state) => state.modalPayload);
  const closeModal = useTripStore((state) => state.closeAddLocationModal);
  const socket = useTripStore((state) => state.socket);
  const tripId = useTripStore((state) => state.trip?._id);
  const { screenToFlowPosition } = useReactFlow();
  const nameInputRef = useRef(null); // ✅ --- ADDED: Ref for auto-focus

  // State for the main location search
  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null); // Store selected place for button fallback

  // State for the bias ("local area") search
  const [biasQuery, setBiasQuery] = useState('');
  const [biasResults, setBiasResults] = useState([]);
  const [isBiasLoading, setIsBiasLoading] = useState(false);
  const [biasCoords, setBiasCoords] = useState(null); // { lat, lon }
  const [isLocating, setIsLocating] = useState(false);

  const debouncedNameQuery = useDebounce(nameQuery, 300);
  const debouncedBiasQuery = useDebounce(biasQuery, 300);

  const isOpen = modalPayload && (
    modalPayload.type === 'add' ||
    modalPayload.type === 'connect' ||
    modalPayload.type === 'bin'
  );

  // --- Effects ---

  // Get user's current location and auto-focus on modal open
  useEffect(() => {
    if (isOpen) {
      handleGetLocation();
      // ✅ --- ADDED: Auto-focus with a small delay
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      // --- END ---
    } else {
      // Reset state on close
      setNameQuery('');
      setNameResults([]);
      setSelectedPlace(null);
      setBiasQuery('');
      setBiasResults([]);
      setBiasCoords(null);
    }
  }, [isOpen]);

  // ... (Main location search useEffect remains the same) ...
  useEffect(() => {
    if (debouncedNameQuery.length < 3) {
      setNameResults([]);
      return;
    }
    const search = async () => {
      setIsNameLoading(true);
      try {
        const res = await searchPhotonPlaces(
          debouncedNameQuery,
          biasCoords?.lat,
          biasCoords?.lng
        );
        setNameResults(res.data);
      } catch (err) {
        console.error('Failed to search places', err);
      } finally {
        setIsNameLoading(false);
      }
    };
    search();
  }, [debouncedNameQuery, biasCoords]);

  // ... (Bias location search useEffect remains the same) ...
  useEffect(() => {
    if (debouncedBiasQuery.length < 3) {
      setBiasResults([]);
      return;
    }
    const search = async () => {
      setIsBiasLoading(true);
      try {
        const res = await searchPhotonPlaces(debouncedBiasQuery);
        setBiasResults(res.data);
      } catch (err) {
        console.error('Failed to search bias places', err);
      } finally {
        setIsBiasLoading(false);
      }
    };
    search();
  }, [debouncedBiasQuery]);

  // --- Handlers ---

  // ... (handleGetLocation remains the same) ...
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setBiasCoords({ lat: latitude, lng: longitude });
        try {
          const res = await reverseGeocode(latitude, longitude);
          setBiasQuery(res.data.city || res.data.name || 'Current Location');
        } catch (err) {
          console.error('Failed to reverse geocode', err);
          setBiasQuery('Current Location');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Failed to get location', err);
        setIsLocating(false);
      }
    );
  };

  // ... (handleSelectBias remains the same) ...
  const handleSelectBias = (place) => {
    setBiasCoords(place.coordinates);
    setBiasQuery(place.name);
    setBiasResults([]);
  };

  // ✅ --- NEW: Core node creation logic, extracted ---
  const handleCreateNode = (placeToCreate) => {
    if (!placeToCreate || !socket || !tripId) return;

    const { type } = modalPayload;
    let position;
    let displayType;

    if (type === 'bin') {
      position = { x: 0, y: 0 }; // Position doesn't matter for bin
      displayType = 'bin';
    } else {
      displayType = 'canvas';
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

    // Build node details from the selected Photon place
    const newNodePayload = {
      tripId,
      type: 'location',
      position,
      name: placeToCreate.name,
      details: {
        coordinates: placeToCreate.coordinates,
        address: placeToCreate.address,
        country: placeToCreate.country,
        city: placeToCreate.city,
        street: placeToCreate.street,
        osm_id: placeToCreate.osm_id,
      },
      displayType,
      cost: 0,
    };

    socket.emit('createNode', newNodePayload, (createdNode) => {
      if (createdNode && !createdNode.error) {
        if (type === 'connect') {
          const { connectionType } = modalPayload;
          if (connectionType === 'sourceToTarget') {
            const { sourceNodeId, sourceHandle } = modalPayload;
            socket.emit('createConnection', { tripId, fromNodeId: sourceNodeId, toNodeId: createdNode._id, sourceHandle, targetHandle: null });
          } else if (connectionType === 'targetFromSource') {
            const { targetNodeId, targetHandle } = modalPayload;
            socket.emit('createConnection', { tripId, fromNodeId: createdNode._id, toNodeId: targetNodeId, sourceHandle: null, targetHandle });
          }
        }
        if (displayType === 'canvas') {
          useTripStore.getState().setSelectedNodeId(createdNode._id);
        }
      } else {
        console.error('Failed to create node:', createdNode?.error);
      }
    });

    closeModal();
  };

  // ✅ --- UPDATED: This now *triggers* the creation
  const handleSelectName = (place) => {
    setSelectedPlace(place);
    setNameQuery(place.name);
    setNameResults([]);
    handleCreateNode(place); // Immediately create node on select
  };

  // ✅ --- UPDATED: This is now just a fallback for the button
  const handleSubmitForm = (e) => {
    e.preventDefault();
    // This will only be called if the user clicks the button
    // We use the state-held `selectedPlace`
    handleCreateNode(selectedPlace);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg p-6 bg-background-secondary rounded-lg shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            {modalPayload.type === 'bin' ? 'Add New Idea' : 'Add New Location'}
          </h2>
          <button
            onClick={closeModal}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Local Area (for bias)
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchInput
                  query={biasQuery}
                  setQuery={setBiasQuery}
                  results={biasResults}
                  onSelect={handleSelectBias}
                  isLoading={isBiasLoading}
                  placeholder="e.g., Bengaluru"
                  icon={<Search />}
                  inputRef={null} // No auto-focus here
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                title="Use my current location"
                className="p-2 bg-background border border-border rounded-md text-foreground-secondary hover:text-accent"
              >
                {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Location Name
            </label>
            <SearchInput
              query={nameQuery}
              setQuery={setNameQuery}
              results={nameResults}
              onSelect={handleSelectName} // ✅ --- This now triggers creation
              isLoading={isNameLoading}
              placeholder="e.g., 'Eiffel Tower' or 'coffee'"
              icon={<MapPin />}
              inputRef={nameInputRef} // ✅ --- Pass the ref
             />
          </div>

          <button
            type="submit"
            disabled={!selectedPlace} // Button is a fallback
            className="w-full mt-4 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {modalPayload.type === 'bin' ? 'Add Idea' : 'Add Location'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;