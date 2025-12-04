import { Router } from 'express';
import { jobController } from '../controllers/jobController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/jobs/:jobId
 * @desc Récupérer le statut d'un job d'analyse
 * @access Private
 */
router.get('/:jobId', authenticate, (req, res) => jobController.getJobStatus(req, res));

/**
 * @route GET /api/jobs
 * @desc Récupérer tous les jobs de l'utilisateur
 * @access Private
 */
router.get('/', authenticate, (req, res) => jobController.getUserJobs(req, res));

export default router;
