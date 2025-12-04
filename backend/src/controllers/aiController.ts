import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ollamaService from '../services/ollamaService';
import mayanService from '../services/mayanService';
import { body, validationResult } from 'express-validator';

class AIController {
  // Validation rules
  analyzeValidation = [
    body('documentId').isNumeric().withMessage('Document ID is required'),
  ];

  // Analyze document (generate summary + keywords)
  async analyze(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { documentId } = req.body;

      // Get document OCR content from Mayan
      console.log(`Fetching OCR content for document ${documentId}...`);
      const ocrText = await mayanService.getDocumentOCRContent(parseInt(documentId));
      console.log(`OCR content length: ${ocrText?.length || 0} characters`);

      if (!ocrText || ocrText.trim().length === 0) {
        return res.status(400).json({
          error: 'No text content found in document',
          message: 'Document may not have been OCR processed yet',
        });
      }

      // Analyze with AI
      console.log(`Starting AI analysis for document ${documentId}...`);
      const analysis = await ollamaService.analyzeDocument(ocrText);
      console.log(`AI analysis completed for document ${documentId}`);

      res.json({
        documentId: parseInt(documentId),
        ...analysis,
      });
    } catch (error) {
      console.error('Error analyzing document:', error);
      res.status(500).json({
        error: 'Failed to analyze document',
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
