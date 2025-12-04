import { Router } from 'express';
import multer from 'multer';
import documentController from '../controllers/documentController';
import { authenticate, checkTemporaryAccess } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// All routes require authentication and temporary access
router.use(authenticate);
router.use(checkTemporaryAccess);

// Document types
router.get('/types', documentController.getDocumentTypes);

// Documents CRUD
router.get('/', documentController.list);
router.get('/search', documentController.search);
router.get('/:id', documentController.get);
router.get('/:id/ocr-status', documentController.checkOCRStatus);
router.post(
  '/upload',
  upload.single('file'),
  documentController.uploadValidation,
  documentController.upload
);
router.get('/:id/download', documentController.download);
router.delete('/:id', documentController.delete);

export default router;
