//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\layout/TopBar.jsx
//================================================================================

import React, { useState } from 'react';
import { useAuthStore } from '../../store/store';
import { useTripStore } from '../../store/tripStore';
import { useNavigate } from 'react-router-dom';
import { Users, Share2, LogOut, LayoutGrid, List } from 'lucide-react';

// --- Stable Selectors ---
const tripSelector = (state) => state.trip;
const openShareModalSelector = (state) => state.openShareModal;
const liveUsersSelector = (state) => state.liveUsers; // ✅ --- ADDED ---

// ✅ --- AVATAR UTILITIES ---
// Simple hash function to get a color
const getAvatarColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ];
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (username) => {
  return username.charAt(0).toUpperCase();
};

// Avatar component
const Avatar = ({ user }) => (
  <div
    title={user.username}
    className={`h-8 w-8 rounded-full ${getAvatarColor(user.username)}
      border-2 border-background-secondary flex items-center
      justify-center text-white font-semibold text-sm`}
  >
    {getInitials(user.username)}
  </div>
);

// Count bubble component
const AvatarCount = ({ count }) => (
  <div
    title={`${count} more users`}
    className="h-8 w-8 rounded-full bg-background border-2 border-border
      flex items-center justify-center text-foreground-secondary
      font-semibold text-sm"
  >
    +{count}
  </div>
);
// ✅ --- END UTILITIES ---

const TopBar = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  // --- Use Selectors ---
  const trip = useTripStore(tripSelector);
  const openShareModal = useTripStore(openShareModalSelector);
  const liveUsers = useTripStore(liveUsersSelector); // ✅ --- GET LIVE USERS ---
  const currentUser = useAuthStore((state) => state.user); // Get current user

  const [viewMode, setViewMode] = useState('canvas');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ --- AVATAR RENDER LOGIC ---
  const MAX_AVATARS = 3; // Max avatars to show (excluding current user)
  const otherUsers = liveUsers.filter(u => u._id !== currentUser?._id);
  const visibleUsers = otherUsers.slice(0, MAX_AVATARS);
  const hiddenCount = otherUsers.length - visibleUsers.length;
  // ✅ --- END LOGIC ---

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
        {/* ✅ --- LIVE COLLABORATORS --- */}
        <div className="flex items-center -space-x-2">
          {/* Always show current user first, with a special border */}
          {currentUser && (
            <div title={`${currentUser.username} (You)`} className="relative">
              <Avatar user={currentUser} />
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 border-2 border-background-secondary" />
            </div>
          )}
          {/* Show other live users */}
          {visibleUsers.map(user => (
            <Avatar key={user._id} user={user} />
          ))}
          {/* Show count of hidden users */}
          {hiddenCount > 0 && <AvatarCount count={hiddenCount} />}
        </div>
        {/* ✅ --- END --- */}

        <button
          onClick={openShareModal}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors text-sm"
        >
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