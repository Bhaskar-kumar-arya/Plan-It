import mongoose, { Schema } from 'mongoose';

const commentSchema = new Schema({
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
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;