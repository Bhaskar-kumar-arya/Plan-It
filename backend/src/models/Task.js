import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema({
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  nodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Node',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

const Task = mongoose.model('Task', taskSchema);
export default Task;