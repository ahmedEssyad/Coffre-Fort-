import prisma from '../config/database';

export interface CreateAccessData {
  userId: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

export interface UpdateAccessData {
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

class AccessService {
  // Create temporary access
  async createAccess(data: CreateAccessData) {
    // Validate dates
    if (data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create access
    const access = await prisma.temporaryAccess.create({
      data: {
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.createdBy,
      },
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

    return access;
  }

  // Get all accesses for a user
  async getUserAccesses(userId: string) {
    const accesses = await prisma.temporaryAccess.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return accesses;
  }

  // Get access by ID
  async getAccessById(accessId: string) {
    const access = await prisma.temporaryAccess.findUnique({
      where: { id: accessId },
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

    if (!access) {
      throw new Error('Access not found');
    }

    return access;
  }

  // Update access
  async updateAccess(accessId: string, data: UpdateAccessData) {
    // Validate dates if provided
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }

    const access = await prisma.temporaryAccess.update({
      where: { id: accessId },
      data,
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

    return access;
  }

  // Delete access
  async deleteAccess(accessId: string) {
    await prisma.temporaryAccess.delete({
      where: { id: accessId },
    });

    return { message: 'Access deleted successfully' };
  }

  // Check if user has valid access at current time
  async checkUserAccess(userId: string): Promise<boolean> {
    const now = new Date();

    const validAccess = await prisma.temporaryAccess.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    return !!validAccess;
  }

  // Get all active accesses (admin only)
  async getAllAccesses() {
    const accesses = await prisma.temporaryAccess.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return accesses;
  }

  // Get current active accesses for a user
  async getCurrentActiveAccess(userId: string) {
    const now = new Date();

    const activeAccess = await prisma.temporaryAccess.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    return activeAccess;
  }
}

export default new AccessService();
