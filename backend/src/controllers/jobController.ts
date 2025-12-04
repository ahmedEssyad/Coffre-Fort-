import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { jobService } from '../services/jobService';

export class JobController {
  /**
   * GET /api/jobs/:jobId
   * Récupérer le statut d'un job d'analyse
   */
  async getJobStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
        });
        return;
      }

      const job = await jobService.getJobStatus(jobId, userId);

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error: any) {
      console.error('[JobController] getJobStatus error:', error);

      if (error.message === 'Job introuvable') {
        res.status(404).json({
          success: false,
          error: 'Job introuvable',
        });
        return;
      }

      if (error.message === 'Accès non autorisé à ce job') {
        res.status(403).json({
          success: false,
          error: 'Accès non autorisé',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du statut du job',
      });
    }
  }

  /**
   * GET /api/jobs
   * Récupérer tous les jobs de l'utilisateur
   */
  async getUserJobs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const jobs = await jobService.getUserJobs(userId, limit);

      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error: any) {
      console.error('[JobController] getUserJobs error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des jobs',
      });
    }
  }
}

export const jobController = new JobController();
