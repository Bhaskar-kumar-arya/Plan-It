import React from 'react';
import { Handle, Position } from 'reactflow';
import { MapPin } from 'lucide-react';

/**
 * This is the custom-styled node for the canvas,
 * matching the dark theme.
 */
const CustomNode = ({ data, selected }) => {
  const name = data?.name || 'Loading...';
  const address = data?.details?.address || 'Click to add details';
  const node_id = data?._id || name; // Use id for a unique image

  const imageUrl = "https://plus.unsplash.com/premium_photo-1675314800274-d84f6a902203?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687";

  return (
    <>
      {/* --- TARGETS (IN) --- */}
 <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-4 !h-4 !bg-[--border]" // ✅ Size set to 4
        style={{ top: '-8px' }} // ✅ Added negative offset
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-4 !h-4 !bg-[--border]" // ✅ Size set to 4
        style={{ left: '-8px' }} // ✅ Added negative offset
      />

      {/* --- SOURCES (OUT) --- */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-4 !h-4 !bg-[--accent]" // ✅ Size set to 4
        style={{ bottom: '-8px' }} // ✅ Added negative offset
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-4 !h-4 !bg-[--accent]" // ✅ Size set to 4
        style={{ right: '-8px' }} // ✅ Added negative offset
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
          <p className="text-xs text-foreground-secondary truncate">
            {address}
          </p>
        </div>
      </div>
    </>
  );
};

export default CustomNode;