//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\modals\ShareTripModal.jsx
//================================================================================
import React, { useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/store';
import { setTripShareCode } from '../../api';
import { X, Share2, Loader2, Clipboard, Check } from 'lucide-react';

// --- Stable Selectors ---
const tripSelector = (state) => state.trip;
const isShareModalOpenSelector = (state) => state.isShareModalOpen;
const closeShareModalSelector = (state) => state.closeShareModal;
const userSelector = (state) => state.user;

const ShareTripModal = () => {
  const trip = useTripStore(tripSelector);
  const isOpen = useTripStore(isShareModalOpenSelector);
  const closeShareModal = useTripStore(closeShareModalSelector);
  const user = useAuthStore(userSelector);

  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = trip?.owner === user?._id;

  const handleClose = () => {
    setPassword('');
    setError(null);
    setMessage(null);
    setIsLoading(false);
    closeShareModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await setTripShareCode(trip._id, password);
      setMessage('Share Code set successfully! The trip is now shareable.');
      setPassword('');
    } catch (err) {
      console.error('Failed to set share code', err);
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(trip._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-background-secondary rounded-lg shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-accent" />
            Share this Trip
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-foreground-secondary hover:text-foreground rounded-md hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Share this Trip ID and a Share Code with anyone you want to
            collaborate with.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Trip ID (Share this)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={trip?._id || ''}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground-secondary"
              />
              <button
                onClick={handleCopyId}
                className="px-3 py-2 bg-background border border-border rounded-md text-foreground-secondary hover:text-accent"
                title="Copy Trip ID"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Clipboard className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {/* Only owners can set the password */}
          {isOwner ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="sharePassword"
                  className="block text-sm font-medium text-foreground-secondary mb-2"
                >
                  Set Share Code (Password)
                </label>
                <input
                  type="password"
                  id="sharePassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Enter a secret code"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Set or Update Share Code'
                )}
              </button>
            </form>
          ) : (
            <p className="text-sm text-yellow-500">
              Only the trip owner can set or change the share code.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareTripModal;