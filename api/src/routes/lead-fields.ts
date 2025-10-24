import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// Get all lead fields (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has admin privileges (authLevel: 1)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can view lead fields'
      });
    }

    const fieldsSnapshot = await db.collection('leadFields').orderBy('createdAt', 'asc').get();
    const customFields = fieldsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));

    // Add essential system fields that are always available
    const essentialFields = [
      {
        id: 'system-email',
        name: 'email',
        label: 'Email',
        type: 'email',
        required: false,
        options: [],
        isSystemField: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-phone',
        name: 'phone',
        label: 'Phone',
        type: 'phone',
        required: false,
        options: [],
        isSystemField: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-name',
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: false,
        options: [],
        isSystemField: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-company',
        name: 'companyName',
        label: 'Company Name',
        type: 'text',
        required: false,
        options: [],
        isSystemField: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-status',
        name: 'status',
        label: 'Status',
        type: 'select',
        required: false,
        options: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
        isSystemField: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-active-pipeline',
        name: 'active_in_pipeline',
        label: 'Active in Pipeline',
        type: 'text',
        required: false,
        options: [],
        isSystemField: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Combine essential fields with custom fields
    const allFields = [...essentialFields, ...customFields];

    res.json({ success: true, fields: allFields });

  } catch (error: any) {
    console.error('Error fetching lead fields:', error);
    res.status(500).json({ error: 'Failed to fetch lead fields', message: error.message });
  }
});

// Create new lead field (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can create lead fields'
      });
    }

    const { name, label, type, required, options } = req.body;

    if (!name || !label || !type) {
      return res.status(400).json({ error: 'Name, label, and type are required' });
    }

    const fieldData = {
      name,
      label,
      type,
      required: required || false,
      options: options || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await db.collection('leadFields').add(fieldData);

    res.json({
      success: true,
      field: {
        id: docRef.id,
        ...fieldData
      }
    });

  } catch (error: any) {
    console.error('Error creating lead field:', error);
    res.status(500).json({ error: 'Failed to create lead field', message: error.message });
  }
});

// Update lead field (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const fieldId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can update lead fields'
      });
    }

    const { name, label, type, required, options } = req.body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (label) updateData.label = label;
    if (type) updateData.type = type;
    if (required !== undefined) updateData.required = required;
    if (options !== undefined) updateData.options = options;

    await db.collection('leadFields').doc(fieldId).update(updateData);

    res.json({
      success: true,
      message: 'Lead field updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating lead field:', error);
    res.status(500).json({ error: 'Failed to update lead field', message: error.message });
  }
});

// Delete lead field (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const fieldId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can delete lead fields'
      });
    }

    await db.collection('leadFields').doc(fieldId).delete();

    res.json({
      success: true,
      message: 'Lead field deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting lead field:', error);
    res.status(500).json({ error: 'Failed to delete lead field', message: error.message });
  }
});

export default router;

