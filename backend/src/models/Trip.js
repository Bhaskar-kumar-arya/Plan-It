//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\backend\src\models\Trip.js
//================================================================================

import mongoose, { Schema } from 'mongoose';

const collaboratorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['editor', 'viewer'],
    default: 'viewer',
    required: true
  }
});

const tripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [collaboratorSchema],
  // ✅ --- ADDED SHARE SETTINGS ---
  shareEnabled: {
    type: Boolean,
    default: false
  },
  sharePassword: {
    type: String, // This will be a bcrypt hash
    default: null
  }
  // ✅ --- END ---
}, {
  timestamps: true
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;