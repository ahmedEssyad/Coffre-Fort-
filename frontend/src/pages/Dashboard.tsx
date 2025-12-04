import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Brain,
  Clock,
  Users,
  ShieldCheck,
  Upload,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Circle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
import { mayanService } from '../services/mayanService';
import { accessApi, Document } from '../services/api';
import Layout from '../components/Layout/Layout';
import '../theme.css';
import './Dashboard.css';

interface DashboardStats {
  documentCount: number;
  aiAnalysisCount: number;
  accessStatus: 'active' | 'scheduled' | 'expired' | 'none';
  recentDocuments: Document[];
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    documentCount: 0,
    aiAnalysisCount: 0,
    accessStatus: 'none',
    recentDocuments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      authService.loadUser().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const docsResponse = await mayanService.listDocuments(1, 50);
      const documents = docsResponse.results || [];

      const analyzedDocs = JSON.parse(localStorage.getItem('analyzedDocuments') || '[]');

      let accessStatus: 'active' | 'scheduled' | 'expired' | 'none' = 'none';
      try {
        const myAccesses = await accessApi.getMyAccesses();
        if (myAccesses && myAccesses.length > 0) {
          const now = new Date();
          const activeAccess = myAccesses.find(
            (a) => a.isActive && new Date(a.startDate) <= now && new Date(a.endDate) >= now
          );
          const futureAccess = myAccesses.find((a) => a.isActive && new Date(a.startDate) > now);
          const expiredAccess = myAccesses.find((a) => a.isActive && new Date(a.endDate) < now);

          if (activeAccess) accessStatus = 'active';
          else if (futureAccess) accessStatus = 'scheduled';
          else if (expiredAccess) accessStatus = 'expired';
        }
      } catch (err) {
        console.warn('Could not load access status:', err);
      }

      setStats({
        documentCount: documents.length,
        aiAnalysisCount: analyzedDocs.length,
        accessStatus,
        recentDocuments: documents.slice(0, 5),
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccessStatusConfig = () => {
    switch (stats.accessStatus) {
      case 'active':
        return {
          icon: CheckCircle2,
          label: 'Accès Actif',
          description: 'Accès complet accordé',
          className: 'status-active'
        };
      case 'scheduled':
        return {
          icon: Clock,
          label: 'Planifié',
          description: 'Accès en attente',
          className: 'status-scheduled'
        };
      case 'expired':
        return {
          icon: XCircle,
          label: 'Expiré',
          description: 'Accès terminé',
          className: 'status-expired'
        };
      default:
        return {
          icon: Circle,
          label: 'Aucun Accès',
          description: 'Non assigné',
          className: 'status-none'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="dashboard-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-title"></div>
              <div className="skeleton-subtitle"></div>
            </div>
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const accessConfig = getAccessStatusConfig();
  const AccessIcon = accessConfig.icon;

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Tableau de Bord</h1>
            <p className="dashboard-subtitle">
              Bienvenue, {user?.firstName || user?.email?.split('@')[0] || 'Utilisateur'}
            </p>
          </div>
          <button className="btn-upload" onClick={() => navigate('/documents')}>
            <Upload size={18} />
            Téléverser un Document
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/documents')}>
            <div className="stat-icon-wrapper stat-icon-primary">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.documentCount}</div>
              <div className="stat-label">Documents</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-secondary">
              <Brain size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.aiAnalysisCount}</div>
              <div className="stat-label">Analysés par IA</div>
            </div>
          </div>

          <div className={`stat-card stat-card-access ${accessConfig.className}`}>
            <div className={`stat-icon-wrapper stat-icon-${accessConfig.className.split('-')[1]}`}>
              <AccessIcon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value-small">{accessConfig.label}</div>
              <div className="stat-label">{accessConfig.description}</div>
            </div>
          </div>

          {user?.role === 'ADMIN' ? (
            <div className="stat-card" onClick={() => navigate('/admin')}>
              <div className="stat-icon-wrapper stat-icon-admin">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value-small">Panneau Admin</div>
                <div className="stat-label">Gérer les utilisateurs</div>
              </div>
            </div>
          ) : (
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-neutral">
                <ShieldCheck size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value-small">{user?.role || 'USER'}</div>
                <div className="stat-label">Type de compte</div>
              </div>
            </div>
          )}
        </div>

        <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Documents Récents</h2>
            {stats.recentDocuments.length > 0 && (
              <button className="btn-text" onClick={() => navigate('/documents')}>
                Voir tout
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          {stats.recentDocuments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={48} strokeWidth={1.5} />
              </div>
              <h3 className="empty-title">Aucun document pour le moment</h3>
              <p className="empty-description">
                Téléversez votre premier document pour commencer l'analyse par IA
              </p>
              <button className="btn-primary" onClick={() => navigate('/documents')}>
                <Upload size={18} />
                Téléverser un Document
              </button>
            </div>
          ) : (
            <div className="documents-list">
              {stats.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="document-item"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="document-icon">
                    <FileText size={20} />
                  </div>
                  <div className="document-info">
                    <h4 className="document-title">{doc.label}</h4>
                    <p className="document-meta">
                      <span>{doc.document_type?.label || 'Document'}</span>
                      <span className="meta-separator">•</span>
                      <span>{formatDate(doc.datetime_created)}</span>
                    </p>
                  </div>
                  <div className="document-action">
                    <ArrowRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
