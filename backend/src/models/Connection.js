import mongoose, { Schema } from 'mongoose';

const connectionSchema = new Schema({
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  fromNodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Node',
    required: true
  },
  toNodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Node',
    required: true
  },
  // ✅ --- ADDED ---
  sourceHandle: {
    type: String,
    default: null
  },
  targetHandle: {
    type: String,
    default: null
  },
  // ✅ --- END ---
  travelInfo: {
    mode: { type: String },
    timeText: { type: String }
  }
  // No timestamps needed as these are simple relationships
});

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;