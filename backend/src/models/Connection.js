//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\models\Connection.js
//================================================================================

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
  sourceHandle: {
    type: String,
    default: null
  },
  targetHandle: {
    type: String,
    default: null
  },
  // ✅ --- 'travelInfo' field has been completely removed ---
});

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;