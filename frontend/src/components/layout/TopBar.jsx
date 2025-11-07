import React, { useState } from 'react';
import { useAuthStore } from '../../store/store';
import { useTripStore } from '../../store/tripStore';
import { useNavigate } from 'react-router-dom';
import { Users, Share2, LogOut, LayoutGrid, List } from 'lucide-react';

const TopBar = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const trip = useTripStore((state) => state.trip);

  // This would come from state later
  const [viewMode, setViewMode] = useState('canvas');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 w-full bg-background-secondary border-b border-border flex items-center justify-between px-6 z-30">
      {/* Left Side: Trip Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {trip ? trip.name : 'Loading Trip...'}
        </h1>
      </div>

      {/* Center: View Toggle */}
      <div className="flex items-center gap-1 p-1 bg-background rounded-md border border-border">
        <button
          onClick={() => setViewMode('canvas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            viewMode === 'canvas'
              ? 'bg-accent text-white'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Canvas</span>
        </button>
        <button
          onClick={() => setViewMode('itinerary')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            viewMode === 'itinerary'
              ? 'bg-accent text-white'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          <span>Itinerary</span>
        </button>
      </div>

      {/* Right Side: Avatars, Share, Logout */}
      <div className="flex items-center gap-4">
        {/* Mock Collaborators */}
        <div className="flex items-center -space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 border-2 border-background-secondary flex items-center justify-center text-white font-semibold text-sm">
            A
          </div>
          <div className="h-8 w-8 rounded-full bg-green-500 border-2 border-background-secondary flex items-center justify-center text-white font-semibold text-sm">
            B
          </div>
          <div className="h-8 w-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-foreground-secondary font-semibold text-sm">
            +2
          </div>
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors text-sm">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-foreground-secondary hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};

export default TopBar;