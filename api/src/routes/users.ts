import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges (authLevel: 1)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can view all users'
      });
    }

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    const users = usersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        authLevel: data.authLevel,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt
      };
    });

    // Sort by creation date (newest first)
    users.sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    console.log(`👥 Admin ${userId} fetched ${users.length} users`);

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Update user last login time
router.put('/last-login', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Update last login time
    await db.collection('users').doc(userId).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`🕒 Updated last login for user ${userId}`);

    res.json({
      success: true,
      message: 'Last login updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating last login:', error);
    res.status(500).json({
      error: 'Failed to update last login',
      message: error.message
    });
  }
});

export default router;
