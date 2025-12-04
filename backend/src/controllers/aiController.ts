import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ollamaService from '../services/ollamaService';
import mayanService from '../services/mayanService';
import { body, validationResult } from 'express-validator';
import { aiService } from '../services/aiService';

class AIController {
  // Validation rules
  analyzeValidation = [
    body('documentId').isNumeric().withMessage('Document ID is required'),
  ];

  // Analyze document (generate summary + keywords) - DIRECT MODE
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

      console.log(`[AIController] Starting analysis for document ${documentId}`);

      // Analyser directement le document
      const analysis = await aiService.analyzeDocument(parseInt(documentId));

      console.log(`[AIController] Analysis completed for document ${documentId}`);

      // Retourner le résultat immédiatement
      res.status(200).json({
        success: true,
        documentId: parseInt(documentId),
        summary: analysis.summary,
        keywords: analysis.keywords,
      });
    } catch (error) {
      console.error('[AIController] Error analyzing document:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de l\'analyse du document',
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
