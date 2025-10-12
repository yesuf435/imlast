const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'location', 'emoji'],
    default: 'text'
  },
  fileInfo: {
    filename: String,
    originalName: String,
    fileSize: Number,
    mimeType: String,
    fileUrl: String,
    thumbnail: String
  },
  metadata: {
    latitude: Number,
    longitude: Number,
    address: String,
    duration: Number, // for audio/video
    width: Number,   // for images/videos
    height: Number   // for images/videos
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);

