import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import config from '../config/env';

// Types
export interface MayanDocument {
  id: number;
  label: string;
  description: string;
  document_type: {
    id: number;
    label: string;
  };
  datetime_created: string;
  language: string;
  uuid: string;
}

export interface MayanDocumentType {
  id: number;
  label: string;
  delete_time_period: number | null;
  delete_time_unit: string | null;
  trash_time_period: number | null;
  trash_time_unit: string | null;
}

export interface MayanDocumentFile {
  id: number;
  document_id: number;
  file: string;
  filename: string;
  size: number;
  mimetype: string;
  timestamp: string;
}

export interface MayanDocumentVersion {
  id: number;
  document_id: number;
  timestamp: string;
  comment: string;
  active: boolean;
}

export interface MayanDocumentVersionPage {
  id: number;
  document_version_id: number;
  page_number: number;
}

class MayanService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = config.mayan.apiUrl;

    // Create axios instance for Mayan API
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add auth interceptor
    this.client.interceptors.request.use(
      (config) => {
        // TODO: Get Mayan token from env or database
        // For now, we'll use basic auth or token if available
        const mayanToken = process.env.MAYAN_API_TOKEN;
        if (mayanToken) {
          config.headers.Authorization = `Token ${mayanToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Get all document types
  async getDocumentTypes(): Promise<MayanDocumentType[]> {
    try {
      const response = await this.client.get('/document_types/');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw new Error('Failed to fetch document types from Mayan EDMS');
    }
  }

  // List all documents
  async listDocuments(page: number = 1, pageSize: number = 50): Promise<{
    count: number;
    results: MayanDocument[];
    next: string | null;
    previous: string | null;
  }> {
    try {
      const response = await this.client.get('/documents/', {
        params: {
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error listing documents:', error);
      throw new Error('Failed to list documents from Mayan EDMS');
    }
  }

  // Get document by ID
  async getDocument(documentId: number): Promise<MayanDocument> {
    try {
      const response = await this.client.get(`/documents/${documentId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${documentId}:`, error);
      throw new Error('Failed to fetch document from Mayan EDMS');
    }
  }

  // Upload a new document
  async uploadDocument(
    file: Buffer,
    filename: string,
    documentTypeId: number,
    label?: string
  ): Promise<MayanDocument> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('document_type_id', documentTypeId.toString());
      formData.append('label', label || filename);

      // Upload the document directly
      const response = await this.client.post('/documents/upload/', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document to Mayan EDMS');
    }
  }

  // Upload file to existing document
  async uploadFileToDocument(
    documentId: number,
    file: Buffer,
    filename: string,
    actionName: 'replace' | 'append' | 'keep' = 'replace'
  ): Promise<void> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file_new', file, filename);
      formData.append('action_name', actionName);

      // Upload file to document
      await this.client.post(
        `/documents/${documentId}/files/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
    } catch (error) {
      console.error('Error uploading file to document:', error);
      throw new Error('Failed to upload file to Mayan EDMS');
    }
  }

  // Get document files
  async getDocumentFiles(documentId: number): Promise<MayanDocumentFile[]> {
    try {
      const response = await this.client.get(`/documents/${documentId}/files/`);
      return response.data.results || response.data;
    } catch (error) {
      console.error(`Error fetching files for document ${documentId}:`, error);
      throw new Error('Failed to fetch document files from Mayan EDMS');
    }
  }

  // Download document file
  async downloadDocumentFile(documentId: number, fileId: number): Promise<Buffer> {
    try {
      const response = await this.client.get(
        `/documents/${documentId}/files/${fileId}/download/`,
        {
          responseType: 'arraybuffer',
        }
      );
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw new Error('Failed to download document file from Mayan EDMS');
    }
  }

  // Delete document
  async deleteDocument(documentId: number): Promise<void> {
    try {
      await this.client.delete(`/documents/${documentId}/`);
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw new Error('Failed to delete document from Mayan EDMS');
    }
  }

  // Get document versions
  async getDocumentVersions(documentId: number): Promise<MayanDocumentVersion[]> {
    try {
      const response = await this.client.get(`/documents/${documentId}/versions/`);
      return response.data.results || response.data;
    } catch (error) {
      console.error(`Error fetching versions for document ${documentId}:`, error);
      throw new Error('Failed to fetch document versions from Mayan EDMS');
    }
  }

  // Get document version pages
  async getDocumentVersionPages(
    documentId: number,
    versionId: number
  ): Promise<MayanDocumentVersionPage[]> {
    try {
      const response = await this.client.get(
        `/documents/${documentId}/versions/${versionId}/pages/`
      );
      return response.data.results || response.data;
    } catch (error) {
      console.error(`Error fetching pages for document ${documentId} version ${versionId}:`, error);
      throw new Error('Failed to fetch version pages from Mayan EDMS');
    }
  }

  // Get OCR content for a specific page
  async getDocumentVersionPageOCR(
    documentId: number,
    versionId: number,
    pageId: number
  ): Promise<string> {
    try {
      const response = await this.client.get(
        `/documents/${documentId}/versions/${versionId}/pages/${pageId}/ocr/`
      );
      return response.data.content || '';
    } catch (error) {
      console.error(
        `Error fetching OCR for document ${documentId} version ${versionId} page ${pageId}:`,
        error
      );
      // Return empty string if OCR not available for this page
      return '';
    }
  }

  // Check OCR processing status
  async checkOCRStatus(documentId: number): Promise<{
    ready: boolean;
    pageCount: number;
    processedPages: number;
  }> {
    try {
      // Get document versions
      const versions = await this.getDocumentVersions(documentId);
      if (versions.length === 0) {
        return { ready: false, pageCount: 0, processedPages: 0 };
      }

      // Get the latest/active version
      const latestVersion = versions.find((v) => v.active) || versions[versions.length - 1];

      // Get all pages for this version
      const pages = await this.getDocumentVersionPages(documentId, latestVersion.id);
      if (pages.length === 0) {
        return { ready: false, pageCount: 0, processedPages: 0 };
      }

      // Check how many pages have OCR content
      let processedPages = 0;
      for (const page of pages) {
        const ocrContent = await this.getDocumentVersionPageOCR(
          documentId,
          latestVersion.id,
          page.id
        );
        if (ocrContent && ocrContent.trim().length > 0) {
          processedPages++;
        }
      }

      return {
        ready: processedPages === pages.length && processedPages > 0,
        pageCount: pages.length,
        processedPages,
      };
    } catch (error) {
      console.error(`Error checking OCR status for document ${documentId}:`, error);
      return { ready: false, pageCount: 0, processedPages: 0 };
    }
  }

  // Get document file timestamp (for cache invalidation)
  async getDocumentFileTimestamp(documentId: number): Promise<string | null> {
    try {
      // Get document versions
      const versions = await this.getDocumentVersions(documentId);
      if (versions.length === 0) {
        return null;
      }

      // Get the latest/active version
      const latestVersion = versions.find((v) => v.active) || versions[versions.length - 1];

      // Return the timestamp of the latest version
      return latestVersion.timestamp;
    } catch (error) {
      console.error(`Error fetching document file timestamp for ${documentId}:`, error);
      return null;
    }
  }

  // Get document OCR content (for AI analysis)
  async getDocumentOCRContent(documentId: number): Promise<string> {
    try {
      // Get document versions
      const versions = await this.getDocumentVersions(documentId);
      if (versions.length === 0) {
        throw new Error('No versions found for document');
      }

      // Get the latest/active version
      const latestVersion = versions.find((v) => v.active) || versions[versions.length - 1];

      // Get all pages for this version
      const pages = await this.getDocumentVersionPages(documentId, latestVersion.id);
      if (pages.length === 0) {
        throw new Error('No pages found for document version');
      }

      // Fetch OCR content for each page
      const ocrContents: string[] = [];
      for (const page of pages) {
        const ocrContent = await this.getDocumentVersionPageOCR(
          documentId,
          latestVersion.id,
          page.id
        );
        if (ocrContent) {
          ocrContents.push(`--- Page ${page.page_number} ---\n${ocrContent}`);
        }
      }

      if (ocrContents.length === 0) {
        throw new Error('No OCR content found for document');
      }

      // Concatenate all page OCR content
      return ocrContents.join('\n\n');
    } catch (error) {
      console.error(`Error fetching OCR content for document ${documentId}:`, error);
      throw new Error('Failed to fetch OCR content from Mayan EDMS');
    }
  }

  // Search documents
  async searchDocuments(query: string): Promise<MayanDocument[]> {
    try {
      const response = await this.client.get('/search/documents.documentsearchresult/', {
        params: {
          q: query,
        },
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search documents in Mayan EDMS');
    }
  }
}

export default new MayanService();
