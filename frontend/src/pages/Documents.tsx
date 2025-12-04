import { useState, useEffect } from 'react';
import {
  Eye,
  Download,
  Trash2,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Mail,
  X
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { Document, DocumentType } from '../services/api';
import { mayanService } from '../services/mayanService';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
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
      setError('Échec du chargement des documents');
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
    } catch (err) {
      console.error('Download failed:', err);
      alert('Échec du téléchargement du document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }
    try {
      await mayanService.deleteDocument(id);
      loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Échec de la suppression du document');
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
  const [uploadedDocId, setUploadedDocId] = useState<number | null>(null);
  const [ocrStatus, setOcrStatus] = useState<{
    ready: boolean;
    pageCount: number;
    processedPages: number;
  } | null>(null);

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
      alert('Veuillez sélectionner un fichier et un type de document');
      return;
    }

    try {
      setUploading(true);
      const result = await mayanService.uploadDocument(file, documentTypeId, label);
      setUploadedDocId(result.id);

      // Start polling OCR status
      pollOCRStatus(result.id);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Échec du téléversement du document');
      setUploading(false);
    }
  };

  const pollOCRStatus = async (docId: number) => {
    const maxAttempts = 40; // Poll for up to 2 minutes
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const status = await mayanService.checkOCRStatus(docId);
        setOcrStatus({
          ready: status.hasOCR,
          pageCount: 1,
          processedPages: status.hasOCR ? 1 : 0,
        });

        if (status.hasOCR) {
          // OCR is complete
          setTimeout(() => {
            onUploadSuccess();
          }, 1500); // Show success message briefly
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 3000); // Check again in 3 seconds
        } else {
          // Timeout - close anyway
          onUploadSuccess();
        }
      } catch (err) {
        console.error('Failed to check OCR status:', err);
        onUploadSuccess();
      }
    };

    checkStatus();
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

          {uploadedDocId && ocrStatus && (
            <div className={`upload-status ${ocrStatus.ready ? 'success' : 'processing'}`}>
              <div className="status-content">
                <div className={`status-icon ${ocrStatus.ready ? 'success' : 'processing'}`}>
                  {ocrStatus.ready ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Loader2 size={24} className="spin" />
                  )}
                </div>
                <div className="status-text">
                  <p className={`status-title ${ocrStatus.ready ? 'success' : 'processing'}`}>
                    {ocrStatus.ready ? 'Téléversement Terminé !' : 'Traitement du Document...'}
                  </p>
                  <p className={`status-description ${ocrStatus.ready ? 'success' : 'processing'}`}>
                    {ocrStatus.ready
                      ? 'Traitement OCR terminé. Vous pouvez maintenant analyser ce document.'
                      : `OCR extrait le texte de votre document (${ocrStatus.processedPages}/${ocrStatus.pageCount} pages)`
                    }
                  </p>
                </div>
              </div>
              {ocrStatus.ready && (
                <div className="status-info">
                  <Mail size={14} className="status-info-icon" />
                  <span>Document prêt pour l'analyse IA</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={uploading && !ocrStatus}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || !file || !documentTypeId}
          >
            {uploading && !uploadedDocId ? (
              <>
                <Upload size={18} className="spin" />
                Téléversement...
              </>
            ) : uploading ? (
              <>
                <Loader2 size={18} className="spin" />
                Traitement OCR...
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
