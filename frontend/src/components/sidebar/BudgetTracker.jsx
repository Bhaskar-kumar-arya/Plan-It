//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\sidebar\BudgetTracker.jsx
//================================================================================

import React from 'react';
import { DollarSign } from 'lucide-react';
import { useTripStore, canvasNodesSelector } from '../../store/tripStore'; // ✅ Import store and selector

const BudgetTracker = () => {
  // ✅ Get nodes from the store using the selector
  const nodes = useTripStore(canvasNodesSelector);

  // ✅ Calculate the total budget
  const totalBudget = nodes.reduce(
    (sum, node) => sum + (Number(node.data.cost) || 0),
    0
  );

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        Trip Budget
      </h3>
      <div className="text-3xl font-bold text-foreground">
        RS {totalBudget.toLocaleString()}
      </div>
      <div className="text-sm text-foreground-secondary">
        Total estimated cost
      </div>
    </div>
  );
};

export default BudgetTracker;