import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

interface Pipeline {
  id: string;
  name: string;
  description: string;
  assignedRepId: string; // Single assigned rep
  assignedRepEmail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get all pipelines (admin only)
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
        message: 'Only admin users can view pipelines'
      });
    }

    // Get all pipelines from Firestore
    const pipelinesSnapshot = await db.collection('pipelines').get();
    
    const pipelines = [];
    for (const doc of pipelinesSnapshot.docs) {
      const data = doc.data();
      
      // Get pipeline items from subcollection
      const itemsSnapshot = await db.collection('pipelines').doc(doc.id).collection('items').get();
      const items = itemsSnapshot.docs.map((itemDoc: any) => {
        const itemData = itemDoc.data();
        return {
          id: itemDoc.id,
          name: itemData.name,
          description: itemData.description,
          order: itemData.order,
          type: itemData.type,
          config: itemData.config,
          isRequired: itemData.isRequired,
          createdAt: itemData.createdAt?.toDate?.() || itemData.createdAt,
          updatedAt: itemData.updatedAt?.toDate?.() || itemData.updatedAt
        };
      });
      
      // Get pipeline stages from subcollection
      const stagesSnapshot = await db.collection('pipelines').doc(doc.id).collection('stages').get();
      const stages = stagesSnapshot.docs.map((stageDoc: any) => {
        const stageData = stageDoc.data();
        return {
          id: stageDoc.id,
          name: stageData.name,
          order: stageData.order,
          isRequired: stageData.isRequired,
          createdAt: stageData.createdAt?.toDate?.() || stageData.createdAt,
          updatedAt: stageData.updatedAt?.toDate?.() || stageData.updatedAt
        };
      });
      
      // Sort stages by order
      stages.sort((a: any, b: any) => a.order - b.order);
      
      pipelines.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        assignedRepId: data.assignedRepId,
        assignedRepEmail: data.assignedRepEmail,
        isActive: data.isActive || false,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        createdBy: data.createdBy,
        items: items,
        stages: stages
      });
    }

    // Sort by creation date (newest first)
    pipelines.sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    console.log(`🔧 Admin ${userId} fetched ${pipelines.length} pipelines`);

    res.json({
      success: true,
      pipelines,
      count: pipelines.length
    });

  } catch (error: any) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({
      error: 'Failed to fetch pipelines',
      message: error.message
    });
  }
});

// Create new pipeline (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { name, description, assignedRepId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can create pipelines'
      });
    }

    // Validate input
    if (!name || !description || !assignedRepId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, description, and assigned rep are required'
      });
    }

    // Get assigned rep details
    const repDoc = await db.collection('users').doc(assignedRepId).get();
    if (!repDoc.exists) {
      return res.status(400).json({
        error: 'Invalid assigned rep',
        message: 'The assigned rep does not exist'
      });
    }
    const repData = repDoc.data();

    // Create pipeline document
    const pipelineData = {
      name: name.trim(),
      description: description.trim(),
      assignedRepId: assignedRepId,
      assignedRepEmail: repData?.email || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await db.collection('pipelines').add(pipelineData);

    console.log(`🔧 Admin ${userId} created pipeline: ${docRef.id} assigned to ${assignedRepId}`);

    res.json({
      success: true,
      message: 'Pipeline created successfully',
      pipelineId: docRef.id
    });

  } catch (error: any) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({
      error: 'Failed to create pipeline',
      message: error.message
    });
  }
});

// Update pipeline (admin only)
router.put('/:pipelineId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const { name, description, assignedRepId, isActive } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can update pipelines'
      });
    }

    // Validate input
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        error: 'Invalid name',
        message: 'Name cannot be empty'
      });
    }

    // If assignedRepId is being updated, validate it
    let assignedRepEmail = undefined;
    if (assignedRepId !== undefined) {
      const repDoc = await db.collection('users').doc(assignedRepId).get();
      if (!repDoc.exists) {
        return res.status(400).json({
          error: 'Invalid assigned rep',
          message: 'The assigned rep does not exist'
        });
      }
      const repData = repDoc.data();
      assignedRepEmail = repData?.email || '';
    }

    // Update pipeline
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (assignedRepId !== undefined) {
      updateData.assignedRepId = assignedRepId;
      updateData.assignedRepEmail = assignedRepEmail;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.collection('pipelines').doc(pipelineId).update(updateData);

    console.log(`🔧 Admin ${userId} updated pipeline ${pipelineId}:`, updateData);

    res.json({
      success: true,
      message: 'Pipeline updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error: any) {
    console.error('Error updating pipeline:', error);
    res.status(500).json({
      error: 'Failed to update pipeline',
      message: error.message
    });
  }
});

