import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    // Basic email format validation
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  passwordHash: {
    type: String,
    required: true
  }
}, {
  // Automatically adds createdAt and updatedAt fields
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;