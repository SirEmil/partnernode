import express, { Request } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all leads (admin only)
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
        message: 'Only admin users can view leads'
      });
    }

    // Get all leads from Firestore
    const leadsSnapshot = await db.collection('leads').get();
    
    const leads = leadsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      // Ensure the document ID takes precedence over any id field in the data
      const { id: dataId, ...restData } = data;
      return {
        id: doc.id, // Always use the Firestore document ID
        ...restData,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        importedAt: data.importedAt?.toDate?.() || data.importedAt,
        lastActivityAt: data.lastActivityAt?.toDate?.() || data.lastActivityAt
      };
    });

    // Sort by creation date (newest first)
    leads.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    res.json({
      success: true,
      leads,
      count: leads.length
    });

  } catch (error: any) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      error: 'Failed to fetch leads',
      message: error.message
    });
  }
});

// Get lead by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const leadId = req.params.id;

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
        message: 'Only admin users can view lead details'
      });
    }

    const leadDoc = await db.collection('leads').doc(leadId).get();
    
    if (!leadDoc.exists) {
      return res.status(404).json({
        error: 'Lead not found'
      });
    }

    const leadData = leadDoc.data();
    const lead = {
      id: leadDoc.id,
      ...leadData,
      createdAt: leadData?.createdAt?.toDate?.() || leadData?.createdAt,
      updatedAt: leadData?.updatedAt?.toDate?.() || leadData?.updatedAt
    };

    res.json({
      success: true,
      lead
    });

  } catch (error: any) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      error: 'Failed to fetch lead',
      message: error.message
    });
  }
});

// Import leads from CSV (admin only)
router.post('/import', authenticateToken, upload.single('file'), async (req: MulterRequest, res) => {
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
        message: 'Only admin users can import leads'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get field mapping from request
    const fieldMapping = req.body.fieldMapping ? JSON.parse(req.body.fieldMapping) : {};

    const leads: any[] = [];
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          // Clean and validate the data
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            const cleanValue = row[key]?.trim();
            if (cleanValue && cleanValue !== '') {
              // Use field mapping if available, otherwise use original key
              const mappedKey = fieldMapping[cleanKey] || cleanKey;
              
              // Skip fields that are mapped to empty string (user selected "Skip this field")
              if (mappedKey !== '') {
                cleanRow[mappedKey] = cleanValue;
              }
            }
          });
          
          if (Object.keys(cleanRow).length > 0) {
            leads.push({
              ...cleanRow,
              // Essential metadata fields
              id: '', // Will be set by Firestore when document is created
              createdAt: new Date(),
              updatedAt: new Date(),
              importedBy: userId,
              importedAt: new Date(),
              // Additional essential fields
              status: cleanRow.status || 'new',
              source: 'csv_import',
              lastActivityAt: new Date(),
              // Ensure we have basic contact info fields
              email: cleanRow.email || '',
              phone: cleanRow.phone || '',
              name: cleanRow.name || cleanRow.fullName || cleanRow.customerName || '',
              companyName: cleanRow.companyName || cleanRow.company || cleanRow.organization || '',
              // Pipeline tracking field
              active_in_pipeline: ''
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (leads.length === 0) {
      return res.status(400).json({ error: 'No valid leads found in CSV file' });
    }

    // Batch write to Firestore
    const batch = db.batch();
    leads.forEach(lead => {
      const docRef = db.collection('leads').doc();
      // Set the document ID in the lead data
      lead.id = docRef.id;
      batch.set(docRef, lead);
    });

    await batch.commit();

    res.json({ 
      success: true, 
      count: leads.length,
      message: `Successfully imported ${leads.length} leads`
    });

  } catch (error: any) {
    console.error('Error importing leads:', error);
    res.status(500).json({ error: 'Failed to import leads', message: error.message });
  }
});

// Migrate existing leads to add active_in_pipeline field (admin only)
router.post('/migrate', authenticateToken, async (req, res) => {
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
        message: 'Only admin users can migrate leads'
      });
    }

    // Get all leads that don't have active_in_pipeline field
    const leadsSnapshot = await db.collection('leads').get();
    const leadsToUpdate = leadsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.active_in_pipeline === undefined;
    });

    if (leadsToUpdate.length === 0) {
      return res.json({
        success: true,
        message: 'All leads already have active_in_pipeline field',
        updated: 0
      });
    }

    // Batch update leads
    const batch = db.batch();
    leadsToUpdate.forEach(doc => {
      batch.update(doc.ref, { active_in_pipeline: '' });
    });

    await batch.commit();

    res.json({
      success: true,
      message: `Successfully migrated ${leadsToUpdate.length} leads`,
      updated: leadsToUpdate.length
    });

  } catch (error: any) {
    console.error('Error migrating leads:', error);
    res.status(500).json({ error: 'Failed to migrate leads', message: error.message });
  }
});

// Export leads to CSV (admin only)
router.get('/export', authenticateToken, async (req, res) => {
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
        message: 'Only admin users can export leads'
      });
    }

    const leadsSnapshot = await db.collection('leads').get();
    const leads = leadsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any));

    if (leads.length === 0) {
      return res.status(404).json({ error: 'No leads found to export' });
    }

    // Convert to CSV
    const headers = Object.keys(leads[0]);
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => 
        headers.map(header => {
          const value = lead[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error: any) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ error: 'Failed to export leads', message: error.message });
  }
});

