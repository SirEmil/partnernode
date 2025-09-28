import express from 'express';
import Joi from 'joi';
import { db } from '../config/firebase';

const router = express.Router();

// JustCall webhook payload schema (actual format)
const webhookSchema = Joi.object({
  request_id: Joi.string().required(),
  webhook_url: Joi.string().required(),
  url_id: Joi.string().required(),
  type: Joi.string().required(),
  data: Joi.object({
    id: Joi.number().required(),
    contact_number: Joi.string().required(),
    contact_name: Joi.string().allow('').optional(),
    contact_email: Joi.string().allow('').optional(),
    justcall_number: Joi.string().required(),
    justcall_line_name: Joi.string().allow('').optional(),
    agent_id: Joi.number().optional(),
    agent_name: Joi.string().allow('').optional(),
    agent_email: Joi.string().allow('').optional(),
    sms_date: Joi.string().required(),
    sms_user_date: Joi.string().required(),
    sms_time: Joi.string().required(),
    sms_user_time: Joi.string().required(),
    direction: Joi.string().required(),
    cost_incurred: Joi.number().optional(),
    sms_info: Joi.object({
      body: Joi.string().required(),
      is_mms: Joi.string().allow('').optional(),
      mms: Joi.array().optional()
    }).required(),
    delivery_status: Joi.string().required(),
    is_deleted: Joi.boolean().optional(),
    medium: Joi.string().allow('').optional()
  }).required()
});

// Function to normalize OK responses
const normalizeOkResponse = (text: string): boolean => {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  // Various OK response patterns
  const okPatterns = [
    'ok',
    'ok.',
    'ok!',
    'okay',
    'okay.',
    'okay!',
    'yes',
    'yes.',
    'yes!',
    'ja',
    'ja.',
    'ja!',
    'jaja',
    'jaja.',
    'jaja!',
    'accept',
    'accept.',
    'accept!',
    'confirmed',
    'confirmed.',
    'confirmed!',
    'confirm',
    'confirm.',
    'confirm!'
  ];
  
  const isMatch = okPatterns.includes(normalizedText);
  console.log(`🔍 OK Pattern Check:`);
  console.log(`  - Input: "${text}"`);
  console.log(`  - Normalized: "${normalizedText}"`);
  console.log(`  - Patterns: ${okPatterns.slice(0, 5).join(', ')}...`);
  console.log(`  - Match found: ${isMatch}`);
  
  return isMatch;
};

