

import React from 'react';
import {
  MousePointer,
  MapPin,
  StickyNote,
} from 'lucide-react';
import { useTripStore } from '../../store/tripStore'; // ✅ Import store

// A single tool button component
const ToolButton = ({ icon: Icon, label, isActive = false, onClick }) => ( // ✅ Add onClick
  <button
    onClick={onClick} // ✅ Add onClick
    className={`p-3 rounded-md transition-colors ${
      isActive
        ? 'bg-accent text-white'
        : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
    }`}
    title={label}
  >
    <Icon className="h-5 w-5" />
  </button>
);

const LeftToolbar = () => {
  // ✅ Get state and setter from store
  const activeTool = useTripStore((state) => state.activeTool);
  const setActiveTool = useTripStore((state) => state.setActiveTool);

  return (
    <aside className="w-16 bg-background-secondary border-r border-border p-3 z-20">
      <div className="flex flex-col items-center gap-3">
        <ToolButton
          icon={MousePointer}
          label="Select"
          isActive={activeTool === 'select'} // ✅ Dynamic active state
          onClick={() => setActiveTool('select')} // ✅ Set tool
        />
        <ToolButton
          icon={MapPin}
          label="Add Location"
          isActive={activeTool === 'addLocation'} // ✅ Dynamic active state
          onClick={() => setActiveTool('addLocation')} // ✅ Set tool
        />
        <ToolButton
          icon={StickyNote}
          label="Add Note"
          isActive={activeTool === 'addNote'} // ✅ Dynamic active state
          onClick={() => setActiveTool('addNote')} // ✅ Set tool
        />

        {/* Removed redundant Zoom and Connect buttons */}
      </div>
    </aside>
  );
};

export default LeftToolbar;

