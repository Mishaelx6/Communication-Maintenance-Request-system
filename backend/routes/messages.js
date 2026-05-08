const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Send a message
router.post('/', [
  auth,
  body('receiver_id').isInt().withMessage('Receiver ID must be an integer'),
  body('subject').optional().trim().isLength({ max: 255 }).withMessage('Subject too long'),
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiver_id, subject, content } = req.body;
    const sender_id = req.user.id;

    // Check if receiver exists
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create message
    const messageId = await Message.create({
      sender_id,
      receiver_id,
      subject: subject || 'No Subject',
      content
    });

    // Return the created message with details
    const message = await Message.findById(messageId);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// Get all messages for current user
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query; // 'sent', 'received', or 'all'
    const messages = await Message.findByUserId(req.user.id, type);
    
    res.json({
      message: 'Messages retrieved successfully',
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while retrieving messages' });
  }
});

// Get conversation between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.findConversation(req.user.id, parseInt(userId));
    
    res.json({
      message: 'Conversation retrieved successfully',
      data: messages,
      otherUser: { id: otherUser.id, name: otherUser.name, email: otherUser.email, role: otherUser.role }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error while retrieving conversation' });
  }
});

// Get single message
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or receiver
    if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      message: 'Message retrieved successfully',
      data: message
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ message: 'Server error while retrieving message' });
  }
});

// Get all users for messaging (for dropdown/selection)
router.get('/users/all', auth, async (req, res) => {
  try {
    const users = await User.findAll();
    
    // Filter out current user
    const otherUsers = users.filter(user => user.id !== req.user.id);
    
    res.json({
      message: 'Users retrieved successfully',
      data: otherUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while retrieving users' });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deleted = await Message.delete(id);
    
    if (deleted) {
      res.json({ message: 'Message deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete message' });
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
});

module.exports = router;
