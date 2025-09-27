import express from 'express';
import axios from 'axios';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// JustCall API configuration
const JUSTCALL_API_URL = 'https://api.justcall.io/v2.1';
const JUSTCALL_API_KEY = process.env.JUSTCALL_API_KEY;
const JUSTCALL_API_SECRET = process.env.JUSTCALL_API_SECRET;

if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
  console.warn('JUSTCALL_API_KEY or JUSTCALL_API_SECRET is not set. SMS functionality will not work.');
}

// Validation schema for SMS
const sendSmsSchema = Joi.object({
  contact_number: Joi.string().required(), // E.164 format (+141555XXXXX)
  body: Joi.string().required().max(1600), // SMS character limit
  justcall_number: Joi.string().optional(), // E.164 format (+141555XXXXX)
  media_url: Joi.string().optional(), // Comma-separated URLs for media
  restrict_once: Joi.string().valid('Yes', 'No').optional().default('No'),
  schedule_at: Joi.string().optional(), // YYYY-MM-DD HH:mm:ss format
  templateData: Joi.object().optional() // For dynamic template replacement
});

// Template processing function
const processTemplate = (template: string, data: any): string => {
  let processedTemplate = template;
  
  // Replace common placeholders
  const placeholders = {
    '[price]': data.price || '[price]',
    '[Price]': data.price || '[Price]',
    '[customer_name]': data.customer_name || '[customer_name]',
    '[product_name]': data.product_name || '[product_name]',
    '[company_name]': data.company_name || '[company_name]',
    '[Company]': data.company_name || '[Company]',
    '[orgnr]': data.orgnr || '[orgnr]',
    '[Orgnr]': data.orgnr || '[Orgnr]',
    '[terms]': data.terms || '[terms]',
    '[Terms]': data.terms || '[Terms]',
    '[date]': data.date || new Date().toLocaleDateString(),
    '[phone]': data.phone || '[phone]',
    '[email]': data.email || '[email]'
  };

  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  return processedTemplate;
};

interface SmsResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  status?: string;
  firestoreId?: string;
}

