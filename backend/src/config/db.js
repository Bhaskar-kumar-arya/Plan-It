import mongoose from 'mongoose';
import { MONGO_URI } from './index.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}, URI : ${MONGO_URI}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;