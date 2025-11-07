//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\pages\TripCanvasPage.jsx
//================================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTripById } from '../api';
import { Loader2 } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import toast, { Toaster } from 'react-hot-toast'; // ✅ --- IMPORT TOAST ---

// Import the new stores and hooks
import { useAuthStore } from '../store/store';
import { useTripStore } from '../store/tripStore';
import { useSocket } from '../hooks/useSocket';

// Import Layout Components
import TopBar from '../components/layout/TopBar';
import LeftToolbar from '../components/layout/LeftToolbar';
import RightSidebar from '../components/sidebar/RightSidebar';
import Canvas from '../components/canvas/Canvas';
import AddLocationModal from '../components/modals/AddLocationModal';
import ShareTripModal from '../components/modals/ShareTripModal';

// ✅ --- DEFINE STABLE SELECTORS OUTSIDE ---
const useSocketSelector = (state) => state.socket;
const useSetTripDataSelector = (state) => state.setTripData;
const useAddNodeSelector = (state) => state.addNode;
const useUpdateNodePosSelector = (state) => state.updateNodePos;
const useUpdateNodeDetailsSelector = (state) => state.updateNodeDetails;
const useRemoveNodeSelector = (state) => state.removeNode;
const useAddEdgeSelector = (state) => state.addEdge;
const useRemoveEdgeSelector = (state) => state.removeEdge;
const useSetLiveUsersSelector = (state) => state.setLiveUsers; // ✅ --- ADDED ---
const useUserSelector = (state) => state.user; // ✅ --- ADDED ---

const TripCanvasPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // Auth store
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore(useUserSelector); // ✅ --- GET CURRENT USER ---

  // Trip store selectors
  const socket = useTripStore(useSocketSelector);
  const setTripData = useTripStore(useSetTripDataSelector);
  const addNode = useTripStore(useAddNodeSelector);
  const updateNodePos = useTripStore(useUpdateNodePosSelector);
  const updateNodeDetails = useTripStore(useUpdateNodeDetailsSelector);
   const removeNode = useTripStore(useRemoveNodeSelector);
  const addEdge = useTripStore(useAddEdgeSelector);
  const removeEdge = useTripStore(useRemoveEdgeSelector);
  const setLiveUsers = useTripStore(useSetLiveUsersSelector); // ✅ --- ADDED ---

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Initialize the socket connection
  useSocket();

  // 2. Load initial trip data
  useEffect(() => {
    // ... (loadTripData function remains the same) ...
    const loadTripData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getTripById(tripId);
        setTripData(response.data);
      } catch (err) {
        console.error('Failed to load trip', err);
        if (err.response && err.response.status === 401) {
          logout();
          navigate('/login');
        } else {
          setError('Failed to load trip data.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTripData();
  }, [tripId, setTripData, logout, navigate]);

  // 3. Set up socket listeners
  useEffect(() => {
    if (!socket || !currentUser) return; // ✅ Wait for socket AND current user

    // Join the trip room
    socket.emit('joinTrip', { tripId });

    socket.on('joinedTrip', (msg) => {
      console.log(msg);
    });

    // --- DEFINE ALL LISTENERS ---
    socket.on('nodeCreated', addNode);
    socket.on('nodeMoved', updateNodePos);
    socket.on('nodeUpdated', updateNodeDetails);
    socket.on('nodeDeleted', removeNode);
    socket.on('connectionCreated', addEdge);
    socket.on('connectionDeleted', removeEdge);

    // ✅ --- ADDED PRESENCE LISTENERS ---
    socket.on('liveUsersUpdate', setLiveUsers);

    socket.on('userJoined', (user) => {
      // Only show toast if it's *not* the current user
      if (user._id !== currentUser._id) {
        toast.success(`${user.username} joined the trip.`);
      }
    });

    socket.on('userLeft', (user) => {
      if (user._id !== currentUser._id) {
        toast(`${user.username} left the trip.`);
      }
    });
    // ✅ --- END ---

    socket.on('error', (errorMsg) => {
      console.error('Socket Error:', errorMsg);
      setError(errorMsg.message || 'A real-time connection error occurred.');
    });

    // Cleanup: Remove listeners
    return () => {
      socket.off('joinedTrip');
      socket.off('nodeCreated');
      socket.off('nodeMoved');
      socket.off('nodeUpdated');
      socket.off('nodeDeleted');
      socket.off('connectionCreated');
      socket.off('connectionDeleted');
      socket.off('error');
      // ✅ --- ADDED CLEANUP ---
      socket.off('liveUsersUpdate');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, [
    socket,
    tripId,
    addNode,
    updateNodePos,
    updateNodeDetails,
    removeNode,
    addEdge,
    removeEdge,
    setLiveUsers, // ✅ --- ADDED ---
    currentUser, // ✅ --- ADDED ---
  ]);

  // --- RENDER STATES ---
  if (isLoading) {
    // ... (loading state remains the same) ...
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <span className="ml-4 text-xl text-foreground">Loading Trip...</span>
      </div>
    );
  }

  if (error) {
    // ... (error state remains the same) ...
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-red-500">
        {error}
      </div>
    );
  }

  // --- RENDER MAIN APP UI ---
  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* ✅ --- ADDED TOASTER --- */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--background-secondary)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // green
              secondary: 'var(--foreground)',
            },
           },
        }}
      />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
        <main className="flex-1 h-full relative">
          <ReactFlowProvider>
            <Canvas />
            <AddLocationModal />
            <ShareTripModal />
          </ReactFlowProvider>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default TripCanvasPage;