// Send SMS through JustCall
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { error, value } = sendSmsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        error: 'JustCall API credentials not configured' 
      });
    }

    const { contact_number, body, justcall_number, media_url, restrict_once, schedule_at, templateData } = value;
    const userId = req.user?.uid;
    
    console.log('SMS Send Request:', {
      userId: userId,
      contactNumber: contact_number,
      hasTemplateData: !!templateData,
      templateDataKeys: templateData ? Object.keys(templateData) : []
    });
    
    // Process template if templateData is provided
    const processedMessage = templateData ? processTemplate(body, templateData) : body;
    
    console.log('Processed message:', processedMessage.substring(0, 100) + '...');

    // Get user's configured sender number
    let senderNumber = justcall_number;
    if (!senderNumber) {
      try {
        // Get global SMS settings (one number for all users)
        const smsSettingsDoc = await db.collection('smsSettings').doc('global').get();
        if (smsSettingsDoc.exists) {
          const smsSettings = smsSettingsDoc.data();
          senderNumber = smsSettings?.senderNumber;
        }
      } catch (error) {
        console.error('Error fetching global SMS settings:', error);
      }
    }

    // Validate that we have a sender number
    if (!senderNumber) {
      return res.status(400).json({
        error: 'Sender number is required',
        message: 'Please configure a sender number in settings or provide justcall_number'
      });
    }

    // Prepare SMS payload for JustCall API v2.1
    const smsPayload: any = {
      justcall_number: senderNumber,
      body: processedMessage,
      contact_number: contact_number,
      restrict_once: restrict_once || 'No'
    };

    // Add optional parameters if provided
    if (media_url) {
      smsPayload.media_url = media_url;
    }
    if (schedule_at) {
      smsPayload.schedule_at = schedule_at;
    }

    console.log('Sending SMS via JustCall API v2.1:', {
      endpoint: `${JUSTCALL_API_URL}/texts/new`,
      payload: { ...smsPayload, body: processedMessage.substring(0, 100) + '...' } // Log truncated message
    });

    // Send SMS via JustCall API v2.1
    const response = await axios.post(`${JUSTCALL_API_URL}/texts/new`, smsPayload, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('JustCall API response:', response.data);
    console.log('JustCall API response structure:', {
      hasId: !!response.data.id,
      hasData: !!response.data.data,
      hasStatus: !!response.data.status,
      responseKeys: Object.keys(response.data)
    });

    // Check if SMS was sent successfully - handle different response formats
    let messageId = response.data.id;
    let deliveryStatus = response.data.delivery_status || response.data.status;
    
    // Handle case where message ID might be in data array
    if (!messageId && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      messageId = response.data.data[0].id;
      deliveryStatus = response.data.data[0].delivery_status || response.data.data[0].status;
      console.log('Found message ID in data array:', messageId);
    }

    if (!messageId) {
      console.error('❌ JustCall API did not return a message ID:', response.data);
      return res.status(500).json({
        error: 'Failed to send SMS',
        message: 'JustCall API did not return a message ID',
        details: response.data
      });
    }

    const smsResponse: SmsResponse = {
      success: true,
      message_id: messageId?.toString(),
      status: deliveryStatus || 'sent'
    };

    // Store SMS record in Firestore
    try {
      console.log('Attempting to save SMS record to Firestore...');
      
      console.log('📱 SMS Record Data:');
      console.log(`  - contact_number: "${contact_number}"`);
      console.log(`  - senderNumber: "${senderNumber}"`);
      console.log(`  - messageId: "${messageId}"`);
      
      const smsRecord = {
        // Basic SMS data
        messageId: messageId?.toString(),
        contactNumber: contact_number,
        senderNumber: senderNumber,
        originalMessage: body,
        processedMessage: processedMessage,
        status: deliveryStatus || 'sent',
        
        // Template data (if used)
        templateData: templateData || null,
        
        // Lead data (if available)
        leadId: templateData?.leadId || null,
        customerName: templateData?.customer_name || templateData?.Customer || null,
        companyName: templateData?.company_name || templateData?.Company || null,
        organizationNumber: templateData?.orgnr || templateData?.Orgnr || null,
        
        // Product data (if available)
        productName: templateData?.product_name || null,
        price: templateData?.price || templateData?.Price || null,
        
        // Terms data (if available)
        termsUrl: templateData?.terms || templateData?.Terms || null,
        
        // JustCall response data
        justcallResponse: response.data,
        
        // Contract status
        contractConfirmed: false, // Default to not confirmed
        contractConfirmedAt: null,
        
        // Metadata
        userId: userId,
        sentAt: new Date(),
        createdAt: new Date(),
        
        // Optional parameters
        mediaUrl: media_url || null,
        restrictOnce: restrict_once || 'No',
        scheduleAt: schedule_at || null
      };

      console.log('SMS record data prepared:', {
        messageId: smsRecord.messageId,
        userId: smsRecord.userId,
        contactNumber: smsRecord.contactNumber,
        hasTemplateData: !!smsRecord.templateData
      });

      // Save to Firestore
      const smsDocRef = await db.collection('smsRecords').add(smsRecord);
      console.log('✅ SMS record saved to Firestore with ID:', smsDocRef.id);
      
      // Add the Firestore document ID to the response
      smsResponse.firestoreId = smsDocRef.id;
      
    } catch (firestoreError: any) {
      console.error('❌ Error saving SMS record to Firestore:', firestoreError);
      console.error('Firestore error details:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      // Don't fail the SMS send if Firestore save fails
    }

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        ...smsResponse,
        justcall_response: response.data
      }
    });

  } catch (error: any) {
    console.error('JustCall SMS API error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          'Failed to send SMS';
      
      console.error('JustCall API error response:', error.response.data);
      
      return res.status(error.response.status).json({
        error: 'JustCall API error',
        message: errorMessage,
        details: error.response.data
      });
    }

    res.status(500).json({
      error: 'Failed to send SMS',
      message: error.message
    });
  }
});

