import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import accessService from '../services/accessService';
import emailService from '../services/emailService';
import { body, param, validationResult } from 'express-validator';

class AccessController {
  // Validation rules
  createAccessValidation = [
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ];

  updateAccessValidation = [
    param('id').isUUID().withMessage('Valid access ID is required'),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ];

  // Create temporary access (ADMIN only)
  async createAccess(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, startDate, endDate } = req.body;

      const access = await accessService.createAccess({
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: req.user!.userId,
      });

      // Send email notification to user
      try {
        await emailService.sendAccessGrantedEmail(
          access.user.email,
          access.user.firstName,
          access.startDate,
          access.endDate
        );
      } catch (emailError) {
        console.error('Failed to send access granted email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        message: 'Temporary access created successfully',
        access,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create access',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get my accesses (current user)
  async getMyAccesses(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const accesses = await accessService.getUserAccesses(req.user.userId);

      res.json({ accesses });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch accesses',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get current active access
  async getCurrentAccess(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const access = await accessService.getCurrentActiveAccess(req.user.userId);

      if (!access) {
        return res.json({
          message: 'No active access window',
          access: null,
        });
      }

      res.json({ access });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch current access',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get all accesses (ADMIN only)
  async getAllAccesses(req: AuthRequest, res: Response) {
    try {
      const accesses = await accessService.getAllAccesses();

      res.json({ accesses });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch accesses',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get access by ID (ADMIN only)
  async getAccessById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const access = await accessService.getAccessById(id);

      res.json({ access });
    } catch (error) {
      res.status(404).json({
        error: 'Access not found',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update access (ADMIN only)
  async updateAccess(req: AuthRequest, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { startDate, endDate, isActive } = req.body;

      const updateData: any = {};
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      const access = await accessService.updateAccess(id, updateData);

      // Send email notification to user
      try {
        await emailService.sendAccessUpdatedEmail(
          access.user.email,
          access.user.firstName,
          access.startDate,
          access.endDate,
          access.isActive
        );
      } catch (emailError) {
        console.error('Failed to send access updated email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: 'Access updated successfully',
        access,
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to update access',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete access (ADMIN only)
  async deleteAccess(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get access info before deleting (for email notification)
      const access = await accessService.getAccessById(id);

      await accessService.deleteAccess(id);

      // Send email notification to user
      try {
        await emailService.sendAccessRevokedEmail(
          access.user.email,
          access.user.firstName
        );
      } catch (emailError) {
        console.error('Failed to send access revoked email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: 'Access deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to delete access',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Check if user has access
  async checkAccess(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const hasAccess = await accessService.checkUserAccess(req.user.userId);

      res.json({
        hasAccess,
        message: hasAccess ? 'Access granted' : 'Access denied',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to check access',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AccessController();
