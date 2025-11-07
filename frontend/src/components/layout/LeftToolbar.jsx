import React from 'react';
import {
  MousePointer,
  MapPin,
  StickyNote,
  ZoomIn,
  ZoomOut,
  ArrowRight,
} from 'lucide-react';

// A single tool button component
const ToolButton = ({ icon: Icon, label, isActive = false }) => (
  <button
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
  return (
    <aside className="w-16 bg-background-secondary border-r border-border p-3 z-20">
      <div className="flex flex-col items-center gap-3">
        {/* Add logo here if you have one */}
        {/* <div className="h-10 w-10 bg-accent rounded-lg mb-4"></div> */}

        <ToolButton icon={MousePointer} label="Select" isActive={true} />
        <ToolButton icon={MapPin} label="Add Location" />
        <ToolButton icon={StickyNote} label="Add Note" />
        <ToolButton icon={ArrowRight} label="Connect" />

        <div className="flex-1"></div>

        <ToolButton icon={ZoomIn} label="Zoom In" />
        <ToolButton icon={ZoomOut} label="Zoom Out" />
      </div>
    </aside>
  );
};

export default LeftToolbar;