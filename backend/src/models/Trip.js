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
  collaborators: [collaboratorSchema]
}, {
  timestamps: true
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;