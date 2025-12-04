import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ollamaService from '../services/ollamaService';
import mayanService from '../services/mayanService';
import { body, validationResult } from 'express-validator';
import { jobService } from '../services/jobService';

class AIController {
  // Validation rules
  analyzeValidation = [
    body('documentId').isNumeric().withMessage('Document ID is required'),
  ];

  // Analyze document (generate summary + keywords) - ASYNC MODE with cache
  async analyze(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { documentId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
        });
      }

      // Vérifier si une analyse valide existe en cache
      const cachedAnalysis = await jobService.getLatestValidAnalysis(parseInt(documentId));

      if (cachedAnalysis && cachedAnalysis.result) {
        console.log(`[AIController] Résultat en cache retourné pour document ${documentId}`);

        // Retourner immédiatement le résultat en cache (HTTP 200)
        const result = cachedAnalysis.result as { summary: string; keywords: string[] };
        return res.status(200).json({
          success: true,
          cached: true,
          message: 'Analyse récupérée du cache',
          documentId: parseInt(documentId),
          summary: result.summary,
          keywords: result.keywords,
        });
      }

      // Pas de cache valide → Créer un job d'analyse asynchrone
      const jobId = await jobService.createJob(parseInt(documentId), userId);

      console.log(`[AIController] Job d'analyse créé: ${jobId} pour document ${documentId}`);

      // Retourner le jobId pour polling (HTTP 202)
      res.status(202).json({
        success: true,
        cached: false,
        message: 'Analyse en cours...',
        jobId,
        documentId: parseInt(documentId),
      });
    } catch (error) {
      console.error('[AIController] Error creating analysis job:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la création du job d\'analyse',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Health check for AI service
  async health(req: AuthRequest, res: Response) {
    try {
      const isHealthy = await ollamaService.healthCheck();

      res.json({
        status: isHealthy ? 'ok' : 'unavailable',
        service: 'Ollama AI',
        model: 'llama3.2:3b',
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'Ollama AI',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AIController();
