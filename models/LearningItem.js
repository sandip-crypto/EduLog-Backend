const mongoose = require('mongoose');

const learningItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Course', 'Tutorial', 'Skill', 'Book', 'Other'],
    default: 'Course'
  },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty links
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['Started', 'In Progress', 'Completed'],
    default: 'Started'
  },
  notes: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
learningItemSchema.index({ user: 1, status: 1 });
learningItemSchema.index({ user: 1, type: 1 });
learningItemSchema.index({ user: 1, title: 'text', notes: 'text' });

module.exports = mongoose.model('LearningItem', learningItemSchema);