// Delete pipeline (admin only)
router.delete('/:pipelineId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can delete pipelines'
      });
    }

    // Check if pipeline exists
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    // Delete pipeline
    await db.collection('pipelines').doc(pipelineId).delete();

    console.log(`🔧 Admin ${userId} deleted pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({
      error: 'Failed to delete pipeline',
      message: error.message
    });
  }
});

// Get generic pipeline items (admin only)
router.get('/:pipelineId/items/generic', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can view pipeline items'
      });
    }

    // Get pipeline items from subcollection
    const itemsSnapshot = await db.collection('pipelines').doc(pipelineId).collection('items').get();
    const items = itemsSnapshot.docs.map((itemDoc: any) => {
      const itemData = itemDoc.data();
      return {
        id: itemDoc.id,
        name: itemData.name,
        description: itemData.description,
        order: itemData.order,
        type: itemData.type,
        config: itemData.config,
        isRequired: itemData.isRequired,
        createdAt: itemData.createdAt?.toDate?.() || itemData.createdAt,
        updatedAt: itemData.updatedAt?.toDate?.() || itemData.updatedAt
      };
    });

    // Sort by order
    items.sort((a: any, b: any) => a.order - b.order);

    res.json({
      success: true,
      items,
      count: items.length
    });

  } catch (error: any) {
    console.error('Error fetching pipeline items:', error);
    res.status(500).json({
      error: 'Failed to fetch pipeline items',
      message: error.message
    });
  }
});

// Create pipeline item (admin only)
router.post('/:pipelineId/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const { name, description, type, config, isRequired, order } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Validate input
    if (!name || !description || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, description, and type are required'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can create pipeline items'
      });
    }

    // Create pipeline item document
    const itemData = {
      name: name.trim(),
      description: description.trim(),
      type: type,
      config: config || {},
      isRequired: isRequired || false,
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('pipelines').doc(pipelineId).collection('items').add(itemData);

    console.log(`🔧 Admin ${userId} created pipeline item: ${docRef.id} in pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline item created successfully',
      itemId: docRef.id
    });

  } catch (error: any) {
    console.error('Error creating pipeline item:', error);
    res.status(500).json({
      error: 'Failed to create pipeline item',
      message: error.message
    });
  }
});

// Update pipeline item (admin only)
router.put('/:pipelineId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const itemId = req.params.itemId;
    const { name, description, type, config, isRequired, order } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can update pipeline items'
      });
    }

    // Update pipeline item
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = config;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (order !== undefined) updateData.order = order;

    await db.collection('pipelines').doc(pipelineId).collection('items').doc(itemId).update(updateData);

    console.log(`🔧 Admin ${userId} updated pipeline item ${itemId} in pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline item updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error: any) {
    console.error('Error updating pipeline item:', error);
    res.status(500).json({
      error: 'Failed to update pipeline item',
      message: error.message
    });
  }
});

// Delete pipeline item (admin only)
router.delete('/:pipelineId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const itemId = req.params.itemId;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can delete pipeline items'
      });
    }

    // Delete pipeline item
    await db.collection('pipelines').doc(pipelineId).collection('items').doc(itemId).delete();

    console.log(`🔧 Admin ${userId} deleted pipeline item ${itemId} from pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline item deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting pipeline item:', error);
    res.status(500).json({
      error: 'Failed to delete pipeline item',
      message: error.message
    });
  }
});

// Get pipeline stages (admin only)
router.get('/:pipelineId/stages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can view pipeline stages'
      });
    }

    // Get pipeline stages from subcollection
    const stagesSnapshot = await db.collection('pipelines').doc(pipelineId).collection('stages').get();
    const stages = stagesSnapshot.docs.map((stageDoc: any) => {
      const stageData = stageDoc.data();
      return {
        id: stageDoc.id,
        name: stageData.name,
        order: stageData.order,
        isRequired: stageData.isRequired,
        createdAt: stageData.createdAt?.toDate?.() || stageData.createdAt,
        updatedAt: stageData.updatedAt?.toDate?.() || stageData.updatedAt
      };
    });

    // Sort by order
    stages.sort((a: any, b: any) => a.order - b.order);

    res.json({
      success: true,
      stages,
      count: stages.length
    });

  } catch (error: any) {
    console.error('Error fetching pipeline stages:', error);
    res.status(500).json({
      error: 'Failed to fetch pipeline stages',
      message: error.message
    });
  }
});

