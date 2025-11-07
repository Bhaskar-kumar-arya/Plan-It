import { Client } from "@googlemaps/google-maps-services-js";
import asyncHandler from 'express-async-handler';
import { GOOGLE_MAPS_API_KEY } from '../config/index.js';

// Initialize the Google Maps Client
const client = new Client({});

// Helper function to simplify place results
const simplifyPlace = (place) => {
  return {
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address,
    location: place.geometry.location,
    icon: place.icon,
  };
};

/**
 * @desc Search for places (Find Any Place / Discover New Places)
 * @route POST /api/google/search
 * @access Private
 */
export const searchPlaces = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) {
    res.status(400);
    throw new Error('Search query is required');
  }

  try {
    const response = await client.textSearch({
      params: {
        query: query,
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000, // optional
    });

    const simplifiedResults = response.data.results.map(simplifyPlace);
    res.json(simplifiedResults);

  } catch (error) {
    console.error('Google Maps API Error (searchPlaces):', error.response?.data?.error_message || error.message);
    res.status(500);
    throw new Error('Failed to search places');
  }
});

/**
 * @desc Find places nearby a specific location (Find What's Nearby)
 * @route POST /api/google/nearby
 * @access Private
 */
export const findNearby = asyncHandler(async (req, res) => {
  const { placeId, query, radius = 5000 } = req.body; // radius in meters
  if (!placeId || !query) {
    res.status(400);
    throw new Error('Place ID and query are required');
  }

  try {
    // 1. Get the location (lat/lng) of the origin place
    const detailsResponse = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: ['geometry.location'],
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const location = detailsResponse.data.result.geometry.location; // { lat, lng }

    // 2. Search for the query near that location
    const nearbyResponse = await client.nearbySearch({
      params: {
        location: location,
        radius: parseInt(radius, 10),
        keyword: query, // 'query' for text, 'keyword' for categories
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const simplifiedResults = nearbyResponse.data.results.map(simplifyPlace);
    res.json(simplifiedResults);

  } catch (error) {
    console.error('Google Maps API Error (findNearby):', error.response?.data?.error_message || error.message);
    res.status(500);
    throw new Error('Failed to find nearby places');
  }
});

/**
 * @desc Get travel time and mode (See Travel Times Instantly)
 * @route POST /api/google/directions
 * @access Private
 */
export const getDirections = asyncHandler(async (req, res) => {
  const { originPlaceId, destinationPlaceId } = req.body;
  if (!originPlaceId || !destinationPlaceId) {
    res.status(400);
    throw new Error('Origin and destination place IDs are required');
  }

  try {
    const response = await client.directions({
      params: {
        origin: `place_id:${originPlaceId}`,
        destination: `place_id:${destinationPlaceId}`,
        // mode: 'driving' // You can specify, or let Google choose the best
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    // Parse the response to get just what we need
    if (response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0]; // Assuming one leg

      // Determine travel mode (Google's is uppercase)
      let mode = 'drive'; // default
      if (leg.steps.some(step => step.travel_mode === 'TRANSIT')) {
        mode = 'transit';
      } else if (leg.steps.some(step => step.travel_mode === 'WALKING') && !leg.steps.some(step => step.travel_mode === 'DRIVING')) {
        mode = 'walk';
      }

      const travelInfo = {
        timeText: leg.duration.text, // e.g., "22 min"
        distanceText: leg.distance.text, // e.g., "5.1 km"
        mode: mode, // 'drive', 'transit', or 'walk'
      };

      res.json(travelInfo);
    } else {
      res.status(404);
      throw new Error('No routes found between these locations');
    }
  } catch (error) {
    console.error('Google Maps API Error (getDirections):', error.response?.data?.error_message || error.message);
    res.status(500);
    throw new Error('Failed to get directions');
  }
});