import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import accessRoutes from './routes/accessRoutes';
import documentRoutes from './routes/documentRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';
import config from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = config.port;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'MayanConnect Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'MayanConnect API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      access: '/api/access/*',
      documents: '/api/documents/*',
      ai: '/api/ai/*'
    }
  });
});

// 404 handler - doit être après toutes les routes
app.use(notFoundHandler);

// Error handler global - doit être en dernier
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MayanConnect Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Mayan API: ${process.env.MAYAN_API_URL}`);
  console.log(`🤖 Ollama API: ${process.env.OLLAMA_API_URL}`);
});
