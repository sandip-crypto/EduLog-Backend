const express = require('express');
const LearningItem = require('../models/LearningItem');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(authMiddleware);

// Get all learning items for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { status, type, search } = req.query;
    
    // Build query
    let query = { user: req.userId };
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (type && type !== 'All') {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const learningItems = await LearningItem.find(query)
      .sort({ updatedAt: -1 }); // Sort by most recently updated

    res.json(learningItems);
  } catch (error) {
    console.error('Get learning items error:', error);
    res.status(500).json({ message: 'Server error while fetching learning items' });
  }
});

// Get a single learning item by ID
router.get('/:id', async (req, res) => {
  try {
    const learningItem = await LearningItem.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!learningItem) {
      return res.status(404).json({ message: 'Learning item not found' });
    }

    res.json(learningItem);
  } catch (error) {
    console.error('Get learning item error:', error);
    res.status(500).json({ message: 'Server error while fetching learning item' });
  }
});

// Create a new learning item
router.post('/', async (req, res) => {
  try {
    const { title, type, link, status, notes } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const learningItem = new LearningItem({
      title: title.trim(),
      type: type || 'Course',
      link: link ? link.trim() : '',
      status: status || 'Started',
      notes: notes ? notes.trim() : '',
      user: req.userId
    });

    await learningItem.save();
    res.status(201).json(learningItem);
  } catch (error) {
    console.error('Create learning item error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating learning item' });
  }
});

// Update a learning item
router.put('/:id', async (req, res) => {
  try {
    const { title, type, link, status, notes } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (type !== undefined) updateData.type = type;
    if (link !== undefined) updateData.link = link.trim();
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes.trim();
    
    updateData.updatedAt = new Date();

    const learningItem = await LearningItem.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!learningItem) {
      return res.status(404).json({ message: 'Learning item not found' });
    }

    res.json(learningItem);
  } catch (error) {
    console.error('Update learning item error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating learning item' });
  }
});

// Delete a learning item
router.delete('/:id', async (req, res) => {
  try {
    const learningItem = await LearningItem.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!learningItem) {
      return res.status(404).json({ message: 'Learning item not found' });
    }

    res.json({ message: 'Learning item deleted successfully' });
  } catch (error) {
    console.error('Delete learning item error:', error);
    res.status(500).json({ message: 'Server error while deleting learning item' });
  }
});

// Get learning statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await LearningItem.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await LearningItem.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      typeStats: typeStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;