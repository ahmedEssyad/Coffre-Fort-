import axios, { AxiosInstance } from 'axios';
import config from '../config/env';

// Types
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface DocumentAnalysis {
  summary: string;
  keywords: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

class OllamaService {
  private client: AxiosInstance;
  private baseURL: string;
  private model: string;

  constructor() {
    this.baseURL = config.ollama.apiUrl;
    this.model = 'llama3.2:3b'; // Default model

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5 minutes for AI processing
    });
  }

  // Generate completion from Ollama
  private async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.post<OllamaGenerateResponse>('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      return response.data.response;
    } catch (error) {
      console.error('Error generating from Ollama:', error);
      throw new Error('Failed to generate response from AI');
    }
  }

  // Analyze document and generate summary + keywords
  async analyzeDocument(text: string): Promise<DocumentAnalysis> {
    try {
      // Limit text length to avoid timeout (max ~4000 words)
      const truncatedText = text.slice(0, 15000);

      // Generate summary
      const summaryPrompt = `Résume ce document en 3-5 phrases clés. Sois concis et précis. Ne mentionne pas que c'est un résumé, donne directement le contenu.

Document:
${truncatedText}

Résumé:`;

      const summary = await this.generate(summaryPrompt);

      // Generate keywords
      const keywordsPrompt = `Extrait les 5-10 mots-clés les plus importants de ce document. Réponds uniquement avec une liste de mots séparés par des virgules, sans numéros ni explications.

Document:
${truncatedText}

Mots-clés:`;

      const keywordsText = await this.generate(keywordsPrompt);

      // Parse keywords (comma-separated)
      const keywords = keywordsText
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 10); // Limit to 10 keywords

      return {
        summary: summary.trim(),
        keywords,
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document');
    }
  }

  // Extract key information from document
  async extractKeyInfo(text: string): Promise<{
    title?: string;
    date?: string;
    author?: string;
    mainTopic: string;
  }> {
    try {
      const prompt = `Analyse ce document et extrait les informations suivantes au format JSON:
- title: le titre du document (si présent)
- date: la date mentionnée dans le document (si présente)
- author: l'auteur du document (si présent)
- mainTopic: le sujet principal en quelques mots

Réponds uniquement avec un objet JSON valide, sans texte supplémentaire.

Document:
${text.slice(0, 10000)}

JSON:`;

      const response = await this.generate(prompt);

      // Try to parse JSON response
      try {
        // Extract JSON from response (sometimes LLM adds extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON from Ollama response');
      }

      // Fallback if parsing fails
      return {
        mainTopic: 'Unable to extract information',
      };
    } catch (error) {
      console.error('Error extracting key info:', error);
      throw new Error('Failed to extract key information');
    }
  }

  // Semantic search across documents
  async semanticSearch(query: string, documentsTexts: { id: number; text: string }[]): Promise<number[]> {
    try {
      // Simple implementation: ask AI to rank documents by relevance
      const docsPreview = documentsTexts
        .map((doc, idx) => `[${idx}] ${doc.text.slice(0, 500)}...`)
        .join('\n\n');

      const prompt = `Tu dois trouver quels documents sont les plus pertinents pour cette requête: "${query}"

Voici les documents disponibles:
${docsPreview}

Réponds uniquement avec les numéros des documents pertinents, séparés par des virgules, du plus pertinent au moins pertinent (maximum 5 documents).

Numéros:`;

      const response = await this.generate(prompt);

      // Parse document IDs from response
      const ids = response
        .match(/\d+/g)
        ?.map(n => parseInt(n))
        .filter(n => n < documentsTexts.length)
        .map(idx => documentsTexts[idx].id)
        .slice(0, 5) || [];

      return ids;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  // Check if Ollama is available and model is loaded
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      return models.some((m: any) => m.name.includes('llama'));
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }
}

export default new OllamaService();
