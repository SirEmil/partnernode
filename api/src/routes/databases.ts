import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

interface LeadDatabase {
  id: string;
  name: string;
  description: string;
  type: 'leads' | 'sales';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Get all databases
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
        error: 'Only admins can access databases'
      });
    }

    // Get all databases from Firestore
    const databasesSnapshot = await db.collection('databases').get();
    
    const databases = [];
    for (const doc of databasesSnapshot.docs) {
      const data = doc.data();
      
      // Optionally count leads in this database (if you have a leadDatabase field)
      // const leadsSnapshot = await db.collection('leads-collection').where('database', '==', doc.id).get();
      // const leadCount = leadsSnapshot.size;
      
      databases.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        type: data.type || 'leads',
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        createdBy: data.createdBy,
        // leadCount: leadCount
      });
    }
    
    res.json({
      success: true,
      databases
    });

  } catch (error: any) {
    console.error('Error fetching databases:', error);
    res.status(500).json({
      error: 'Failed to fetch databases',
      details: error.message
    });
  }
});

// Get single database by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const databaseId = req.params.id;

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
        error: 'Only admins can access databases'
      });
    }

    const databaseDoc = await db.collection('databases').doc(databaseId).get();

    if (!databaseDoc.exists) {
      return res.status(404).json({
        error: 'Database not found'
      });
    }

    const data = databaseDoc.data();

    res.json({
      success: true,
      database: {
        id: databaseDoc.id,
        name: data!.name,
        description: data!.description,
        type: data!.type || 'leads',
        createdAt: data!.createdAt?.toDate?.() || data!.createdAt,
        updatedAt: data!.updatedAt?.toDate?.() || data!.updatedAt,
        createdBy: data!.createdBy
      }
    });

  } catch (error: any) {
    console.error('Error fetching database:', error);
    res.status(500).json({
      error: 'Failed to fetch database',
      details: error.message
    });
  }
});

// Create new database
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { name, description, type } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        error: 'Database name is required'
      });
    }

    if (!type || !['leads', 'sales'].includes(type)) {
      return res.status(400).json({
        error: 'Database type must be either "leads" or "sales"'
      });
    }

    // Check if user has admin privileges (authLevel: 1)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Only admins can create databases'
      });
    }

    // Use the name as the document ID (normalized)
    const databaseId = name.trim();

    // Check if database with this name already exists
    const existingDatabase = await db.collection('databases').doc(databaseId).get();
    if (existingDatabase.exists) {
      return res.status(400).json({
        error: 'A database with this name already exists'
      });
    }

    const now = new Date();
    const databaseData = {
      name: name.trim(),
      description: description || '',
      type: type,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    };

    // Create database document with name as ID
    await db.collection('databases').doc(databaseId).set(databaseData);

    res.json({
      success: true,
      message: 'Database created successfully',
      database: {
        id: databaseId,
        ...databaseData
      }
    });

  } catch (error: any) {
    console.error('Error creating database:', error);
    res.status(500).json({
      error: 'Failed to create database',
      details: error.message
    });
  }
});

// Update database
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const databaseId = req.params.id;
    const { description } = req.body; // Name and type cannot be changed

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges (authLevel: 1)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Only admins can update databases'
      });
    }

    const databaseDoc = await db.collection('databases').doc(databaseId).get();

    if (!databaseDoc.exists) {
      return res.status(404).json({
        error: 'Database not found'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    // Type cannot be changed after creation
    await db.collection('databases').doc(databaseId).update(updateData);

    const updatedDoc = await db.collection('databases').doc(databaseId).get();
    const updatedData = updatedDoc.data();

    res.json({
      success: true,
      message: 'Database updated successfully',
      database: {
        id: updatedDoc.id,
        name: updatedData!.name,
        description: updatedData!.description,
        type: updatedData!.type || 'leads',
        createdAt: updatedData!.createdAt?.toDate?.() || updatedData!.createdAt,
        updatedAt: updatedData!.updatedAt?.toDate?.() || updatedData!.updatedAt,
        createdBy: updatedData!.createdBy
      }
    });

  } catch (error: any) {
    console.error('Error updating database:', error);
    res.status(500).json({
      error: 'Failed to update database',
      details: error.message
    });
  }
});

// Delete database
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const databaseId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges (authLevel: 1)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Only admins can delete databases'
      });
    }

    const databaseDoc = await db.collection('databases').doc(databaseId).get();

    if (!databaseDoc.exists) {
      return res.status(404).json({
        error: 'Database not found'
      });
    }

    // Delete the database
    await db.collection('databases').doc(databaseId).delete();

    res.json({
      success: true,
      message: 'Database deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting database:', error);
    res.status(500).json({
      error: 'Failed to delete database',
      details: error.message
    });
  }
});

export default router;

