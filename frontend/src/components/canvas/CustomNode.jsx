//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\canvas\CustomNode.jsx
//================================================================================

import React from 'react';
import { Handle, Position } from 'reactflow';
import { MapPin, Clock } from 'lucide-react'; // ✅ Import Clock icon

/**
 * This is the custom-styled node for the canvas,
 * matching the dark theme.
 */

// ✅ Helper to format date/time
const formatTime = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    // Just get time, e.g., "10:30 AM"
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return null;
  }
};

const CustomNode = ({ data, selected }) => {
  const name = data?.name || 'Loading...';
  const address = data?.details?.address || 'Location';
  const node_id = data?._id || name; // Use id for a unique image

  // ✅ Get arrival and departure times
  const arrivalTime = formatTime(data?.timing?.arrival);
  const departureTime = formatTime(data?.timing?.departure);

  const imageUrl = "https://plus.unsplash.com/premium_photo-1675314800274-d84f6a902203?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687";

  return (
    <>
      {/* --- TARGETS (IN) --- */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-4 !h-4 !bg-[#374151]"
        style={{ top: '-8px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-4 !h-4 !bg-[#374151]"
        style={{ left: '-8px' }}
      />

      {/* --- SOURCES (OUT) --- */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-4 !h-4 !bg-[#1aa3ff]"
        style={{ bottom: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-4 !h-4 !bg-[#1aa3ff]"
        style={{ right: '-8px' }}
      />

      {/* Node Content */}
      <div
        className={`
          w-48 bg-background-secondary rounded-md shadow-lg
          border-2
          ${selected ? 'border-[--accent]' : 'border-[--border]'}
          overflow-hidden 
        `}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-20 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-[--accent]" />
            <h3 className="font-bold text-sm text-foreground truncate">
              {name}
            </h3>
          </div>
          <p className="text-xs text-foreground-secondary truncate mb-2">
            {address}
          </p>

          {/* ✅ --- ADDED TIME DISPLAY --- */}
          {(arrivalTime || departureTime) && (
            <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
              <Clock className="h-3 w-3" />
              <span>{arrivalTime || '...'}</span>
              <span>-</span>
              <span>{departureTime || '...'}</span>
            </div>
          )}
          {/* ✅ --- END TIME DISPLAY --- */}
        </div>
      </div>
    </>
  );
};

export default CustomNode;