// Bulk fetch leads by IDs
router.post('/bulk-fetch', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { leadIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        error: 'leadIds array is required'
      });
    }

    console.log(`🔍 Bulk fetching ${leadIds.length} leads for user ${userId}`);

    const leads = [];
    const notFoundIds = [];

    for (const leadId of leadIds) {
      try {
        const leadDoc = await db.collection('leads').doc(leadId).get();
        
        if (leadDoc.exists) {
          const leadData = leadDoc.data();
          const { id, ...data } = leadData || {}; // Destructure to prevent id override
          leads.push({
            id: leadDoc.id, // Use Firestore document ID
            ...data
          });
        } else {
          notFoundIds.push(leadId);
        }
      } catch (error) {
        console.error(`Error fetching lead ${leadId}:`, error);
        notFoundIds.push(leadId);
      }
    }

    console.log(`✅ Successfully fetched ${leads.length} leads`);
    if (notFoundIds.length > 0) {
      console.log(`⚠️ ${notFoundIds.length} leads not found:`, notFoundIds);
    }

    res.json({
      success: true,
      leads,
      count: leads.length,
      notFoundIds
    });

  } catch (error) {
    console.error('Error bulk fetching leads:', error);
    res.status(500).json({
      error: 'Failed to bulk fetch leads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk update leads
router.put('/bulk-update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { leadIds, updates } = req.body;

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
        message: 'Only admin users can bulk update leads'
      });
    }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lead IDs array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    console.log('🔄 Bulk updating leads:', leadIds, 'with updates:', updates);

    // First, check if all leads exist
    const leadCheckPromises = leadIds.map(async (leadId) => {
      const leadDoc = await db.collection('leads').doc(leadId).get();
      return { leadId, exists: leadDoc.exists };
    });

    const leadChecks = await Promise.all(leadCheckPromises);
    const nonExistentLeads = leadChecks.filter(check => !check.exists);
    
    if (nonExistentLeads.length > 0) {
      console.error('❌ Some leads not found:', nonExistentLeads);
      return res.status(404).json({
        success: false,
        message: `Some leads not found: ${nonExistentLeads.map(l => l.leadId).join(', ')}`,
        notFound: nonExistentLeads.map(l => l.leadId)
      });
    }

    // Prepare update data with timestamp
    const updatePayload = {
      ...updates,
      updatedAt: new Date()
    };

    // Update all leads in parallel
    const updatePromises = leadIds.map(leadId => 
      db.collection('leads').doc(leadId).update(updatePayload)
    );

    await Promise.all(updatePromises);

    console.log('✅ Bulk update completed successfully');

    res.json({
      success: true,
      message: `Successfully updated ${leadIds.length} leads`,
      data: {
        updatedCount: leadIds.length,
        updates: updatePayload
      }
    });

  } catch (error: any) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update leads',
      error: error.message
    });
  }
});

// Update a lead
router.put('/:leadId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { leadId } = req.params;
    const updateData = req.body;

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
        message: 'Only admin users can update leads'
      });
    }

    console.log('🔄 Updating lead in collection:', leadId, 'with data:', updateData);

    // Get the lead document
    const leadDoc = await db.collection('leads').doc(leadId).get();
    
    if (!leadDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Prepare update data (exclude id and other system fields)
    const { id, createdAt, ...allowedUpdates } = updateData;
    
    // Add updated timestamp
    const updatePayload = {
      ...allowedUpdates,
      updatedAt: new Date()
    };

    // Update the lead
    await db.collection('leads').doc(leadId).update(updatePayload);

    console.log('✅ Lead updated successfully in collection');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: {
        id: leadId,
        ...updatePayload
      }
    });

  } catch (error: any) {
    console.error('Lead update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
});

// Convert lead to customer
router.post('/:id/convert-to-customer', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const leadId = req.params.id;
    const { smsRecordId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    console.log(`🔄 Converting lead ${leadId} to customer with SMS record: ${smsRecordId}`);

    // Get the converting user's assigned database
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const assignedDatabase = userData?.database;

    if (!assignedDatabase) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to a sales database. Please contact your administrator.'
      });
    }

    console.log(`📊 User's assigned database: ${assignedDatabase}`);

    // Get the lead
    const leadDoc = await db.collection('leads').doc(leadId).get();

    if (!leadDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const leadData = leadDoc.data();
    
    // Get existing conversion SMS IDs (if any)
    const existingConversionSmsIds = leadData?.conversionSmsIds || [];

    // Prepare update payload
    const updatePayload: any = {
      status: 'customer',
      convertedToCustomerAt: new Date(),
      convertedBy: userId,
      updatedAt: new Date()
    };

    // Add SMS record ID to conversion array if provided
    if (smsRecordId && !existingConversionSmsIds.includes(smsRecordId)) {
      updatePayload.conversionSmsIds = [...existingConversionSmsIds, smsRecordId];
      console.log(`📧 Adding SMS record ${smsRecordId} to conversion history`);
    }

    // Update lead status to indicate it's now a customer
    await db.collection('leads').doc(leadId).update(updatePayload);

    // Add lightweight entry to the user's assigned sales database
    const databaseEntry = {
      leadId: leadId,
      addedAt: new Date(),
      lastChanged: new Date(),
      addedBy: userId,
      status: 'active'
    };

    // Store in the database's entries subcollection
    await db.collection(assignedDatabase).doc('entries').collection('entries').doc(leadId).set(databaseEntry);
    
    console.log(`✅ Lead entry added to database: ${assignedDatabase}/entries/${leadId}`);
    console.log('✅ Lead converted to customer successfully');
    console.log(`📊 Total conversion SMS records: ${updatePayload.conversionSmsIds?.length || existingConversionSmsIds.length}`);

    res.json({
      success: true,
      message: 'Lead converted to customer successfully',
      leadId: leadId,
      database: assignedDatabase,
      conversionSmsIds: updatePayload.conversionSmsIds || existingConversionSmsIds
    });

  } catch (error: any) {
    console.error('Error converting lead to customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert lead to customer',
      error: error.message
    });
  }
});

export default router;
