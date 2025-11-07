import React from 'react';
import { Handle, Position } from 'reactflow';
import { MapPin } from 'lucide-react';

/**
 * This is the custom-styled node for the canvas,
 * matching the dark theme.
 */
const CustomNode = ({ data, selected }) => {
  return (
    <>
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-accent"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-accent"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-accent"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-accent"
      />

      {/* Node Content */}
      <div
        className={`
          w-48 bg-background-secondary rounded-md shadow-lg
          border-2
          ${selected ? 'border-accent' : 'border-border'}
        `}
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-accent" />
            <h3 className="font-bold text-sm text-foreground truncate">
              {data.name}
            </h3>
          </div>
          <p className="text-xs text-foreground-secondary truncate">
            {data.address || 'Click to add details'}
          </p>
        </div>
      </div>
    </>
  );
};

export default CustomNode;