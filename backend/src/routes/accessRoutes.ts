import { Router } from 'express';
import accessController from '../controllers/accessController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// User routes (authenticated)
router.get('/my-access', authenticate, accessController.getMyAccesses.bind(accessController));
router.get('/current', authenticate, accessController.getCurrentAccess.bind(accessController));
router.get('/check', authenticate, accessController.checkAccess.bind(accessController));

// Admin routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  accessController.createAccessValidation,
  accessController.createAccess.bind(accessController)
);

router.get(
  '/all',
  authenticate,
  requireAdmin,
  accessController.getAllAccesses.bind(accessController)
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  accessController.getAccessById.bind(accessController)
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  accessController.updateAccessValidation,
  accessController.updateAccess.bind(accessController)
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  accessController.deleteAccess.bind(accessController)
);

export default router;
