import express from 'express';
import Joi from 'joi';
import { db } from '../config/firebase';

const router = express.Router();

// JustCall webhook payload schema
const webhookSchema = Joi.object({
  id: Joi.string().required(),
  contact_number: Joi.string().required(),
  justcall_number: Joi.string().required(),
  body: Joi.string().required(),
  direction: Joi.string().valid('inbound', 'outbound').required(),
  status: Joi.string().required(),
  created_at: Joi.string().required(),
  // Additional fields that might be present
  message_id: Joi.string().optional(),
  lead_id: Joi.string().optional(),
  user_id: Joi.string().optional()
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
  
  return okPatterns.includes(normalizedText);
};

// Function to find the original SMS by contact number and recent timestamp
const findOriginalSMS = async (contactNumber: string, responseTime: Date) => {
  try {
    // Look for SMS records sent to this contact number in the last 7 days
    const sevenDaysAgo = new Date(responseTime.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const smsQuery = await db.collection('smsRecords')
      .where('contactNumber', '==', contactNumber)
      .where('sentAt', '>=', sevenDaysAgo)
      .orderBy('sentAt', 'desc')
      .limit(10)
      .get();
    
    if (smsQuery.empty) {
      console.log(`No original SMS found for contact ${contactNumber}`);
      return null;
    }
    
    // Return the most recent SMS (first in the ordered results)
    const mostRecentSMS = smsQuery.docs[0];
    return {
      id: mostRecentSMS.id,
      ...mostRecentSMS.data()
    };
    
  } catch (error) {
    console.error('Error finding original SMS:', error);
    return null;
  }
};

// Webhook endpoint for JustCall SMS responses
router.post('/justcall-sms', async (req, res) => {
  try {
    console.log('JustCall webhook received:', JSON.stringify(req.body, null, 2));
    
    // Validate the webhook payload
    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      console.error('Webhook validation error:', error.details[0].message);
      return res.status(400).json({ 
        error: 'Invalid webhook payload',
        details: error.details[0].message 
      });
    }
    
    const { 
      id, 
      contact_number, 
      justcall_number, 
      body, 
      direction, 
      status, 
      created_at 
    } = value;
    
    // Only process inbound messages (responses from customers)
    if (direction !== 'inbound') {
      console.log('Ignoring outbound message');
      return res.status(200).json({ message: 'Outbound message ignored' });
    }
    
    // Check if this is an OK response
    const isOkResponse = normalizeOkResponse(body);
    
    if (isOkResponse) {
      console.log(`OK response detected from ${contact_number}: "${body}"`);
      
      // Find the original SMS that this is responding to
      const responseTime = new Date(created_at);
      const originalSMS = await findOriginalSMS(contact_number, responseTime);
      
      if (originalSMS) {
        console.log(`Found original SMS: ${originalSMS.id}`);
        
        // Update the SMS record to mark contract as confirmed
        await db.collection('smsRecords').doc(originalSMS.id).update({
          contractConfirmed: true,
          contractConfirmedAt: responseTime,
          contractResponse: body,
          contractResponseId: id,
          updatedAt: new Date()
        });
        
        console.log(`✅ Contract confirmed for SMS ${originalSMS.id}`);
        
        // Optional: Send confirmation to admin or log to a separate collection
        await db.collection('contractConfirmations').add({
          smsRecordId: originalSMS.id,
          contactNumber: contact_number,
          responseMessage: body,
          responseId: id,
          confirmedAt: responseTime,
          createdAt: new Date()
        });
        
        return res.status(200).json({ 
          message: 'Contract confirmed successfully',
          smsId: originalSMS.id,
          confirmed: true
        });
        
      } else {
        console.log(`No original SMS found for OK response from ${contact_number}`);
        return res.status(200).json({ 
          message: 'OK response received but no original SMS found',
          confirmed: false
        });
      }
      
    } else {
      console.log(`Non-OK response from ${contact_number}: "${body}"`);
      
      // Still try to find the original SMS for logging purposes
      const responseTime = new Date(created_at);
      const originalSMS = await findOriginalSMS(contact_number, responseTime);
      
      if (originalSMS) {
        // Log the response even if it's not an OK
        await db.collection('smsResponses').add({
          smsRecordId: originalSMS.id,
          contactNumber: contact_number,
          responseMessage: body,
          responseId: id,
          isOkResponse: false,
          receivedAt: responseTime,
          createdAt: new Date()
        });
      }
      
      return res.status(200).json({ 
        message: 'Response received but not an OK confirmation',
        confirmed: false
      });
    }
    
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
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
