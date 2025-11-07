import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTripById } from '../api';
import { Loader2 } from 'lucide-react';

// Import the new stores and hooks
import { useAuthStore } from '../store/store';
import { useTripStore } from '../store/tripStore';
import { useSocket } from '../hooks/useSocket';

// Import Layout Components
import TopBar from '../components/layout/TopBar';
import LeftToolbar from '../components/layout/LeftToolbar';
import RightSidebar from '../components/sidebar/RightSidebar';
import Canvas from '../components/canvas/Canvas';

// ✅ --- DEFINE STABLE SELECTORS OUTSIDE ---
const useSocketSelector = (state) => state.socket;
const useSetTripDataSelector = (state) => state.setTripData;
const useAddNodeSelector = (state) => state.addNode;
const useUpdateNodePosSelector = (state) => state.updateNodePos;
const useUpdateNodeDetailsSelector = (state) => state.updateNodeDetails;
const useRemoveNodeSelector = (state) => state.removeNode;
const useAddEdgeSelector = (state) => state.addEdge;
// ✅ ---------------------------------------

const TripCanvasPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // Auth store
  const logout = useAuthStore((state) => state.logout);

  // ✅ --- USE STABLE SELECTORS ---
  const socket = useTripStore(useSocketSelector);
  const setTripData = useTripStore(useSetTripDataSelector);
  const addNode = useTripStore(useAddNodeSelector);
  const updateNodePos = useTripStore(useUpdateNodePosSelector);
  const updateNodeDetails = useTripStore(useUpdateNodeDetailsSelector);
  const removeNode = useTripStore(useRemoveNodeSelector);
  const addEdge = useTripStore(useAddEdgeSelector);
  // ✅ ------------------------------

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Initialize the socket connection
  useSocket();

  // 2. Load initial trip data
  useEffect(() => {
    const loadTripData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getTripById(tripId);
        // Populate the trip store with initial data
        setTripData(response.data);
      } catch (err) {
        console.error('Failed to load trip', err);
        if (err.response && err.response.status === 401) {
          logout(); // Token is bad, log out
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
    if (!socket) return; // Wait for socket to be ready

    // Join the trip room
    socket.emit('joinTrip', { tripId });

    socket.on('joinedTrip', (msg) => {
      console.log(msg);
    });

    // --- DEFINE ALL LISTENERS ---
    // These call actions on the tripStore
    socket.on('nodeCreated', addNode);
    socket.on('nodeMoved', updateNodePos);
    socket.on('nodeUpdated', updateNodeDetails);
    socket.on('nodeDeleted', removeNode);
    socket.on('connectionCreated', addEdge);
    // Add more listeners for comments, tasks, etc.
    // socket.on('commentCreated', addComment);

    socket.on('error', (errorMsg) => {
      console.error('Socket Error:', errorMsg);
      setError(errorMsg.message || 'A real-time connection error occurred.');
    });

    // Cleanup: Remove listeners when component unmounts
    // or when socket/tripId changes
    return () => {
      socket.off('joinedTrip');
      socket.off('nodeCreated');
      socket.off('nodeMoved');
      socket.off('nodeUpdated');
      socket.off('nodeDeleted');
      socket.off('connectionCreated');
      socket.off('error');
    };
  }, [
    socket,
    tripId,
    addNode,
    updateNodePos,
    updateNodeDetails,
    removeNode,
    addEdge,
  ]);

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <span className="ml-4 text-xl text-foreground">Loading Trip...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-red-500">
        {error}
      </div>
    );
  }

  // --- RENDER MAIN APP UI ---
  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
        <main className="flex-1 h-full relative">
          <Canvas />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default TripCanvasPage;