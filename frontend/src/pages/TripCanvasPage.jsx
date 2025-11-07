import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { getTripById } from '../api';
import { Loader2 } from 'lucide-react';

// You will import all your main components here
// import TopBar from '../components/layout/TopBar';
// import LeftToolbar from '../components/layout/LeftToolbar';
// import RightSidebar from '../components/sidebar/RightSidebar';
// import Canvas from '../components/canvas/Canvas';

const TripCanvasPage = () => {
  const { tripId } = useParams();
  const [tripData, setTripData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This will be your main data loading call
  useEffect(() => {
    const loadTripData = async () => {
      try {
        setIsLoading(true);
        // This endpoint gets all trip data in one go
        const response = await getTripById(tripId);
        setTripData(response.data);
      } catch (err) {
        console.error('Failed to load trip', err);
        setError('Failed to load trip data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadTripData();
  }, [tripId]);

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

  // Once loaded, you'll pass data down to your layout components
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* This is where you will build the main UI
        <TopBar title={tripData.trip.name} />
        <LeftToolbar />
        <RightSidebar />
        <Canvas nodes={tripData.nodes} connections={tripData.connections} /> 
      */}
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          {tripData.trip.name} (ID: {tripId})
        </h1>
        <pre className="mt-4 p-4 bg-background-secondary rounded-md overflow-auto">
          {JSON.stringify(tripData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TripCanvasPage;