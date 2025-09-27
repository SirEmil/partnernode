import express from 'express';
import Joi from 'joi';
import { db } from '../config/firebase';
import { authenticateToken } from '../middleware/auth';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
      };
    }
  }
}

const router = express.Router();

interface Terms {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Validation schemas
const createTermsSchema = Joi.object({
  name: Joi.string().required().max(100),
  url: Joi.string().required().uri()
});

const updateTermsSchema = Joi.object({
  name: Joi.string().optional().max(100),
  url: Joi.string().optional().uri()
});

// Get all terms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    
    const snapshot = await db.collection('terms')
      .where('createdBy', '==', userId)
      .get();

    const terms: Terms[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as Omit<Terms, 'id'>;
      terms.push({
        id: doc.id,
        ...data
      });
    });

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

// Get single terms
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    const doc = await db.collection('terms').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Terms not found' });
    }

    const terms = doc.data() as Terms;
    
    if (terms.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        ...terms,
        id: doc.id
      }
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

// Create terms
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createTermsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user?.uid;
    const termsData: Omit<Terms, 'id'> = {
      ...value,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await db.collection('terms').add(termsData);

    res.status(201).json({
      success: true,
      message: 'Terms created successfully',
      data: {
        id: docRef.id,
        ...termsData
      }
    });
  } catch (error) {
    console.error('Error creating terms:', error);
    res.status(500).json({ error: 'Failed to create terms' });
  }
});

// Update terms
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTermsSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user?.uid;

    // Check if terms exists and belongs to user
    const doc = await db.collection('terms').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Terms not found' });
    }

    const terms = doc.data() as Terms;
    if (terms.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update terms
    const updateData = {
      ...value,
      updatedAt: new Date()
    };

    await db.collection('terms').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Terms updated successfully',
      data: {
        ...terms,
        ...updateData,
        id
      }
    });
  } catch (error) {
    console.error('Error updating terms:', error);
    res.status(500).json({ error: 'Failed to update terms' });
  }
});

// Delete terms
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    // Check if terms exists and belongs to user
    const doc = await db.collection('terms').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Terms not found' });
    }

    const terms = doc.data() as Terms;
    if (terms.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('terms').doc(id).delete();

    res.json({
      success: true,
      message: 'Terms deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting terms:', error);
    res.status(500).json({ error: 'Failed to delete terms' });
  }
});

export default router;
