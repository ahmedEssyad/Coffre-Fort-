import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import authService from '../services/authService';
import emailService from '../services/emailService';

class AdminController {
  // Validation rules
  inviteValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('role').optional().isIn(['USER', 'CONSULTANT', 'ADMIN']).withMessage('Invalid role'),
  ];

  // Get all users
  async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Invite a new user
  async inviteUser(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, firstName, lastName, role = 'USER', sendEmail = true } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'A user with this email already exists',
        });
      }

      // Create user with specified role (default USER) and temporary password
      const tempPassword = await authService.hashPassword('TempPassword123!');
      const user = await prisma.user.create({
        data: {
          email,
          password: tempPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          role: role as any,
          isActive: true,
        },
      });

      // Generate password reset token (used for initial password set)
      const token = authService.generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Send invitation email if requested
      if (sendEmail) {
        await emailService.sendWelcomeEmail(email, token, firstName);
      }

      res.status(201).json({
        message: 'User invited successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        ...(sendEmail ? {} : { token }), // Return token only if email not sent
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      res.status(500).json({
        error: 'Failed to invite user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete a user
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;

      // Check if user ID is provided
      if (!id) {
        return res.status(400).json({
          error: 'User ID is required',
        });
      }

      // Prevent deleting yourself
      if (id === currentUserId) {
        return res.status(400).json({
          error: 'Cannot delete your own account',
          message: 'You cannot delete your own account',
        });
      }

      // Check if user exists
      const userToDelete = await prisma.user.findUnique({
        where: { id },
      });

      if (!userToDelete) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The user you are trying to delete does not exist',
        });
      }

      // Count total admins
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      // Prevent deleting the last admin
      if (userToDelete.role === 'ADMIN' && adminCount <= 1) {
        return res.status(400).json({
          error: 'Cannot delete last admin',
          message: 'Cannot delete the last admin user. There must be at least one admin.',
        });
      }

      // Delete related records first (cascade delete)
      await prisma.$transaction([
        // Delete password reset tokens
        prisma.passwordResetToken.deleteMany({
          where: { userId: id },
        }),
        // Delete temporary accesses
        prisma.temporaryAccess.deleteMany({
          where: { userId: id },
        }),
        // Delete the user
        prisma.user.delete({
          where: { id },
        }),
      ]);

      res.json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update user role
  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const currentUserId = req.user?.userId;

      // Validate role
      if (!role || !['USER', 'CONSULTANT', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: 'Role must be USER, CONSULTANT, or ADMIN',
        });
      }

      // Check if user exists
      const userToUpdate = await prisma.user.findUnique({
        where: { id },
      });

      if (!userToUpdate) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The user you are trying to update does not exist',
        });
      }

      // Prevent demoting yourself from ADMIN
      if (id === currentUserId && userToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
        return res.status(400).json({
          error: 'Cannot demote yourself',
          message: 'You cannot change your own role from ADMIN to another role',
        });
      }

      // If demoting from ADMIN, check we're not removing the last admin
      if (userToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true },
        });

        if (adminCount <= 1) {
          return res.status(400).json({
            error: 'Cannot demote last admin',
            message: 'Cannot change the role of the last administrator. There must be at least one admin.',
          });
        }
      }

      // Update role
      await prisma.user.update({
        where: { id },
        data: { role: role as any },
      });

      res.json({
        message: 'User role updated successfully',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({
        error: 'Failed to update user role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AdminController();