// Function to find the original SMS by contact number and recent timestamp
const findOriginalSMS = async (contactNumber: string, responseTime: Date) => {
  try {
    console.log(`🔍 Looking for SMS with contact number: "${contactNumber}"`);
    const startTime = Date.now();
    
    // Calculate time window (look for SMS sent within last 24 hours)
    const timeWindow = new Date(responseTime.getTime() - (24 * 60 * 60 * 1000));
    
    // Try multiple phone number formats
    const phoneFormats = [
      `+${contactNumber}`,           // +4741275958
      contactNumber,                 // 4741275958
      contactNumber.replace(/^47/, '+47'), // Convert 47 to +47
      contactNumber.replace(/^\+47/, '47'), // Convert +47 to 47
    ];
    
    // Remove duplicates
    const uniqueFormats = [...new Set(phoneFormats)];
    
    console.log(`🔍 Searching for phone number "${contactNumber}" in formats:`, uniqueFormats);
    console.log(`🕐 Time window: ${timeWindow.toISOString()} to ${responseTime.toISOString()}`);
    
    // Run queries for all formats in parallel
    const queries = await Promise.all(
      uniqueFormats.map(format => 
        db.collection('smsRecords')
          .where('contactNumber', '==', format)
          .where('sentAt', '>=', timeWindow)
          .orderBy('sentAt', 'desc')
          .limit(10)
          .get()
      )
    );
    
    // Combine all results
    const allSMS = queries.flatMap(query => query.docs);
    
    console.log(`📊 Found ${allSMS.length} total SMS records across all formats`);
    
    if (allSMS.length === 0) {
      console.log(`❌ No SMS found for contact ${contactNumber} in the last 24 hours`);
      console.log(`🔄 Trying broader search without time window...`);
      
      // Fallback: Search without time window
      const fallbackQueries = await Promise.all(
        uniqueFormats.map(format => 
          db.collection('smsRecords')
            .where('contactNumber', '==', format)
            .orderBy('sentAt', 'desc')
            .limit(5)
            .get()
        )
      );
      
      const fallbackSMS = fallbackQueries.flatMap(query => query.docs);
      console.log(`📊 Fallback search found ${fallbackSMS.length} SMS records`);
      
      if (fallbackSMS.length === 0) {
        console.log(`❌ No SMS found for contact ${contactNumber} in entire database`);
        return null;
      }
      
      // Use fallback results
      const smsData = fallbackSMS.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          contactNumber: data.contactNumber,
          sentAt: data.sentAt,
          contractConfirmed: data.contractConfirmed,
          ...data
        };
      });
      
      smsData.sort((a, b) => {
        let aTime: Date;
        let bTime: Date;
        
        if (a.sentAt && typeof a.sentAt.toDate === 'function') {
          aTime = a.sentAt.toDate();
        } else if (a.sentAt instanceof Date) {
          aTime = a.sentAt;
        } else {
          aTime = new Date(a.sentAt || 0);
        }
        
        if (b.sentAt && typeof b.sentAt.toDate === 'function') {
          bTime = b.sentAt.toDate();
        } else if (b.sentAt instanceof Date) {
          bTime = b.sentAt;
        } else {
          bTime = new Date(b.sentAt || 0);
        }
        
        return bTime.getTime() - aTime.getTime();
      });
      
      const mostRecentSMS = smsData[0];
      const queryTime = Date.now() - startTime;
      
      console.log(`✅ Found most recent SMS (fallback): ${mostRecentSMS.id} (query took ${queryTime}ms)`);
      console.log(`📱 SMS details:`, {
        contactNumber: mostRecentSMS.contactNumber,
        sentAt: mostRecentSMS.sentAt,
        contractConfirmed: mostRecentSMS.contractConfirmed,
        totalSMSFound: smsData.length,
        queryTimeMs: queryTime
      });
      
      return mostRecentSMS;
    }
    
    // Convert all documents to objects and get the most recent
    const smsData = allSMS.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        contactNumber: data.contactNumber,
        sentAt: data.sentAt,
        contractConfirmed: data.contractConfirmed,
        ...data
      };
    });
    
    // Sort by sentAt timestamp (most recent first) - handle Firebase timestamps
    smsData.sort((a, b) => {
      let aTime: Date;
      let bTime: Date;
      
      // Handle Firebase Timestamp objects
      if (a.sentAt && typeof a.sentAt.toDate === 'function') {
        aTime = a.sentAt.toDate();
      } else if (a.sentAt instanceof Date) {
        aTime = a.sentAt;
      } else {
        aTime = new Date(a.sentAt || 0);
      }
      
      if (b.sentAt && typeof b.sentAt.toDate === 'function') {
        bTime = b.sentAt.toDate();
      } else if (b.sentAt instanceof Date) {
        bTime = b.sentAt;
      } else {
        bTime = new Date(b.sentAt || 0);
      }
      
      return bTime.getTime() - aTime.getTime();
    });
    
    const mostRecentSMS = smsData[0];
    const queryTime = Date.now() - startTime;
    
    console.log(`✅ Found most recent SMS: ${mostRecentSMS.id} (query took ${queryTime}ms)`);
    console.log(`📱 SMS details:`, {
      contactNumber: mostRecentSMS.contactNumber,
      sentAt: mostRecentSMS.sentAt,
      contractConfirmed: mostRecentSMS.contractConfirmed,
      totalSMSFound: smsData.length,
      queryTimeMs: queryTime
    });
    
    return mostRecentSMS;
    
  } catch (error) {
    console.error('Error finding original SMS:', error);
    return null;
  }
};

