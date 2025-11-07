import React from 'react';
import { Lightbulb, Plus } from 'lucide-react';

// Mock data for now
const mockIdeas = [
  { id: 1, name: 'MTR 1924' },
  { id: 2, name: 'Visvesvaraya Museum' },
  { id: 3, name: 'Cubbon Park' },
];

const IdeaBin = () => {
  return (
    <div className="p-4 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4" />
        Idea Bin
      </h3>
      <div className="space-y-2">
        {mockIdeas.map((idea) => (
          <div
            key={idea.id}
            className="p-2.5 bg-background rounded-md border border-border text-sm text-foreground cursor-grab active:cursor-grabbing"
          >
            {idea.name}
          </div>
        ))}
      </div>
      <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-accent rounded-md border border-accent/30 hover:bg-accent/10 transition-colors">
        <Plus className="h-4 w-4" />
        Add Idea
      </button>
    </div>
  );
};

export default IdeaBin;