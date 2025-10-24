import express from 'express';
import axios from 'axios';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// JustCall API configuration
const JUSTCALL_API_URL = 'https://api.justcall.io/v1';
const JUSTCALL_API_KEY = process.env.JUSTCALL_API_KEY;
const JUSTCALL_API_SECRET = process.env.JUSTCALL_API_SECRET;

if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
  console.warn('JUSTCALL_API_KEY or JUSTCALL_API_SECRET is not set. Call functionality will not work.');
}

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

// Validation schema for calls
const makeCallSchema = Joi.object({
  to_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Phone number must be in international format (e.g., +4712345678)'
  }),
  from_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional(), // Will use configured calling number if not provided
  call_type: Joi.string().valid('outbound', 'inbound').optional().default('outbound'),
  record: Joi.boolean().optional().default(false),
  whisper: Joi.string().optional(), // Custom whisper message
  tags: Joi.string().optional(), // Comma-separated tags
  lead_id: Joi.string().optional(), // Lead ID for tracking
  lead_name: Joi.string().optional(), // Lead name for tracking
  lead_company: Joi.string().optional() // Lead company for tracking
});

// Make a call through JustCall
router.post('/make', authenticateToken, async (req, res) => {
  try {
    const { error, value } = makeCallSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        success: false,
        error: 'JustCall API credentials not configured' 
      });
    }

    const { to_number, from_number, call_type, record, whisper, tags, lead_id, lead_name, lead_company } = value;
    const userId = req.user?.uid;
    
    console.log('Call Request:', {
      userId: userId,
      toNumber: to_number,
      fromNumber: from_number,
      callType: call_type
    });

    // Get user's configured calling number
    let callingNumber = from_number;
    if (!callingNumber) {
      try {
        // Get global SMS settings (contains calling number)
        const smsSettingsDoc = await db.collection('smsSettings').doc('global').get();
        if (smsSettingsDoc.exists) {
          const smsSettings = smsSettingsDoc.data();
          callingNumber = smsSettings?.callingNumber;
        }
      } catch (error) {
        console.error('Error fetching global calling number:', error);
      }
    }

    // Validate that we have a calling number
    if (!callingNumber) {
      return res.status(400).json({
        success: false,
        error: 'Calling number is required',
        message: 'Please configure a calling number in Settings > Phone Configuration or provide from_number'
      });
    }

    // Prepare call payload for JustCall API v1 (convert from frontend format)
    const callPayload: any = {
      from: callingNumber,
      to: to_number,
      agent_id: '103' // Emil Thomassen - emilmediasolutions@gmail.com
    };

    // Add optional parameters if provided
    if (whisper) {
      callPayload.whisper = whisper;
    }
    if (tags) {
      callPayload.tags = tags;
    }

    console.log('Making call via JustCall API v1:', {
      endpoint: `${JUSTCALL_API_URL}/calls/new`,
      payload: callPayload
    });

    // Make call via JustCall API v1
    const response = await axios.post(`${JUSTCALL_API_URL}/calls/new`, callPayload, {
      headers: {
        'Authorization': `${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // Longer timeout for calls
    });

    console.log('JustCall API response:', response.data);

    // Check if call was initiated successfully
    let callId = response.data.id || response.data.call_id;
    let callStatus = response.data.status || response.data.call_status;
    
    // Handle case where call ID might be in data array
    if (!callId && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      callId = response.data.data[0].id || response.data.data[0].call_id;
      callStatus = response.data.data[0].status || response.data.data[0].call_status;
      console.log('Found call ID in data array:', callId);
    }

    if (!callId) {
      console.error('No call ID returned from JustCall API:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Call initiation failed',
        message: 'No call ID returned from JustCall API'
      });
    }

    // Store call record in Firestore
    const callRecord = {
      callId: callId,
      toNumber: to_number,
      fromNumber: callingNumber,
      callType: call_type || 'outbound',
      status: callStatus || 'initiated',
      userId: userId,
      userEmail: req.user?.email,
      initiatedAt: new Date(),
      record: record || false,
      whisper: whisper || null,
      tags: tags || null,
      justcallResponse: response.data
    };

    try {
      await db.collection('callRecords').add(callRecord);
      console.log('Call record stored in Firestore:', callId);
      
      // Also store in callogs collection for webhook tracking
      const callLogData = {
        justcallCallId: callId,
        fromNumber: callingNumber,
        toNumber: to_number,
        callDirection: 'outbound',
        status: 'initiated',
        startTime: new Date(),
        userId: req.user?.uid,
        leadId: lead_id || null,
        leadName: lead_name || null,
        leadCompany: lead_company || null,
        metadata: {
          callType: call_type,
          record: record,
          whisper: whisper || null,
          tags: tags || null,
          source: 'manual_call'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('callogs').add(callLogData);
      console.log('Call log stored for webhook tracking:', callId);
    } catch (firestoreError) {
      console.error('Error storing call record in Firestore:', firestoreError);
      // Don't fail the call if Firestore storage fails
    }

    res.json({
      success: true,
      data: {
        callId: callId,
        status: callStatus || 'initiated',
        toNumber: to_number,
        fromNumber: callingNumber,
        message: 'Call initiated successfully'
      }
    });

  } catch (error: any) {
    console.error('JustCall call error:', error);
    
    if (error.response) {
      console.error('JustCall API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      return res.status(error.response.status).json({
        success: false,
        error: 'JustCall API error',
        message: error.response.data?.error || error.response.data?.message || 'Failed to initiate call'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to initiate call',
      message: error.message
    });
  }
});

// Get call status
router.get('/status/:callId', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        success: false,
        error: 'JustCall API credentials not configured' 
      });
    }

    const { callId } = req.params;

    const response = await axios.get(`${JUSTCALL_API_URL}/calls/${callId}`, {
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
    console.error('JustCall call status error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to get call status'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get call status',
      message: error.message
    });
  }
});

// Get call history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        success: false,
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

    const response = await axios.get(`${JUSTCALL_API_URL}/calls`, {
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
    console.error('JustCall call history error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to get call history'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get call history',
      message: error.message
    });
  }
});

// End a call
router.post('/end/:callId', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        success: false,
        error: 'JustCall API credentials not configured' 
      });
    }

    const { callId } = req.params;

    const response = await axios.post(`${JUSTCALL_API_URL}/calls/${callId}/hangup`, {}, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`).toString('base64')}`
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data,
      message: 'Call ended successfully'
    });

  } catch (error: any) {
    console.error('JustCall end call error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to end call'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to end call',
      message: error.message
    });
  }
});

// Get JustCall numbers
router.get('/numbers', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        success: false,
        error: 'JustCall API credentials not configured' 
      });
    }

    const response = await axios.get(`${JUSTCALL_API_URL}/numbers/list`, {
      headers: {
        'Authorization': `${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data.data || response.data
    });

  } catch (error: any) {
    console.error('JustCall numbers error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to get numbers'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get numbers',
      message: error.message
    });
  }
});

