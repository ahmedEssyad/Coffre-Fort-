import { useState, useEffect } from 'react';
import {
  Eye,
  Download,
  Trash2,
  Upload,
  FileText,
  X
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { Document, DocumentType } from '../services/api';
import { mayanService } from '../services/mayanService';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';
import '../theme.css';
import './Documents.css';

const Documents = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!user) {
      authService.loadUser().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadDocumentTypes();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await mayanService.listDocuments();
      setDocuments(response.results);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      showToast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const types = await mayanService.getDocumentTypes();
      setDocumentTypes(types);
    } catch (err) {
      console.error('Failed to load document types:', err);
    }
  };

  const handleDownload = async (id: number, label: string) => {
    try {
      const blob = await mayanService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = label || `document-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast.success(SuccessMessages.DOWNLOAD_SUCCESS);
    } catch (err) {
      console.error('Download failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }
    try {
      await mayanService.deleteDocument(id);
      showToast.success(SuccessMessages.DELETE_SUCCESS);
      loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="documents-page">
        <div className="documents-header">
          <h1 className="documents-title">Documents</h1>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(true)}
            >
              <Upload size={18} />
              Téléverser un Document
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="documents-skeleton">
            <div className="skeleton-table">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-row"></div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="documents-container">
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={48} strokeWidth={1.5} />
              </div>
              <h3 className="empty-title">Aucun document pour le moment</h3>
              <p className="empty-description">
                Téléversez votre premier document pour commencer l'analyse par IA
              </p>
              <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                <Upload size={18} />
                Téléverser un Document
              </button>
            </div>
          </div>
        ) : (
          <div className="documents-container">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Nom du Document</th>
                  <th>Type</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td data-label="Nom du Document">
                      <div className="document-name">{doc.label}</div>
                      {doc.description && (
                        <div className="document-type">{doc.description}</div>
                      )}
                    </td>
                    <td className="document-type" data-label="Type">
                      {doc.document_type.label}
                    </td>
                    <td className="document-date" data-label="Créé le">
                      {formatDate(doc.datetime_created)}
                    </td>
                    <td data-label="Actions">
                      <div className="document-actions">
                        <button
                          className="btn-icon"
                          onClick={() => window.location.href = `/documents/${doc.id}`}
                          title="Voir le document"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDownload(doc.id, doc.label)}
                          title="Télécharger le document"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDelete(doc.id)}
                          title="Supprimer le document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showUpload && (
          <DocumentUploadModal
            documentTypes={documentTypes}
            onClose={() => setShowUpload(false)}
            onUploadSuccess={() => {
              setShowUpload(false);
              loadDocuments();
            }}
          />
        )}
      </div>

    </Layout>
  );
};

// Document Upload Modal Component
interface DocumentUploadModalProps {
  documentTypes: DocumentType[];
  onClose: () => void;
  onUploadSuccess: () => void;
}

const DocumentUploadModal = ({
  documentTypes,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!label) {
        setLabel(e.dataTransfer.files[0].name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!label) {
        setLabel(e.target.files[0].name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !documentTypeId) {
      showToast.warning('Veuillez sélectionner un fichier et un type de document');
      return;
    }

    try {
      setUploading(true);
      await mayanService.uploadDocument(file, documentTypeId, label);

      // Upload successful - close modal immediately
      showToast.success(`Document "${label || file.name}" uploadé avec succès! OCR en cours...`);
      onUploadSuccess();

      // OCR will be processed in background by Mayan EDMS Celery workers
      // User can view document status in the documents list
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
      setUploading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Téléverser un Document</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Type de Document</label>
            <select
              className="form-select"
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(Number(e.target.value))}
            >
              <option value={0}>Sélectionnez le type de document...</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%' }}>
              {file ? (
                <div className="file-selected">
                  <div className="file-icon">
                    <FileText size={24} />
                  </div>
                  <div className="file-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="dropzone-icon">
                    <Upload size={32} />
                  </div>
                  <p className="dropzone-text">Glissez-déposez un fichier ici, ou cliquez pour sélectionner</p>
                  <p className="dropzone-subtext">PDF, PNG, JPG jusqu'à 50MB</p>
                </>
              )}
            </label>
          </div>

        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || !file || !documentTypeId}
          >
            {uploading ? (
              <>
                <Upload size={18} className="spin" />
                Téléversement...
              </>
            ) : (
              <>
                <Upload size={18} />
                Téléverser
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Documents;
