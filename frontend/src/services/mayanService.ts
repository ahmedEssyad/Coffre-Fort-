import axios, { AxiosInstance } from 'axios';
import { Document, DocumentType } from './api';

interface MayanConfig {
  apiUrl: string;
  token: string;
}

class MayanService {
  private axiosInstance: AxiosInstance | null = null;
  private config: MayanConfig | null = null;

  async initialize() {
    if (this.axiosInstance) {
      return; // Already initialized
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated. Please log in first.');
    }

    try {
      // Get backend URL from environment variable
      const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

      // Get Mayan configuration from backend
      const backendAxios = axios.create({
        baseURL: API_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const response = await backendAxios.get('/auth/mayan-config');
      this.config = response.data;

      // Create axios instance for Mayan API
      this.axiosInstance = axios.create({
        baseURL: this.config!.apiUrl,
        headers: {
          'Authorization': `Token ${this.config!.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to initialize Mayan service:', error);
      throw error;
    }
  }

  private async getAxios(): Promise<AxiosInstance> {
    if (!this.axiosInstance) {
      await this.initialize();
    }
    return this.axiosInstance!;
  }

  // Get document types
  async getDocumentTypes(): Promise<DocumentType[]> {
    const axios = await this.getAxios();
    const response = await axios.get('/document_types/');
    return response.data.results;
  }

  // List documents
  async listDocuments(page: number = 1, pageSize: number = 50): Promise<{ results: Document[], count: number }> {
    const axios = await this.getAxios();
    const response = await axios.get('/documents/', {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  }

  // Get document by ID
  async getDocument(id: number): Promise<Document> {
    const axios = await this.getAxios();
    const response = await axios.get(`/documents/${id}/`);
    return response.data;
  }

  // Upload document
  async uploadDocument(file: File, documentTypeId: number, description?: string): Promise<Document> {
    const axios = await this.getAxios();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type_id', documentTypeId.toString());
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Download document
  async downloadDocument(id: number): Promise<Blob> {
    const axios = await this.getAxios();

    // Get the latest version
    const versionsResponse = await axios.get(`/documents/${id}/versions/`);
    const latestVersion = versionsResponse.data.results[0];

    if (!latestVersion) {
      throw new Error('No versions found for document');
    }

    // Get the first page of the latest version
    const pagesResponse = await axios.get(`/document_versions/${latestVersion.id}/pages/`);
    const firstPage = pagesResponse.data.results[0];

    if (!firstPage) {
      throw new Error('No pages found for document version');
    }

    // Download the page image
    const downloadResponse = await axios.get(
      `/document_version_pages/${firstPage.id}/image/`,
      { responseType: 'blob' }
    );

    return downloadResponse.data;
  }

  // Delete document
  async deleteDocument(id: number): Promise<void> {
    const axios = await this.getAxios();
    await axios.delete(`/documents/${id}/`);
  }

  // Get OCR content
  async getOCRContent(id: number): Promise<string> {
    const axios = await this.getAxios();
    const response = await axios.get(`/documents/${id}/ocr/`);

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map((r: any) => r.content).join('\n');
    }
    return '';
  }

  // Check OCR status
  async checkOCRStatus(id: number): Promise<{ hasOCR: boolean; content?: string }> {
    try {
      const axios = await this.getAxios();

      // Get document versions
      const versionsResponse = await axios.get(`/documents/${id}/versions/`);
      const latestVersion = versionsResponse.data.results[0];

      if (!latestVersion) {
        return { hasOCR: false };
      }

      // Get version pages
      const pagesResponse = await axios.get(`/document_versions/${latestVersion.id}/pages/`);
      const pages = pagesResponse.data.results;

      if (!pages || pages.length === 0) {
        return { hasOCR: false };
      }

      // Check if first page has OCR content
      const firstPage = pages[0];
      try {
        const ocrResponse = await axios.get(`/document_version_pages/${firstPage.id}/ocr_content/`);
        const content = ocrResponse.data.content || '';
        return {
          hasOCR: content.length > 0,
          content,
        };
      } catch (error) {
        return { hasOCR: false };
      }
    } catch (error) {
      console.error('Error checking OCR status:', error);
      return { hasOCR: false };
    }
  }

  // Search documents
  async searchDocuments(query: string): Promise<Document[]> {
    const axios = await this.getAxios();
    const response = await axios.get('/documents/', {
      params: {
        q: query,
      },
    });
    return response.data.results;
  }
}

export const mayanService = new MayanService();
