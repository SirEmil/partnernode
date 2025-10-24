import express from 'express';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// Extend Request interface to include user
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

// SMS Settings validation schema
const smsSettingsSchema = Joi.object({
  senderNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)'
  }),
  callingNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)'
  })
});

// Get SMS settings (global - one number for all users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Get global SMS settings (not user-specific)
    const doc = await db.collection('smsSettings').doc('global').get();
    
    if (!doc.exists) {
      return res.json({
        success: true,
        data: { 
          senderNumber: '',
          callingNumber: ''
        }
      });
    }
    
    const data = doc.data();
    res.json({
      success: true,
      data: {
        senderNumber: data?.senderNumber || '',
        callingNumber: data?.callingNumber || ''
      }
    });
  } catch (error: any) {
    console.error('Error fetching SMS settings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update SMS settings (global - one number for all users)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Validate request body
    const { error, value } = smsSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }
    
    const { senderNumber, callingNumber } = value;
    
    // Save to Firestore as global settings (not user-specific)
    await db.collection('smsSettings').doc('global').set({
      senderNumber,
      callingNumber,
      updatedBy: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    res.json({
      success: true,
      message: 'Global SMS settings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating SMS settings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
