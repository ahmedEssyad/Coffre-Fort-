import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import mayanService from '../services/mayanService';
import { body, validationResult } from 'express-validator';

class DocumentController {
  // Validation rules
  uploadValidation = [
    body('documentTypeId').isNumeric().withMessage('Document type ID is required'),
    body('label').optional().isString(),
  ];

  // List all documents
  async list(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 50;

      const result = await mayanService.listDocuments(page, pageSize);

      res.json(result);
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({
        error: 'Failed to list documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get document by ID
  async get(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({
          error: 'Invalid document ID',
        });
      }

      const document = await mayanService.getDocument(documentId);

      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({
        error: 'Failed to fetch document',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Upload new document
  async upload(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      const { documentTypeId, label } = req.body;
      const file = req.file;

      // Upload document with file in one step
      const document = await mayanService.uploadDocument(
        file.buffer,
        file.originalname,
        parseInt(documentTypeId),
        label
      );

      res.status(201).json({
        message: 'Document uploaded successfully',
        document,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        error: 'Failed to upload document',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Download document file
  async download(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({
          error: 'Invalid document ID',
        });
      }

      // Get latest file
      const files = await mayanService.getDocumentFiles(documentId);
      if (files.length === 0) {
        return res.status(404).json({
          error: 'No files found for this document',
        });
      }

      const latestFile = files[files.length - 1];

      // Download file
      const fileBuffer = await mayanService.downloadDocumentFile(
        documentId,
        latestFile.id
      );

      // Set headers for file download
      res.setHeader('Content-Type', latestFile.mimetype || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${latestFile.filename}"`
      );
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        error: 'Failed to download document',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete document
  async delete(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({
          error: 'Invalid document ID',
        });
      }

      await mayanService.deleteDocument(documentId);

      res.json({
        message: 'Document deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get document types
  async getDocumentTypes(req: AuthRequest, res: Response) {
    try {
      const documentTypes = await mayanService.getDocumentTypes();

      res.json(documentTypes);
    } catch (error) {
      console.error('Error fetching document types:', error);
      res.status(500).json({
        error: 'Failed to fetch document types',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Search documents
  async search(req: AuthRequest, res: Response) {
    try {
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({
          error: 'Search query is required',
        });
      }

      const documents = await mayanService.searchDocuments(query);

      res.json(documents);
    } catch (error) {
      console.error('Error searching documents:', error);
      res.status(500).json({
        error: 'Failed to search documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Check OCR processing status
  async checkOCRStatus(req: AuthRequest, res: Response) {
    try {
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({
          error: 'Invalid document ID',
        });
      }

      const status = await mayanService.checkOCRStatus(documentId);

      res.json(status);
    } catch (error) {
      console.error('Error checking OCR status:', error);
      res.status(500).json({
        error: 'Failed to check OCR status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new DocumentController();
