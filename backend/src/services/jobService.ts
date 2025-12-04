import { PrismaClient, JobStatus } from '@prisma/client';
import { aiService } from './aiService';
import mayanService from './mayanService';

const prisma = new PrismaClient();

export class JobService {
  /**
   * Récupérer la dernière analyse valide pour un document
   * Retourne null si pas d'analyse ou si le document a été modifié
   */
  async getLatestValidAnalysis(documentId: number) {
    try {
      // Récupérer le timestamp actuel du document depuis Mayan
      const currentTimestamp = await mayanService.getDocumentFileTimestamp(documentId);
      if (!currentTimestamp) {
        console.log(`[JobService] Impossible de récupérer le timestamp pour document ${documentId}`);
        return null;
      }

      // Chercher le job COMPLETED le plus récent pour ce document
      const latestJob = await prisma.analysisJob.findFirst({
        where: {
          documentId,
          status: 'COMPLETED',
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      if (!latestJob) {
        console.log(`[JobService] Aucune analyse trouvée pour document ${documentId}`);
        return null;
      }

      // Vérifier si le document a été modifié depuis l'analyse
      if (latestJob.documentTimestamp !== currentTimestamp) {
        console.log(`[JobService] Document ${documentId} modifié depuis l'analyse (${latestJob.documentTimestamp} !== ${currentTimestamp})`);
        return null;
      }

      console.log(`[JobService] Résultat en cache trouvé pour document ${documentId}`);
      return {
        id: latestJob.id,
        documentId: latestJob.documentId,
        result: latestJob.result,
        createdAt: latestJob.createdAt,
        completedAt: latestJob.completedAt,
      };
    } catch (error) {
      console.error(`[JobService] Erreur lors de la vérification du cache:`, error);
      return null;
    }
  }

  /**
   * Créer un nouveau job d'analyse
   */
  async createJob(documentId: number, createdBy: string): Promise<string> {
    // Récupérer le timestamp actuel du document
    const documentTimestamp = await mayanService.getDocumentFileTimestamp(documentId);

    const job = await prisma.analysisJob.create({
      data: {
        documentId,
        documentTimestamp,
        createdBy,
        status: 'PENDING',
      },
    });

    // Démarrer le traitement en arrière-plan
    this.processJob(job.id).catch(err => {
      console.error(`[JobService] Erreur traitement job ${job.id}:`, err);
    });

    return job.id;
  }

  /**
   * Récupérer le statut d'un job
   */
  async getJobStatus(jobId: string, userId: string) {
    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job introuvable');
    }

    // Vérifier que l'utilisateur est le créateur du job
    if (job.createdBy !== userId) {
      throw new Error('Accès non autorisé à ce job');
    }

    return {
      id: job.id,
      documentId: job.documentId,
      status: job.status,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Traiter un job d'analyse en arrière-plan
   */
  private async processJob(jobId: string): Promise<void> {
    try {
      // Marquer comme PROCESSING
      await prisma.analysisJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      console.log(`[JobService] Démarrage traitement job ${jobId}`);

      const job = await prisma.analysisJob.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new Error('Job introuvable');
      }

      // Appeler le service AI pour analyser le document
      const analysisResult = await aiService.analyzeDocument(job.documentId);

      // Marquer comme COMPLETED avec le résultat
      await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          result: analysisResult as any, // Cast to any for Prisma Json type
          completedAt: new Date(),
        },
      });

      console.log(`[JobService] Job ${jobId} terminé avec succès`);
    } catch (error: any) {
      console.error(`[JobService] Échec job ${jobId}:`, error);

      // Marquer comme FAILED avec l'erreur
      await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error.message || 'Erreur inconnue',
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Récupérer tous les jobs d'un utilisateur
   */
  async getUserJobs(userId: string, limit: number = 20) {
    const jobs = await prisma.analysisJob.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jobs.map(job => ({
      id: job.id,
      documentId: job.documentId,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    }));
  }

  /**
   * Nettoyer les vieux jobs (optionnel, pour maintenance)
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.analysisJob.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: ['COMPLETED', 'FAILED'],
        },
      },
    });

    console.log(`[JobService] Nettoyé ${result.count} jobs de plus de ${daysOld} jours`);
    return result.count;
  }
}

export const jobService = new JobService();