// Get agents list
router.get('/agents', authenticateToken, async (req, res) => {
  try {
    if (!JUSTCALL_API_KEY || !JUSTCALL_API_SECRET) {
      return res.status(500).json({ 
        success: false,
        error: 'JustCall API credentials not configured' 
      });
    }

    const response = await axios.get(`${JUSTCALL_API_URL}/agents`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`).toString('base64')}`
      },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data.data || response.data
    });

  } catch (error: any) {
    console.error('JustCall agents error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'JustCall API error',
        message: error.response.data?.error || 'Failed to get agents'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get agents',
      message: error.message
    });
  }
});

// Generate JustCall dialer access token
router.get('/dialer-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get user info from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Generate access token for JustCall dialer widget
    // This is a simplified approach - in production you might want to:
    // 1. Generate a proper JWT token with expiration
    // 2. Include user-specific permissions
    // 3. Set appropriate expiration time
    
    const accessToken = Buffer.from(`${JUSTCALL_API_KEY}:${JUSTCALL_API_SECRET}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        accessToken,
        userId,
        userEmail: userData?.email,
        userName: userData?.name || userData?.email?.split('@')[0]
      }
    });
  } catch (error: any) {
    console.error('JustCall dialer token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dialer access token',
      error: error.message
    });
  }
// Log call to Firestore
router.post('/log-call', authenticateToken, async (req, res) => {
  try {
    console.log('📞 Call log endpoint called:', req.body);
    const userId = req.user?.uid;
    if (!userId) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { 
      fromNumber,           // Calling number (your JustCall number)
      toNumber,            // Called number (lead's phone)
      leadId, 
      leadName, 
      leadCompany, 
      callDirection = 'outbound',
      callStatus = 'initiated',
      duration = 0,
      pickup = false,       // Whether call was answered
      callId,
      recordingUrl,        // JustCall recording URL
      cost,               // Call cost
      metadata 
    } = req.body;

    // Validate required fields
    if (!toNumber) {
      return res.status(400).json({ success: false, message: 'To number is required' });
    }

    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();

    // Create call log entry
    const callLog = {
      userId,
      userEmail: userData?.email,
      userName: userData?.name || userData?.email?.split('@')[0],
      fromNumber: fromNumber || null,        // Your JustCall number
      toNumber,                             // Lead's phone number
      leadId: leadId || null,
      leadName: leadName || null,
      leadCompany: leadCompany || null,
      callDirection,
      callStatus,
      duration,
      pickup,                               // Whether call was answered
      callId: callId || null,
      recordingUrl: recordingUrl || null,   // JustCall recording URL
      cost: cost || 0,                      // Call cost
      metadata: metadata || {},
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    console.log('💾 Saving call log to Firestore:', callLog);
    const docRef = await db.collection('callogs').add(callLog);
    console.log('✅ Call log saved with ID:', docRef.id);

    res.json({
      success: true,
      data: {
        callLogId: docRef.id,
        ...callLog
      }
    });

  } catch (error: any) {
    console.error('Call logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log call',
      error: error.message
    });
  }
});

// Update call log (for status changes, duration, etc.)
router.put('/log-call/:callLogId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { callLogId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Verify the call log belongs to the user
    const callLogDoc = await db.collection('callogs').doc(callLogId).get();
    if (!callLogDoc.exists) {
      return res.status(404).json({ success: false, message: 'Call log not found' });
    }

    const callLogData = callLogDoc.data();
    if (callLogData?.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this call log' });
    }

    // Update the call log
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await db.collection('callogs').doc(callLogId).update(updateData);

    res.json({
      success: true,
      data: {
        callLogId,
        ...updateData
      }
    });

  } catch (error: any) {
    console.error('Call log update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call log',
      error: error.message
    });
  }
});

// Get call logs for a user
router.get('/call-logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Query call logs for the user
    const callLogsQuery = db.collection('callogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const snapshot = await callLogsQuery.get();
    const callLogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: callLogs
    });

  } catch (error: any) {
    console.error('Get call logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call logs',
      error: error.message
    });
  }
});

});

// JustCall webhook endpoint for call events
router.post('/webhook', async (req, res) => {
  try {
    console.log('📞 JustCall webhook received:', req.body);
    
    const webhookData = req.body;
    const eventType = webhookData.type || webhookData.event_type || webhookData.event;
    
    // Handle different call events
    switch (eventType) {
      case 'call.initiated':
        await handleCallInitiated(webhookData);
        break;
      case 'call.completed':
        await handleCallCompleted(webhookData);
        break;
      default:
        console.log('Unhandled webhook event type:', eventType);
    }
    
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle call initiated event
async function handleCallInitiated(webhookData: any) {
  try {
    console.log('📞 Processing call initiated webhook:', webhookData);
    
    // Extract data from JustCall webhook structure
    const data = webhookData.data || {};
    const callInfo = data.call_info || {};
    const callDuration = data.call_duration || {};
    
    // Extract lead information from metadata if available
    let leadId = null;
    let leadName = null;
    let leadCompany = null;
    let userId = null;
    
    // Try to extract metadata from JustCall webhook
    if (webhookData.metadata && Object.keys(webhookData.metadata).length > 0) {
      try {
        const metadata = typeof webhookData.metadata === 'string' 
          ? JSON.parse(webhookData.metadata) 
          : webhookData.metadata;
        
        leadId = metadata.lead_id || null;
        leadName = metadata.lead_name || null;
        leadCompany = metadata.lead_company || null;
        console.log('📋 Extracted lead info from metadata:', { leadId, leadName, leadCompany });
      } catch (error) {
        console.log('⚠️ Could not parse metadata:', error);
      }
    }
    
    // If no metadata, try to use contact info from JustCall data
    if (!leadName && data.contact_name) {
      leadName = data.contact_name;
    }
    
    // Try to get user ID from agent info or webhook data
    userId = data.agent_id ? data.agent_id.toString() : (webhookData.user_id || webhookData.userId || null);
    
    const callData = {
      justcallCallId: data.call_sid || webhookData.call_id || webhookData.id,
      fromNumber: data.justcall_number || webhookData.from_number || webhookData.from,
      toNumber: data.contact_number || webhookData.to_number || webhookData.to,
      callDirection: callInfo.direction?.toLowerCase() || webhookData.direction || 'outbound',
      status: 'initiated',
      startTime: new Date(`${data.call_date} ${data.call_time}` || webhookData.timestamp || Date.now()),
      userId: userId,
      leadId: leadId,
      leadName: leadName || data.contact_name || null,
      leadCompany: leadCompany || null,
      agentId: data.agent_id || null,
      agentName: data.agent_name || null,
      agentEmail: data.agent_email || null,
      costIncurred: data.cost_incurred || 0,
      callDuration: callDuration.total_duration || 0,
      metadata: {
        webhookData: webhookData,
        source: 'justcall_webhook',
        originalMetadata: webhookData.metadata,
        callInfo: callInfo,
        callDuration: callDuration,
        ivrInfo: data.ivr_info || {},
        queueInfo: data.queue || {},
        justcallAi: data.justcall_ai || {}
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('💾 Creating call log with data:', callData);
    await db.collection('callogs').add(callData);
    console.log('✅ Call initiated event logged:', callData.justcallCallId);
  } catch (error) {
    console.error('Error handling call initiated:', error);
  }
}

// Handle call completed event
async function handleCallCompleted(webhookData: any) {
  try {
    console.log('📞 Processing call completed webhook:', webhookData);
    
    const data = webhookData.data || {};
    const callInfo = data.call_info || {};
    const callDuration = data.call_duration || {};
    const justcallCallId = data.call_sid || webhookData.call_id || webhookData.id;
    
    // Find existing call log
    const callLogsQuery = await db.collection('callogs')
      .where('justcallCallId', '==', justcallCallId)
      .limit(1)
      .get();
    
    if (!callLogsQuery.empty) {
      // Update existing call log
      const callLogDoc = callLogsQuery.docs[0];
      const callLogData = callLogDoc.data();
      
      // Determine call status based on call info
      let status = 'completed';
      if (callInfo.type === 'missed') {
        status = 'failed';
      } else if (callInfo.type === 'answered') {
        status = 'completed';
      }
      
      // Calculate duration
      const duration = callDuration.total_duration || callDuration.conversation_time || 0;
      const endTime = new Date(`${data.call_date} ${data.call_time}` || Date.now());
      
      await callLogDoc.ref.update({
        status: status,
        endTime: endTime,
        duration: duration,
        recordingUrl: callInfo.recording || null,
        callQuality: callInfo.rating || null,
        disposition: callInfo.disposition || null,
        notes: callInfo.notes || null,
        costIncurred: data.cost_incurred || 0,
        callType: callInfo.type || null,
        missedCallReason: callInfo.missed_call_reason || null,
        friendlyDuration: callDuration.friendly_duration || null,
        conversationTime: callDuration.conversation_time || null,
        ringTime: callDuration.ring_time || null,
        holdTime: callDuration.hold_time || null,
        wrapUpTime: callDuration.wrap_up_time || null,
        queueWaitTime: callDuration.queue_wait_time || null,
        updatedAt: new Date()
      });
      
      console.log('✅ Call completed event updated:', justcallCallId, 'Status:', status, 'Duration:', duration);
    } else {
      // Create new call log if not found (shouldn't happen, but just in case)
      console.log('⚠️ No existing call log found for completed call:', justcallCallId);
      
      // Extract lead information from metadata if available
      let leadId = null;
      let leadName = null;
      let leadCompany = null;
      let userId = null;
      
      if (webhookData.metadata && Object.keys(webhookData.metadata).length > 0) {
        try {
          const metadata = typeof webhookData.metadata === 'string' 
            ? JSON.parse(webhookData.metadata) 
            : webhookData.metadata;
          
          leadId = metadata.lead_id || null;
          leadName = metadata.lead_name || null;
          leadCompany = metadata.lead_company || null;
        } catch (error) {
          console.log('⚠️ Could not parse metadata:', error);
        }
      }
      
      userId = data.agent_id ? data.agent_id.toString() : null;
      
      const callData = {
        justcallCallId: justcallCallId,
        fromNumber: data.justcall_number || null,
        toNumber: data.contact_number || null,
        callDirection: callInfo.direction?.toLowerCase() || 'outbound',
        status: callInfo.type === 'missed' ? 'failed' : 'completed',
        startTime: new Date(`${data.call_date} ${data.call_time}` || Date.now()),
        endTime: new Date(`${data.call_date} ${data.call_time}` || Date.now()),
        duration: callDuration.total_duration || 0,
        userId: userId,
        leadId: leadId,
        leadName: leadName || data.contact_name || null,
        leadCompany: leadCompany || null,
        agentId: data.agent_id || null,
        agentName: data.agent_name || null,
        agentEmail: data.agent_email || null,
        costIncurred: data.cost_incurred || 0,
        recordingUrl: callInfo.recording || null,
        callQuality: callInfo.rating || null,
        disposition: callInfo.disposition || null,
        notes: callInfo.notes || null,
        callType: callInfo.type || null,
        missedCallReason: callInfo.missed_call_reason || null,
        friendlyDuration: callDuration.friendly_duration || null,
        conversationTime: callDuration.conversation_time || null,
        ringTime: callDuration.ring_time || null,
        holdTime: callDuration.hold_time || null,
        wrapUpTime: callDuration.wrap_up_time || null,
        queueWaitTime: callDuration.queue_wait_time || null,
        metadata: {
          webhookData: webhookData,
          source: 'justcall_webhook',
          originalMetadata: webhookData.metadata,
          callInfo: callInfo,
          callDuration: callDuration,
          ivrInfo: data.ivr_info || {},
          queueInfo: data.queue || {},
          justcallAi: data.justcall_ai || {}
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('callogs').add(callData);
      console.log('✅ Call completed event logged (new):', justcallCallId);
    }
  } catch (error) {
    console.error('Error handling call completed:', error);
  }
}

export default router;
