// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Try multiple paths for the .env file
const envPath = path.resolve(__dirname, '../../.env');
console.log('Looking for .env file at:', envPath);
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import leadsCollectionRoutes from './routes/leads-collection';
import customersRoutes from './routes/customers';
import leadFieldsRoutes from './routes/lead-fields';
import smsRoutes from './routes/sms';
import productsRoutes from './routes/products';
import termsRoutes from './routes/terms';
import smsSettingsRoutes from './routes/sms-settings';
import webhookRoutes from './routes/webhook';
import usersRoutes from './routes/users';
import pipelinesRoutes from './routes/pipelines';
import callsRoutes from './routes/calls';
import databasesRoutes from './routes/databases';

// SSE (Server-Sent Events) for real-time updates
interface SSEClient {
  id: string;
  userId: string;
  res: express.Response;
  viewingSmsId?: string; // Track which SMS the client is viewing
}

const sseClients = new Map<string, SSEClient>();

// Function to send updates to specific clients viewing a particular SMS
export const sendSSEUpdate = (smsId: string, data: any) => {
  const startTime = Date.now();
  console.log(`📡 Broadcasting SSE update for SMS ${smsId}:`, data);
  
  let clientsNotified = 0;
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  sseClients.forEach((client, clientId) => {
    // Send to clients viewing this specific SMS OR clients with 'pending' who are the same user
    const shouldNotify = client.viewingSmsId === smsId || 
                        (client.viewingSmsId === 'pending' && data.userId && client.userId === data.userId);
    
    if (shouldNotify) {
      try {
        client.res.write(message);
        clientsNotified++;
        console.log(`✅ Sent SSE update to client ${clientId} (user: ${client.userId}, viewing: ${client.viewingSmsId}) for SMS ${smsId}`);
      } catch (error) {
        console.error(`❌ Error sending SSE to client ${clientId}:`, error);
        sseClients.delete(clientId);
      }
    }
  });
  
  const updateTime = Date.now() - startTime;
  console.log(`📡 SSE update completed: ${clientsNotified} clients notified in ${updateTime}ms`);
};

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://kontrakt.norgesmediehus.no'
  ],
  credentials: true
}));

// Rate limiting - increased limits to accommodate dashboard polling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'contract-sender-api'
  });
});

// SSE endpoint for real-time updates
app.get('/api/sse', (req: express.Request, res: express.Response) => {
  const userId = req.query.userId as string;
  const viewingSmsId = req.query.viewingSmsId as string;
  
  console.log(`🔌 SSE connection attempt:`, {
    userId,
    viewingSmsId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    url: req.url,
    method: req.method,
    headers: req.headers
  });
  
  if (!userId) {
    console.error('❌ SSE connection failed: No userId provided');
    return res.status(401).json({ error: 'User ID required' });
  }

  const clientId = `${userId}-${Date.now()}`;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Store client
  sseClients.set(clientId, {
    id: clientId,
    userId,
    res,
    viewingSmsId
  });

  console.log(`🔌 SSE client connected: ${clientId}, viewing SMS: ${viewingSmsId || 'none'}`);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE client disconnected: ${clientId}`);
    sseClients.delete(clientId);
  });
});

// Make SSE clients accessible to other routes
app.locals.sseClients = sseClients;
app.locals.sendSSEUpdate = sendSSEUpdate;

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/leads-collection', leadsCollectionRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/lead-fields', leadFieldsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/sms-settings', smsSettingsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/pipelines', pipelinesRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/databases', databasesRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
