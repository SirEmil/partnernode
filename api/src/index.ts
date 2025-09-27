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
import smsRoutes from './routes/sms';
import productsRoutes from './routes/products';
import termsRoutes from './routes/terms';
import smsSettingsRoutes from './routes/sms-settings';
import webhookRoutes from './routes/webhook';

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/sms-settings', smsSettingsRoutes);
app.use('/api/webhook', webhookRoutes);

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
