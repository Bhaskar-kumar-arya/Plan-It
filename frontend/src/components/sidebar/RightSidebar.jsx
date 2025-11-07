import React from 'react';
import { useTripStore } from '../../store/tripStore';
import BudgetTracker from './BudgetTracker';
import IdeaBin from './IdeaBin';
import NodeEditor from './NodeEditor';

/**
 * This component conditionally renders the correct sidebar view
 * based on whether a node is selected, as per the architecture plan.
 */
const RightSidebar = () => {
  const selectedNodeId = useTripStore((state) => state.selectedNodeId);

  return (
    <aside className="w-80 bg-background-secondary border-l border-border flex flex-col z-20">
      {selectedNodeId ? (
        <NodeEditor key={selectedNodeId} /> // Use key to force re-mount on selection change
      ) : (
        <>
          <IdeaBin />
          <BudgetTracker />
        </>
      )}
    </aside>
  );
};

export default RightSidebar;