// Create pipeline stage (admin only)
router.post('/:pipelineId/stages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const { name, isRequired, order } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can create pipeline stages'
      });
    }

    // Validate input
    if (!name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name is required'
      });
    }

    // Create pipeline stage document
    const stageData = {
      name: name.trim(),
      isRequired: isRequired || false,
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('pipelines').doc(pipelineId).collection('stages').add(stageData);

    console.log(`🔧 Admin ${userId} created pipeline stage: ${docRef.id} in pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline stage created successfully',
      stageId: docRef.id
    });

  } catch (error: any) {
    console.error('Error creating pipeline stage:', error);
    res.status(500).json({
      error: 'Failed to create pipeline stage',
      message: error.message
    });
  }
});

// Update pipeline stage (admin only)
router.put('/:pipelineId/stages/:stageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const stageId = req.params.stageId;
    const { name, isRequired, order } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can update pipeline stages'
      });
    }

    // Update pipeline stage
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (order !== undefined) updateData.order = order;

    await db.collection('pipelines').doc(pipelineId).collection('stages').doc(stageId).update(updateData);

    console.log(`🔧 Admin ${userId} updated pipeline stage ${stageId} in pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline stage updated successfully',
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error: any) {
    console.error('Error updating pipeline stage:', error);
    res.status(500).json({
      error: 'Failed to update pipeline stage',
      message: error.message
    });
  }
});

// Delete pipeline stage (admin only)
router.delete('/:pipelineId/stages/:stageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const stageId = req.params.stageId;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can delete pipeline stages'
      });
    }

    // Delete pipeline stage
    await db.collection('pipelines').doc(pipelineId).collection('stages').doc(stageId).delete();

    console.log(`🔧 Admin ${userId} deleted pipeline stage ${stageId} from pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: 'Pipeline stage deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting pipeline stage:', error);
    res.status(500).json({
      error: 'Failed to delete pipeline stage',
      message: error.message
    });
  }
});

// Add leads to pipeline as items (admin only)
router.post('/:pipelineId/leads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const { leadIds, stageId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Validate input
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Lead IDs array is required'
      });
    }

    if (!stageId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Stage ID is required'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can add leads to pipelines'
      });
    }

    // Check if stage exists in pipeline
    const stageDoc = await db.collection('pipelines').doc(pipelineId).collection('stages').doc(stageId).get();
    if (!stageDoc.exists) {
      return res.status(404).json({
        error: 'Stage not found in pipeline'
      });
    }

    console.log(`🔄 Adding ${leadIds.length} leads to pipeline ${pipelineId} stage ${stageId}`);

    // Add each lead as a pipeline item
    const addPromises = leadIds.map(async (leadId) => {
      // Check if lead exists
      const leadDoc = await db.collection('leads').doc(leadId).get();
      if (!leadDoc.exists) {
        throw new Error(`Lead ${leadId} not found`);
      }

      const leadData = leadDoc.data();
      
      // Create pipeline item - only store references, not duplicate data
      const itemData = {
        pipelineId: pipelineId,
        leadId: leadId,
        stageId: stageId,
        addedAt: new Date(),
        addedBy: userId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to pipeline items subcollection
      return await db.collection('pipelines').doc(pipelineId).collection('items').add(itemData);
    });

    const itemRefs = await Promise.all(addPromises);

    console.log(`✅ Successfully added ${leadIds.length} leads to pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: `Successfully added ${leadIds.length} leads to pipeline`,
      data: {
        pipelineId,
        stageId,
        addedCount: leadIds.length,
        itemIds: itemRefs.map(ref => ref.id)
      }
    });

  } catch (error: any) {
    console.error('Error adding leads to pipeline:', error);
    res.status(500).json({
      error: 'Failed to add leads to pipeline',
      message: error.message
    });
  }
});

