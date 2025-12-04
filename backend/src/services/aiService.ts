import ollamaService, { DocumentAnalysis } from './ollamaService';
import mayanService from './mayanService';

class AIService {
  /**
   * Analyser un document complet (OCR + AI)
   * Cette méthode est appelée par le jobService en arrière-plan
   */
  async analyzeDocument(documentId: number): Promise<DocumentAnalysis> {
    try {
      console.log(`[AIService] Fetching OCR content for document ${documentId}...`);

      // Récupérer le contenu OCR depuis Mayan
      const ocrText = await mayanService.getDocumentOCRContent(documentId);

      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('No text content found in document. Document may not have been OCR processed yet.');
      }

      console.log(`[AIService] OCR content length: ${ocrText.length} characters`);
      console.log(`[AIService] Starting AI analysis for document ${documentId}...`);

      // Analyser avec Ollama
      const analysis = await ollamaService.analyzeDocument(ocrText);

      console.log(`[AIService] AI analysis completed for document ${documentId}`);
      console.log(`[AIService] Summary length: ${analysis.summary.length} chars`);
      console.log(`[AIService] Keywords: ${analysis.keywords.join(', ')}`);

      return analysis;
    } catch (error) {
      console.error(`[AIService] Error analyzing document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifier la santé du service AI
   */
  async healthCheck(): Promise<boolean> {
    return await ollamaService.healthCheck();
  }
}

export const aiService = new AIService();
