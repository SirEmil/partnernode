import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

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

    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    // Get Firebase Auth user data for last login times
    const authUsers = await auth.listUsers();
    const authUsersMap = new Map();
    authUsers.users.forEach(userRecord => {
      authUsersMap.set(userRecord.uid, userRecord);
    });
    
    const users = usersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      const authUser = authUsersMap.get(data.uid);
      
      return {
        id: doc.id,
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        authLevel: data.authLevel,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastLoginAt: authUser?.metadata?.lastSignInTime ? new Date(authUser.metadata.lastSignInTime) : null,
        disabled: authUser?.disabled || false,
        justcallAgentId: data.justcallAgentId
      };
    });

    // Sort by creation date (newest first)
    users.sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    console.log(`👥 Admin ${userId} fetched ${users.length} users`);
    console.log(`🔍 Firebase Auth users found: ${authUsers.users.length}`);
    console.log(`🔍 Users with last login data: ${users.filter(u => u.lastLoginAt).length}`);

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

// Update user information (admin only)
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user?.uid;
    const targetUserId = req.params.userId;
    const { firstName, lastName, authLevel, justcallAgentId } = req.body;

    if (!adminUserId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if admin user has admin privileges
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can update user information'
      });
    }

    // Validate input
    if (authLevel !== undefined && ![0, 1].includes(authLevel)) {
      return res.status(400).json({
        error: 'Invalid authLevel',
        message: 'authLevel must be 0 (user) or 1 (admin)'
      });
    }

    // Update user in Firestore
    const updateData: any = {
      updatedAt: new Date()
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (authLevel !== undefined) updateData.authLevel = authLevel;
    if (justcallAgentId !== undefined) updateData.justcallAgentId = justcallAgentId;

    await db.collection('users').doc(targetUserId).update(updateData);

    console.log(`👤 Admin ${adminUserId} updated user ${targetUserId}:`, updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// Enable/disable user account (admin only)
router.put('/:userId/status', authenticateToken, async (req, res) => {
  try {
    const adminUserId = req.user?.uid;
    const targetUserId = req.params.userId;
    const { disabled } = req.body;

    if (!adminUserId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if admin user has admin privileges
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    const adminData = adminDoc.data();

    if (!adminData || adminData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can modify user status'
      });
    }

    // Validate input
    if (typeof disabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid disabled value',
        message: 'disabled must be a boolean value'
      });
    }

    // Update user status in Firebase Auth
    await auth.updateUser(targetUserId, { disabled });

    console.log(`👤 Admin ${adminUserId} ${disabled ? 'disabled' : 'enabled'} user ${targetUserId}`);

    res.json({
      success: true,
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
      disabled
    });

  } catch (error: any) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      error: 'Failed to update user status',
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
