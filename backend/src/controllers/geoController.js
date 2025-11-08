//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\controllers\geoController.js
//================================================================================

import axios from 'axios';
import asyncHandler from 'express-async-handler';

const PHOTON_API_URL = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE_API_URL = 'https://photon.komoot.io/reverse';

// Helper function to simplify Photon results
const simplifyPhotonPlace = (feature) => {
  const props = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;

  // Build a formatted address
  let address = props.name;
  if (props.street) {
    address = `${props.name}, ${props.street}`;
  }
  if (props.city && props.city !== props.name) {
    address = `${address}, ${props.city}`;
  }
  if (props.country) {
    address = `${address}, ${props.country}`;
  }

  return {
    name: props.name,
    address: address, // Formatted, e.g., "Eiffel Tower, Paris, France"
    coordinates: { lat, lng },
    country: props.country,
    city: props.city,
    street: props.street,
    osm_id: props.osm_id,
  };
};

/**
 * @desc Search for places (Forward Geocoding)
 * @route POST /api/geo/search
 * @access Private
 */
export const searchPlaces = asyncHandler(async (req, res) => {
  const { query, bias_lat, bias_lon } = req.body;
  if (!query) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const params = {
    q: query,
    limit: 10,
  };

  // Add location bias if provided
  if (bias_lat && bias_lon) {
    params.lat = bias_lat;
    params.lon = bias_lon;
  }

  try {
    const response = await axios.get(PHOTON_API_URL, { params });
    const simplifiedResults = response.data.features.map(simplifyPhotonPlace);
    res.json(simplifiedResults);
  } catch (error) {
    console.error('Photon API Error (searchPlaces):', error.message);
    res.status(500);
    throw new Error('Failed to search places');
  }
});

/**
 * @desc Find address for coordinates (Reverse Geocoding)
 * @route GET /api/geo/reverse
 * @access Private
 */
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const params = { lat, lon, limit: 1 };

  try {
    const response = await axios.get(PHOTON_REVERSE_API_URL, { params });
    if (response.data.features.length > 0) {
      const simplifiedResult = simplifyPhotonPlace(response.data.features[0]);
      res.json(simplifiedResult);
    } else {
      res.status(404).json({ message: 'No location found' });
    }
  } catch (error) {
    console.error('Photon API Error (reverseGeocode):', error.message);
    res.status(500);
    throw new Error('Failed to reverse geocode');
  }
});