// Get SMS status
router.get('/status/:messageId', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        error: 'JustCall API credentials not configured' 
      });
    }

    const { messageId } = req.params;

    const response = await axios.get(`${JUSTCALL_API_URL}/sms/${messageId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`).toString('base64')}`
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error: any) {
    console.error('JustCall SMS status error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to get SMS status'
      });
    }

    res.status(500).json({
      error: 'Failed to get SMS status',
      message: error.message
    });
  }
});

// Get SMS history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        error: 'JustCall API credentials not configured' 
      });
    }

    const { 
      limit = 50, 
      offset = 0,
      start_date,
      end_date,
      to,
      from
    } = req.query;

    const params: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;
    if (to) params.to = to;
    if (from) params.from = from;

    const response = await axios.get(`${JUSTCALL_API_URL}/sms`, {
      params,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`).toString('base64')}`
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data.data || response.data,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error: any) {
    console.error('JustCall SMS history error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to get SMS history'
      });
    }

    res.status(500).json({
      error: 'Failed to get SMS history',
      message: error.message
    });
  }
});

// Update contract confirmation status
router.patch('/confirm/:firestoreId', authenticateToken, async (req, res) => {
  try {
    const { firestoreId } = req.params;
    const userId = req.user?.uid;

    if (!firestoreId) {
      return res.status(400).json({
        error: 'Firestore ID is required',
        message: 'Please provide the SMS record ID'
      });
    }

    // Get the SMS record
    const smsDoc = await db.collection('smsRecords').doc(firestoreId).get();
    
    if (!smsDoc.exists) {
      return res.status(404).json({
        error: 'SMS record not found',
        message: 'The specified SMS record does not exist'
      });
    }

    const smsData = smsDoc.data();
    
    // Check if user owns this SMS record
    if (smsData?.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own SMS records'
      });
    }

    // Update contract confirmation status
    await db.collection('smsRecords').doc(firestoreId).update({
      contractConfirmed: true,
      contractConfirmedAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Contract confirmed for SMS record: ${firestoreId}`);

    res.json({
      success: true,
      message: 'Contract confirmation status updated',
      data: {
        firestoreId: firestoreId,
        contractConfirmed: true,
        contractConfirmedAt: new Date()
      }
    });

  } catch (error: any) {
    console.error('Error updating contract confirmation:', error);
    res.status(500).json({
      error: 'Failed to update contract confirmation',
      message: error.message
    });
  }
});

// Debug endpoint to see all SMS records (for debugging)
router.get('/debug-records', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('smsRecords')
      .orderBy('sentAt', 'desc')
      .limit(10)
      .get();

    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      contactNumber: doc.data().contactNumber,
      sentAt: doc.data().sentAt?.toDate?.() || doc.data().sentAt,
      contractConfirmed: doc.data().contractConfirmed || false
    }));

    res.json({
      success: true,
      data: records,
      total: records.length
    });

  } catch (error: any) {
    console.error('Error fetching debug records:', error);
    res.status(500).json({
      error: 'Failed to fetch debug records',
      message: error.message
    });
  }
});

// Get all SMS records (admin only)
router.get('/records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user is admin (authLevel 1)
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    if (userData?.authLevel !== 1) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Only administrators can view SMS records'
      });
    }

    // Get all SMS records
    const smsRecordsSnapshot = await db.collection('smsRecords')
      .orderBy('sentAt', 'desc')
      .limit(1000) // Limit to prevent large responses
      .get();

    const records = [];
    
    for (const doc of smsRecordsSnapshot.docs) {
      const recordData = doc.data();
      
      // Get user email for each record
      let userEmail = 'Unknown User';
      try {
        const userDoc = await db.collection('users').doc(recordData.userId).get();
        if (userDoc.exists) {
          userEmail = userDoc.data()?.email || 'Unknown User';
        }
      } catch (error) {
        console.log(`Could not fetch user email for ${recordData.userId}:`, error);
      }

      records.push({
        id: doc.id,
        messageId: recordData.messageId,
        contactNumber: recordData.contactNumber,
        senderNumber: recordData.senderNumber,
        originalMessage: recordData.originalMessage,
        processedMessage: recordData.processedMessage,
        status: recordData.status,
        contractConfirmed: recordData.contractConfirmed || false,
        contractConfirmedAt: recordData.contractConfirmedAt,
        customerName: recordData.customerName,
        companyName: recordData.companyName,
        organizationNumber: recordData.organizationNumber,
        productName: recordData.productName,
        price: recordData.price,
        userId: recordData.userId,
        userEmail: userEmail,
        sentAt: recordData.sentAt?.toDate?.() || recordData.sentAt,
        createdAt: recordData.createdAt?.toDate?.() || recordData.createdAt
      });
    }

    res.json({
      success: true,
      data: records,
      total: records.length
    });

  } catch (error: any) {
    console.error('Error fetching SMS records:', error);
    res.status(500).json({
      error: 'Failed to fetch SMS records',
      message: error.message
    });
  }
});

export default router;