// Remove leads from pipeline (admin only)
router.delete('/:pipelineId/leads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const { leadIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Validate input
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Lead IDs array is required'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can remove leads from pipelines'
      });
    }

    console.log(`🔄 Removing ${leadIds.length} leads from pipeline ${pipelineId}`);

    // Find and delete pipeline items for these leads
    const itemsSnapshot = await db.collection('pipelines').doc(pipelineId).collection('items').get();
    const itemsToDelete: string[] = [];

    itemsSnapshot.docs.forEach(doc => {
      const itemData = doc.data();
      if (leadIds.includes(itemData.leadId)) {
        itemsToDelete.push(doc.id);
      }
    });

    if (itemsToDelete.length === 0) {
      return res.status(404).json({
        error: 'No pipeline items found',
        message: 'No pipeline items found for the specified leads'
      });
    }

    // Delete the pipeline items
    const deletePromises = itemsToDelete.map(itemId => 
      db.collection('pipelines').doc(pipelineId).collection('items').doc(itemId).delete()
    );

    await Promise.all(deletePromises);

    console.log(`✅ Successfully removed ${itemsToDelete.length} pipeline items from pipeline ${pipelineId}`);

    res.json({
      success: true,
      message: `Successfully removed ${itemsToDelete.length} leads from pipeline`,
      data: {
        pipelineId,
        removedCount: itemsToDelete.length,
        removedItemIds: itemsToDelete
      }
    });

  } catch (error: any) {
    console.error('Error removing leads from pipeline:', error);
    res.status(500).json({
      error: 'Failed to remove leads from pipeline',
      message: error.message
    });
  }
});

// Get pipeline items (leads) for a specific pipeline (admin only)
router.get('/:pipelineId/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can view pipeline items'
      });
    }

    // Get pipeline items
    console.log(`🔍 Fetching pipeline items for pipeline: ${pipelineId}`);
    const itemsSnapshot = await db.collection('pipelines').doc(pipelineId).collection('items').get();
    console.log(`📊 Found ${itemsSnapshot.docs.length} pipeline items`);
    
    const items = itemsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      console.log(`🔍 Raw item data for ${doc.id}:`, data);
      console.log(`🔍 Raw data keys:`, Object.keys(data));
      console.log(`🔍 Raw data stageId:`, data.stageId);
      console.log(`🔍 Raw data leadId:`, data.leadId);
      
      // Only return reference data, not duplicate lead data
      const processedItem = {
        id: doc.id,
        pipelineId: data.pipelineId,
        leadId: data.leadId,
        stageId: data.stageId,
        addedAt: data.addedAt?.toDate?.() || data.addedAt,
        addedBy: data.addedBy,
        status: data.status,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      };
      console.log(`🔧 Processed item for ${doc.id}:`, processedItem);
      console.log(`🔧 Item stageId type: ${typeof processedItem.stageId}, value: "${processedItem.stageId}"`);
      return processedItem;
    });

    // Group items by stage
    const itemsByStage: {[stageId: string]: any[]} = {};
    const itemsToFix: any[] = [];
    
    items.forEach(item => {
      console.log(`📝 Processing item: ${item.id}, stageId: "${item.stageId}", leadId: "${item.leadId}"`);
      console.log(`📝 Item stageId check: ${item.stageId ? 'HAS stageId' : 'NO stageId'}`);
      console.log(`📝 Item leadId check: ${item.leadId ? 'HAS leadId' : 'NO leadId'}`);
      
      // Check if item has required fields
      if (!item.stageId) {
        console.warn(`⚠️ Item ${item.id} is missing stageId! Adding to fix list.`);
        itemsToFix.push(item);
        return;
      }
      if (!item.leadId) {
        console.warn(`⚠️ Item ${item.id} is missing leadId! Skipping.`);
        return;
      }
      
      console.log(`✅ Item ${item.id} has both stageId and leadId, adding to stage ${item.stageId}`);
      if (!itemsByStage[item.stageId]) {
        itemsByStage[item.stageId] = [];
        console.log(`📁 Created new stage array for ${item.stageId}`);
      }
      itemsByStage[item.stageId].push(item);
      console.log(`📁 Stage ${item.stageId} now has ${itemsByStage[item.stageId].length} items`);
    });

    // Fix items without stageId by assigning them to the first stage
    if (itemsToFix.length > 0) {
      console.log(`🔧 Fixing ${itemsToFix.length} items without stageId...`);
      
      // Get pipeline stages to find the first stage
      const stagesSnapshot = await db.collection('pipelines').doc(pipelineId).collection('stages').get();
      const stages = stagesSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      
      if (stages.length > 0) {
        const firstStage = stages[0];
        console.log(`📍 Assigning items to first stage: ${firstStage.id} (${firstStage.name})`);
        
        // Update items to have the first stage
        const updatePromises = itemsToFix.map(async (item) => {
          await db.collection('pipelines').doc(pipelineId).collection('items').doc(item.id).update({
            stageId: firstStage.id,
            stageName: firstStage.name,
            updatedAt: new Date()
          });
          
          // Add to itemsByStage
          if (!itemsByStage[firstStage.id]) {
            itemsByStage[firstStage.id] = [];
          }
          itemsByStage[firstStage.id].push({
            ...item,
            stageId: firstStage.id,
            stageName: firstStage.name
          });
        });
        
        await Promise.all(updatePromises);
        console.log(`✅ Fixed ${itemsToFix.length} items by assigning to stage ${firstStage.id}`);
      } else {
        console.warn(`⚠️ No stages found in pipeline ${pipelineId}, cannot fix items`);
      }
    }

    console.log(`✅ Fetched ${items.length} pipeline items for pipeline ${pipelineId}`);
    console.log(`📋 Items by stage:`, itemsByStage);
    console.log(`📤 Sending response with ${items.length} items:`);
    console.log(`📤 Items array:`, items);
    console.log(`📤 ItemsByStage:`, itemsByStage);

    res.json({
      success: true,
      items,
      itemsByStage,
      count: items.length
    });

  } catch (error: any) {
    console.error('Error fetching pipeline items:', error);
    res.status(500).json({
      error: 'Failed to fetch pipeline items',
      message: error.message
    });
  }
});

