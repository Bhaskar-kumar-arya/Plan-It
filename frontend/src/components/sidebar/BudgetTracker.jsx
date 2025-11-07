import React from 'react';
import { DollarSign } from 'lucide-react';

// This will later fetch from /api/trips/:tripId/budget
const BudgetTracker = () => {
  const mockTotal = 1250; // Mock data

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        Trip Budget
      </h3>
      <div className="text-3xl font-bold text-foreground">
        ${mockTotal.toLocaleString()}
      </div>
      <div className="text-sm text-foreground-secondary">
        Total estimated cost
      </div>
    </div>
  );
};

export default BudgetTracker;