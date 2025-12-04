import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication
router.use(authenticate);
router.use(requireAdmin);

// Admin endpoints
router.get('/users', adminController.getUsers);
router.post('/invite', adminController.inviteValidation, adminController.inviteUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

export default router;
