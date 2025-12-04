import { Router } from 'express';
import aiController from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// AI endpoints
router.post('/analyze', aiController.analyzeValidation, aiController.analyze);
router.get('/health', aiController.health);

export default router;
