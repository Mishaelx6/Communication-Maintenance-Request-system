const express = require('express');
const { body, validationResult } = require('express-validator');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Create maintenance request (tenants only)
router.post('/', [
  auth,
  authorize('tenant'),
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const tenant_id = req.user.id;

    const requestId = await MaintenanceRequest.create({
      tenant_id,
      title,
      description
    });

    const request = await MaintenanceRequest.findById(requestId);

    res.status(201).json({
      message: 'Maintenance request created successfully',
      data: request
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error while creating maintenance request' });
  }
});

// Get all maintenance requests (landlords and property managers)
router.get('/', [
  auth,
  authorize('landlord', 'property_manager')
], async (req, res) => {
  try {
    const { status, assigned_to } = req.query;
    
    let assignedTo = null;
    if (assigned_to) {
      assignedTo = parseInt(assigned_to);
    }

    const requests = await MaintenanceRequest.findAll(status, assignedTo);
    
    res.json({
      message: 'Maintenance requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Server error while retrieving maintenance requests' });
  }
});

// Get tenant's own maintenance requests
router.get('/my-requests', [
  auth,
  authorize('tenant')
], async (req, res) => {
  try {
    const requests = await MaintenanceRequest.findByTenantId(req.user.id);
    
    res.json({
      message: 'Your maintenance requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    console.error('Get tenant maintenance requests error:', error);
    res.status(500).json({ message: 'Server error while retrieving your maintenance requests' });
  }
});

// Get single maintenance request
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await MaintenanceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check permissions
    if (req.user.role === 'tenant' && request.tenant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get status updates
    const updates = await MaintenanceRequest.getUpdates(id);

    res.json({
      message: 'Maintenance request retrieved successfully',
      data: { ...request, updates }
    });
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ message: 'Server error while retrieving maintenance request' });
  }
});

// Update maintenance request status (landlords and property managers)
router.patch('/:id/status', [
  auth,
  authorize('landlord', 'property_manager'),
  body('status').isIn(['open', 'pending', 'in_progress', 'completed']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Update status
    const updated = await MaintenanceRequest.updateStatus(
      parseInt(id),
      status,
      req.user.id, // Assign to current user (property manager/landlord)
      req.user.id
    );

    if (updated) {
      // Add notes if provided
      if (notes) {
        await MaintenanceRequest.addUpdate(
          parseInt(id),
          req.user.id,
          request.status,
          status,
          notes
        );
      }

      const updatedRequest = await MaintenanceRequest.findById(id);
      const updates = await MaintenanceRequest.getUpdates(id);

      res.json({
        message: 'Maintenance request status updated successfully',
        data: { ...updatedRequest, updates }
      });
    } else {
      res.status(400).json({ message: 'Failed to update maintenance request status' });
    }
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ message: 'Server error while updating maintenance request' });
  }
});

// Add update note to maintenance request
router.post('/:id/updates', [
  auth,
  authorize('landlord', 'property_manager'),
  body('notes').trim().isLength({ min: 1, max: 500 }).withMessage('Notes must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const updateId = await MaintenanceRequest.addUpdate(
      parseInt(id),
      req.user.id,
      request.status,
      request.status,
      notes
    );

    const updates = await MaintenanceRequest.getUpdates(id);

    res.status(201).json({
      message: 'Update added successfully',
      data: { updateId, updates }
    });
  } catch (error) {
    console.error('Add maintenance update error:', error);
    res.status(500).json({ message: 'Server error while adding maintenance update' });
  }
});

// Delete maintenance request (landlords and property managers only)
router.delete('/:id', [
  auth,
  authorize('landlord', 'property_manager')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const deleted = await MaintenanceRequest.delete(parseInt(id));
    
    if (deleted) {
      res.json({ message: 'Maintenance request deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete maintenance request' });
    }
  } catch (error) {
    console.error('Delete maintenance request error:', error);
    res.status(500).json({ message: 'Server error while deleting maintenance request' });
  }
});

module.exports = router;
