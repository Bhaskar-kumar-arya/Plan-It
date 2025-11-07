import mongoose, { Schema } from 'mongoose';

const activitySchema = new Schema({
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  }
}, {
  // This configuration automatically creates a 'timestamp' field
  // instead of 'createdAt' and disables 'updatedAt'.
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;