// Webhook endpoint for JustCall SMS responses
router.post('/justcall-sms', async (req, res) => {
  try {
    console.log('JustCall webhook received:', JSON.stringify(req.body, null, 2));
    
    // Handle JustCall webhook validation payload
    if (req.body.type && req.body.webhook_url && !req.body.data) {
      console.log('JustCall validation payload received');
      return res.status(200).json({ 
        status: 'OK', 
        message: 'Webhook validation successful',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 Webhook validation starting...');
    console.log('🔍 Request body keys:', Object.keys(req.body));
    console.log('🔍 Has data field:', !!req.body.data);
    
    // Validate the webhook payload
    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      console.error('❌ Webhook validation error:', error.details[0].message);
      console.error('❌ Full validation error:', error);
      return res.status(400).json({ 
        error: 'Invalid webhook payload',
        details: error.details[0].message,
        received_data: req.body,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Webhook validation passed');
    
    const { 
      request_id,
      webhook_url,
      url_id,
      type,
      data 
    } = value;
    
    // Extract SMS data
    const {
      id: smsId,
      contact_number,
      contact_name,
      justcall_number,
      direction,
      sms_info,
      delivery_status,
      sms_date,
      sms_time
    } = data;
    
    const body = sms_info.body;
    
    console.log(`📱 SMS Data extracted:`);
    console.log(`  - SMS ID: ${smsId}`);
    console.log(`  - Contact: ${contact_number}`);
    console.log(`  - Direction: ${direction}`);
    console.log(`  - Body: "${body}"`);
    console.log(`  - Date: ${sms_date} ${sms_time}`);
    
    // Only process inbound messages (responses from customers)
    if (direction !== 'Incoming') {
      console.log('Ignoring outbound message');
      return res.status(200).json({ 
        message: 'Outbound message ignored',
        direction: direction,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if this is an OK response
    const isOkResponse = normalizeOkResponse(body);
    
    console.log(`🔍 OK Detection Debug:`);
    console.log(`  - Original body: "${body}"`);
    console.log(`  - Normalized: "${body.toLowerCase().trim()}"`);
    console.log(`  - Is OK response: ${isOkResponse}`);
    
    if (isOkResponse) {
      console.log(`✅ OK response detected from ${contact_number}: "${body}"`);
      const webhookStartTime = Date.now();
      
      // Create response time from date and time
      const responseTime = new Date(`${sms_date}T${sms_time}`);
      console.log(`🕐 Response time: ${responseTime.toISOString()}`);
      
      const originalSMS = await findOriginalSMS(contact_number, responseTime);
      
      if (originalSMS) {
        console.log(`✅ Found original SMS: ${originalSMS.id}`);
        
        try {
          const dbUpdateStartTime = Date.now();
          // Update the SMS record to mark contract as confirmed
          await db.collection('smsRecords').doc(originalSMS.id).update({
            contractConfirmed: true,
            contractConfirmedAt: responseTime,
            contractResponse: body,
            contractResponseId: smsId.toString(),
            contractResponseRequestId: request_id,
            updatedAt: new Date()
          });
          
          const dbUpdateTime = Date.now() - dbUpdateStartTime;
          console.log(`💾 Database update completed in ${dbUpdateTime}ms`);

          // Send real-time update to clients viewing this SMS
          const sseStartTime = Date.now();
          const { sendSSEUpdate } = require('../index');
          if (sendSSEUpdate) {
            sendSSEUpdate(originalSMS.id, {
              type: 'contract_confirmed',
              smsId: originalSMS.id,
              contactNumber: contact_number,
              confirmedAt: responseTime,
              response: body
            });
            const sseTime = Date.now() - sseStartTime;
            console.log(`📡 SSE update sent in ${sseTime}ms for SMS: ${originalSMS.id}`);
          }
          
          const totalWebhookTime = Date.now() - webhookStartTime;
          console.log(`✅ Contract confirmed for SMS ${originalSMS.id} - Total processing time: ${totalWebhookTime}ms`);
          
          // Optional: Send confirmation to admin or log to a separate collection
          await db.collection('contractConfirmations').add({
            smsRecordId: originalSMS.id,
            contactNumber: contact_number,
            contactName: contact_name,
            responseMessage: body,
            responseId: smsId.toString(),
            responseRequestId: request_id,
            confirmedAt: responseTime,
            createdAt: new Date()
          });
          
          return res.status(200).json({ 
            message: 'Contract confirmed successfully',
            smsId: originalSMS.id,
            confirmed: true,
            timestamp: new Date().toISOString()
          });
          
        } catch (dbError: any) {
          console.error('❌ Database update error:', dbError);
          return res.status(500).json({
            error: 'Failed to update SMS record',
            message: dbError.message,
            smsId: originalSMS.id,
            timestamp: new Date().toISOString()
          });
        }
        
      } else {
        console.log(`❌ No original SMS found for OK response from ${contact_number}`);
        return res.status(404).json({ 
          message: 'OK response received but no original SMS found',
          contactNumber: contact_number,
          confirmed: false,
          timestamp: new Date().toISOString()
        });
      }
      
    } else {
      console.log(`ℹ️ Non-OK response from ${contact_number}: "${body}"`);
      
      // Still try to find the original SMS for logging purposes
      const responseTime = new Date(`${sms_date}T${sms_time}`);
      const originalSMS = await findOriginalSMS(contact_number, responseTime);
      
      if (originalSMS) {
        // Log the response even if it's not an OK
        await db.collection('smsResponses').add({
          smsRecordId: originalSMS.id,
          contactNumber: contact_number,
          contactName: contact_name,
          responseMessage: body,
          responseId: smsId.toString(),
          responseRequestId: request_id,
          isOkResponse: false,
          receivedAt: responseTime,
          createdAt: new Date()
        });
      }
      
      return res.status(200).json({ 
        message: 'Response received but not an OK confirmation',
        body: body,
        confirmed: false,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for webhook endpoint
router.get('/justcall-sms/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    endpoint: 'JustCall SMS Webhook',
    timestamp: new Date().toISOString()
  });
});

// JustCall webhook validation endpoint (GET request)
router.get('/justcall-sms', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'JustCall webhook endpoint is ready',
    endpoint: 'POST /api/webhook/justcall-sms',
    timestamp: new Date().toISOString()
  });
});

export default router;