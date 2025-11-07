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