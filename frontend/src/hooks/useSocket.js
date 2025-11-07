import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/store';
import { useTripStore } from '../store/tripStore';

const SOCKET_URL = 'http://localhost:5001';

/**
 * Custom hook to initialize and manage the Socket.io connection.
 * It stores the socket instance in the tripStore.
 */
export const useSocket = () => {
  // Get token from auth store
  const token = useAuthStore((state) => state.token);
  // Get setter from trip store
  const setSocket = useTripStore((state) => state.setSocket);

  // Use a ref to ensure socket is only created once
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return; // Don't connect if not authenticated

    // Prevent multiple connections
    if (socketRef.current) return;

    // Create the socket instance with auth token
    const socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setSocket(socket); // Save the instance to the store
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocket(null); // Remove from store
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [token, setSocket]);
};