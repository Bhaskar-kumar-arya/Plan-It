import React from 'react';
import { Handle, Position } from 'reactflow';
import { StickyNote } from 'lucide-react';

/**
 * This is the custom-styled node for "Notes"
 */
const CustomNoteNode = ({ data, selected }) => {
  const name = data?.name || 'Loading...';
  const noteContent = data?.details?.address || 'Click to edit...';

  return (
    <>
      {/* --- TARGETS (IN) --- */}
      <Handle
        type="target"
        position={Position.Top}
        id="top" // <-- ADDED ID
        className="!w-2 !h-2 !bg-[--border]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left" // <-- ADDED ID
        className="!w-2 !h-2 !bg-[--border]"
      />

      {/* --- SOURCES (OUT) --- */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom" // <-- ADDED ID
Choose a snippet
        className="!w-2 !h-2 !bg-[--accent]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right" // <-- ADDED ID
        className="!w-2 !h-2 !bg-[--accent]"
      />

      {/* Node Content */}
      <div
        className={`
          w-48 bg-yellow-200/20 rounded-md shadow-lg border-2
          ${selected ? 'border-[--accent]' : 'border-yellow-400/30'}
        `}
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
           <StickyNote className="h-4 w-4 text-yellow-400" />
            <h3 className="font-bold text-sm text-foreground truncate">
              {name}
            </h3>
          </div>
          <p className="text-xs text-foreground-secondary break-words">
            {noteContent}
          </p>
        </div>
      </div>
    </>
  );
};

export default CustomNoteNode;