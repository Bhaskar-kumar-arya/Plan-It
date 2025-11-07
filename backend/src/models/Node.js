import mongoose, { Schema } from 'mongoose';

const nodeSchema = new Schema({
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true // Index for faster queries by trip
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['location', 'note'], // Based on Core Features (Add Location, Add Note)
    default: 'location'
  },
  // ✅ ADDED: This field controls if it's on the canvas or in the bin
  displayType: {
    type: String,
    enum: ['canvas', 'bin'],
    default: 'canvas'
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  details: {
    googlePlaceId: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  timing: {
    arrival: { type: Date },
    departure: { type: Date }
  },
  cost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['idea', 'confirmed', 'booked'], // Based on Core Features
    default: 'idea'
  }
}, {
  timestamps: true
});

const Node = mongoose.model('Node', nodeSchema);
export default Node;