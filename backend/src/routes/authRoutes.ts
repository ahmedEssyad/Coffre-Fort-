import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate, checkTemporaryAccess } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.registerValidation, authController.register.bind(authController));
router.post('/login', authController.loginValidation, authController.login.bind(authController));
router.post('/set-password', authController.setPasswordValidation, authController.setPassword.bind(authController));
router.post('/forgot-password', authController.forgotPasswordValidation, authController.forgotPassword.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.me.bind(authController));
router.get('/mayan-config', authenticate, checkTemporaryAccess, authController.getMayanConfig.bind(authController));
router.post('/sso-sync', authController.ssoSyncValidation, authController.ssoSync.bind(authController));

export default router;