// Move pipeline item to different stage (admin only)
router.put('/:pipelineId/items/:itemId/move', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const pipelineId = req.params.pipelineId;
    const itemId = req.params.itemId;
    const { stageId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Validate input
    if (!stageId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Stage ID is required'
      });
    }

    // Check if pipeline exists first
    const pipelineDoc = await db.collection('pipelines').doc(pipelineId).get();
    if (!pipelineDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline not found'
      });
    }

    const pipelineData = pipelineDoc.data();

    // Check if user has admin privileges OR is assigned to this pipeline
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user is admin OR assigned to this pipeline
    const isAdmin = userData.authLevel === 1;
    const isAssignedToPipeline = pipelineData?.assignedRepId === userId;

    if (!isAdmin && !isAssignedToPipeline) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users or assigned pipeline users can move pipeline items'
      });
    }

    // Check if stage exists in pipeline
    console.log(`🔍 Checking if stage ${stageId} exists in pipeline ${pipelineId}`);
    const stageDoc = await db.collection('pipelines').doc(pipelineId).collection('stages').doc(stageId).get();
    console.log(`🔍 Stage document exists: ${stageDoc.exists}`);
    
    if (!stageDoc.exists) {
      console.log(`❌ Stage ${stageId} not found in pipeline ${pipelineId}`);
      return res.status(404).json({
        error: 'Stage not found in pipeline'
      });
    }
    
    console.log(`✅ Stage ${stageId} found in pipeline ${pipelineId}`);

    // Check if pipeline item exists
    const itemDoc = await db.collection('pipelines').doc(pipelineId).collection('items').doc(itemId).get();
    if (!itemDoc.exists) {
      return res.status(404).json({
        error: 'Pipeline item not found'
      });
    }

    const stageData = stageDoc.data();
    
    // Update the pipeline item
    await db.collection('pipelines').doc(pipelineId).collection('items').doc(itemId).update({
      stageId: stageId,
      stageName: stageData?.name || 'Unknown Stage',
      updatedAt: new Date()
    });

    console.log(`✅ Moved pipeline item ${itemId} to stage ${stageId}`);

    res.json({
      success: true,
      message: 'Pipeline item moved successfully',
      data: {
        itemId,
        stageId,
        stageName: stageData?.name || 'Unknown Stage'
      }
    });

  } catch (error: any) {
    console.error('Error moving pipeline item:', error);
    res.status(500).json({
      error: 'Failed to move pipeline item',
      message: error.message
    });
  }
});

export default router;
