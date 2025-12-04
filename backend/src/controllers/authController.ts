import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import authService from '../services/authService';
import emailService from '../services/emailService';
import tokenService from '../services/tokenService';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';

class AuthController {
  // Validation rules
  registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('sendEmail').optional().isBoolean(),
  ];

  loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ];

  // Register new user (with optional email invitation)
  async register(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, firstName, lastName, sendEmail = true } = req.body;

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      const user = await authService.register({
        email,
        password: tempPassword,
        firstName,
        lastName,
      });

      // Send welcome email with set-password link
      if (sendEmail) {
        const token = await tokenService.createPasswordResetToken(user.id);
        await emailService.sendWelcomeEmail(email, token, firstName);
      }

      return res.status(201).json({
        message: sendEmail
          ? 'User registered successfully. Welcome email sent.'
          : 'User registered successfully.',
        user,
        ...(sendEmail ? {} : { tempPassword }), // Only return temp password if not sending email
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Login user
  async login(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      res.json({
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      res.status(401).json({
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get current user info
  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const user = await authService.getUserById(req.user.userId);

      res.json({ user });
    } catch (error) {
      res.status(404).json({
        error: 'User not found',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Set password (using token from email)
  setPasswordValidation = [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ];

  async setPassword(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Validate token
      const resetToken = await tokenService.validatePasswordResetToken(token);

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      await authService.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await tokenService.markTokenAsUsed(token);

      res.json({
        message: 'Password set successfully. You can now login.',
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to set password',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Request password reset
  forgotPasswordValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
  ];

  async forgotPassword(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user
      const user = await authService.getUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        return res.json({
          message: 'If that email exists, a password reset link has been sent.',
        });
      }

      // Create token and send email
      const token = await tokenService.createPasswordResetToken(user.id);
      await emailService.sendPasswordResetEmail(email, token, user.firstName || undefined);

      res.json({
        message: 'If that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to process password reset request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get Mayan API configuration (token and URL)
  async getMayanConfig(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Return Mayan API configuration (use public URL for browser access)
      res.json({
        apiUrl: process.env.MAYAN_API_URL_PUBLIC || 'http://localhost:8000/api/v4',
        token: process.env.MAYAN_API_TOKEN || '',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get Mayan config',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AuthController();
