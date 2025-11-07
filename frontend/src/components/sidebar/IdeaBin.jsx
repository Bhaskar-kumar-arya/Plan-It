import React from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import { useTripStore, binNodesSelector } from '../../store/tripStore'; // ✅ Import store and selector

// Stable selectors
const openModalSelector = (state) => state.openAddLocationModal;
const setSelectedNodeIdSelector = (state) => state.setSelectedNodeId; // ✅ Import setter
const selectedNodeIdSelector = (state) => state.selectedNodeId; // ✅ Import state

const IdeaBin = () => {
  // ✅ Get nodes and modal opener from the store
  const ideas = useTripStore(binNodesSelector);
  const openAddLocationModal = useTripStore(openModalSelector);
  const setSelectedNodeId = useTripStore(setSelectedNodeIdSelector);
  const selectedNodeId = useTripStore(selectedNodeIdSelector);

  const handleDragStart = (e, node) => {
    e.dataTransfer.setData('application/json', JSON.stringify(node.data));
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
  };

  return (
    <div className="p-4 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4" />
        Idea Bin
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {ideas.length > 0 ? (
          ideas.map((node) => (
            <div
              key={node.id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, node)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedNodeId(node.id)} // ✅ Add onClick to select
              className={`
                p-2.5 bg-background rounded-md border text-sm text-foreground
                cursor-grab active:cursor-grabbing
                ${
                  selectedNodeId === node.id
                    ? 'border-accent'
                    : 'border-border'
                }
              `}
            >
              {node.data.name}
            </div>
          ))
        ) : (
          <p className="text-sm text-foreground-secondary text-center py-2">
            No ideas yet. Add one!
          </p>
        )}
      </div>
      <button
        onClick={() => openAddLocationModal({ type: 'bin' })} // ✅ Open modal with type 'bin'
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-accent rounded-md border border-accent/30 hover:bg-accent/10 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Idea
      </button>
    </div>
  );
};

export default IdeaBin;