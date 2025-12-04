import crypto from 'crypto';
import prisma from '../config/database';

class TokenService {
  // Generate random token
  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create password reset token
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  // Validate password reset token
  async validatePasswordResetToken(token: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!resetToken) {
      throw new Error('Invalid token');
    }

    if (resetToken.used) {
      throw new Error('Token has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new Error('Token has expired');
    }

    return resetToken;
  }

  // Mark token as used
  async markTokenAsUsed(token: string) {
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  }

  // Clean up expired tokens (optional, can be run as cron job)
  async cleanupExpiredTokens() {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true },
        ],
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired/used tokens`);
    return result;
  }

  // Invalidate all tokens for a user (useful when changing email/security)
  async invalidateUserTokens(userId: string) {
    const result = await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    console.log(`🔒 Invalidated ${result.count} tokens for user ${userId}`);
    return result;
  }
}

export default new TokenService();
