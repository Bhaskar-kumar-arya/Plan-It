import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { getTrips, createTrip, deleteTrip } from '../api'; // <-- Import deleteTrip
import {
  Plus,
  Map,
  LogOut,
  Loader2,
  AlertCircle,
  Trash2, // <-- Import Trash2 icon
} from 'lucide-react';

const Dashboard = () => {
  // Use stable selectors to prevent infinite loops.
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState('');

  const navigate = useNavigate();

  // Fetch trips on component mount
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await getTrips();
        setTrips(response.data);
      } catch (err) {
        // Handle the 401 error.
        if (err.response && err.response.status === 401) {
          logout();
        } else {
          setError('Failed to fetch trips. Please try again.');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrips();
  }, [logout]);

  // Handle creating a new trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();

    if (!newTripName.trim()) {
      setWarning('Trip name cannot be empty.');
      return;
    }

    try {
      // Use a different loading state for create
      // to not trigger the main loader
      setError(null);
      setWarning(''); // clear warning on valid input

      const response = await createTrip({ name: newTripName });
      setTrips((prevTrips) => [response.data, ...prevTrips]); // Use functional update
      setNewTripName('');
    } catch (err) {
      console.error('Failed to create trip', err);
      if (err.response && err.response.status === 401) {
        logout();
      } else {
        setError('Failed to create trip.');
      }
    }
  };

  // ✅ --- ADDED DELETE HANDLER ---
  const handleDeleteTrip = async (e, tripId) => {
    e.preventDefault(); // Stop the <Link> navigation
    e.stopPropagation(); // Stop event bubbling

    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    try {
      await deleteTrip(tripId);
      // Update state by filtering out the deleted trip
      setTrips((prevTrips) => prevTrips.filter((trip) => trip._id !== tripId));
    } catch (err) {
      console.error('Failed to delete trip', err);
      if (err.response && err.response.status === 401) {
        logout();
      } else {
        setError('Failed to delete trip.');
      }
    }
  };
  // ✅ ------------------------------

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    // Show loader only on initial fetch
    if (isLoading && trips.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      );
    }
    if (trips.length === 0) {
      return (
        <div className="text-center h-64 flex flex-col items-center justify-center text-foreground-secondary">
          <Map className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">
            No trips yet
          </h3>
          <p>Create your first trip above to get started.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          // ✅ --- MODIFIED TRIP CARD ---
          <div
            key={trip._id}
            className="relative p-6 bg-background-secondary rounded-lg border border-border transition-colors duration-200 group hover:border-accent"
          >
            <Link
              to={`/tripcanvas/${trip._id}`}
              className="absolute inset-0 z-0"
              aria-label={`View trip: ${trip.name}`}
            ></Link>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                {trip.name}
              </h3>
              <span className="text-sm text-foreground-secondary">
                {trip.owner === user?._id
                  ? 'Owned by you'
                  : 'Shared with you'}
              </span>
            </div>

            <button
              onClick={(e) => handleDeleteTrip(e, trip._id)}
              className="absolute z-20 top-4 right-4 p-1.5 rounded-full text-foreground-secondary hover:bg-red-800 hover:text-white transition-colors"
              aria-label="Delete trip"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          // ✅ --------------------------
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">
            Welcome, {user?.username || 'User'}
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary text-foreground-secondary border border-border rounded-md hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </header>

        {/* Create New Trip Form */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Start a new trip</h2>
          <form onSubmit={handleCreateTrip} className="flex flex-col gap-2">
            <div className="flex gap-4">
              <input
                type="text"
                value={newTripName}
                onChange={(e) => {
                  setNewTripName(e.target.value);
                  if (warning) setWarning(''); // clear warning while typing
                }}
                placeholder="e.g., 'Bengaluru Tech Tour'"
                className="flex-grow px-4 py-2 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-hover transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span>Create</span>
              </button>
            </div>
            {warning && <p className="text-red-500">{warning}</p>}
          </form>
        </section>

        {/* Trips List */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Your Trips</h2>
          {renderContent()}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;