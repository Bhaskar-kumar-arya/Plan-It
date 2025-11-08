import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export configuration constants
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = process.env.PORT || 5001;
// export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; 