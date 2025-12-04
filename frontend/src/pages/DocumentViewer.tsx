import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Brain,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { aiApi, jobsApi, Document, DocumentAnalysis, AnalysisJob } from '../services/api';
import { mayanService } from '../services/mayanService';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';
import '../theme.css';
import './DocumentViewer.css';

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [ocrStatus, setOcrStatus] = useState<{
    ready: boolean;
    pageCount: number;
    processedPages: number;
  } | null>(null);
  const [checkingOcr, setCheckingOcr] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadDocument();
  }, [id]);

  // Poll OCR status
  useEffect(() => {
    if (!id || !currentDoc) return;

    let intervalId: number;

    const checkOCR = async () => {
      try {
        const status = await mayanService.checkOCRStatus(parseInt(id));
        // Convert mayanService response to expected format
        setOcrStatus({
          ready: status.hasOCR,
          pageCount: 1,
          processedPages: status.hasOCR ? 1 : 0
        });
        setCheckingOcr(false);

        // Stop polling if OCR is ready
        if (status.hasOCR && intervalId) {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to check OCR status:', err);
        setCheckingOcr(false);
      }
    };

    // Initial check
    checkOCR();

    // Poll every 3 seconds if not ready
    intervalId = setInterval(checkOCR, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id, currentDoc]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await mayanService.getDocument(parseInt(id!));
      setCurrentDoc(doc);

      // Load PDF for preview
      const blob = await mayanService.downloadDocument(parseInt(id!));
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      showToast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setAnalysisProgress('Vérification du cache...');

      // Start analysis request (checks cache first)
      const response = await aiApi.analyze(parseInt(id!));

      // Check if result is from cache (HTTP 200) or new job (HTTP 202)
      if ('summary' in response && 'keywords' in response) {
        // Cached result - display immediately
        console.log(`[DocumentViewer] Cached result received for document ${id}`);
        const cached = response as { summary: string; keywords: string[] };
        setAnalysis({
          documentId: parseInt(id!),
          summary: cached.summary,
          keywords: cached.keywords,
        });
        showToast.success('Analyse récupérée du cache');
      } else if ('jobId' in response) {
        // New job - poll for completion
        const jobId = response.jobId;
        console.log(`[DocumentViewer] Analysis job started: ${jobId}`);
        setAnalysisProgress('Analyse en cours...');

        // Poll job status with progress updates
        const completedJob = await jobsApi.pollJobUntilComplete(
          jobId,
          (job: AnalysisJob) => {
            // Update progress message based on job status
            if (job.status === 'PENDING') {
              setAnalysisProgress('En attente...');
            } else if (job.status === 'PROCESSING') {
              setAnalysisProgress('Analyse en cours avec IA...');
            }
            console.log(`[DocumentViewer] Job status: ${job.status}`);
          },
          60, // 60 attempts max
          3000 // 3 seconds interval
        );

        // Job completed successfully
        if (completedJob.result) {
          setAnalysis(completedJob.result);
          showToast.success(SuccessMessages.ANALYSIS_SUCCESS);
        } else {
          throw new Error('Résultat d\'analyse manquant');
        }
      }
    } catch (err) {
      console.error('[DocumentViewer] Analysis failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    } finally {
      setAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const handleDownload = async () => {
    if (!currentDoc) return;
    try {
      const blob = await mayanService.downloadDocument(parseInt(id!));
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = currentDoc.label || `document-${id}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      showToast.success(SuccessMessages.DOWNLOAD_SUCCESS);
    } catch (err) {
      console.error('Download failed:', err);
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="viewer-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content">
            <div className="skeleton-viewer"></div>
            <div className="skeleton-sidebar"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !currentDoc) {
    return (
      <Layout>
        <div className="error-container">
          <div className="error-message">{error || 'Document non trouvé'}</div>
          <button className="btn btn-primary" onClick={() => navigate('/documents')}>
            Retour aux Documents
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="document-viewer">
        <div className="viewer-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/documents')}>
              ← Retour
            </button>
            <div className="document-info">
              <h1>{currentDoc.label}</h1>
              <div className="document-meta">
                <span className="meta-item">
                  Type : {currentDoc.document_type.label}
                </span>
                <span className="meta-separator">•</span>
                <span className="meta-item">
                  Créé le : {formatDate(currentDoc.datetime_created)}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleDownload}>
              <Download size={18} />
              Télécharger
            </button>
          </div>
        </div>

        <div className="viewer-content">
          <div className="pdf-container">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="pdf-viewer"
                title="Aperçu du Document"
              />
            ) : (
              <div className="preview-unavailable">
                <p>Aperçu non disponible</p>
              </div>
            )}
          </div>

          <div className="ai-sidebar">
            <div className="sidebar-header">
              <h2>Analyse IA</h2>

              {/* OCR Status Indicator */}
              {ocrStatus && !ocrStatus.ready && (
                <div className="ocr-status processing">
                  <Loader2 size={16} className="ocr-status-icon spin" />
                  <div className="ocr-progress">
                    Traitement OCR... ({ocrStatus.processedPages}/{ocrStatus.pageCount} pages)
                  </div>
                </div>
              )}

              {ocrStatus && ocrStatus.ready && !analysis && (
                <div className="ocr-status ready">
                  <CheckCircle2 size={16} className="ocr-status-icon" />
                  OCR Terminé - Prêt pour l'analyse
                </div>
              )}

              <button
                className="btn btn-primary btn-analyze"
                onClick={handleAnalyze}
                disabled={analyzing || !ocrStatus?.ready}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    {analysisProgress || 'Analyse en cours...'}
                  </>
                ) : (
                  <>
                    <Brain size={18} />
                    Analyser
                  </>
                )}
              </button>
            </div>

            {analysis ? (
              <div className="analysis-content">
                <div className="analysis-section">
                  <h3>Résumé</h3>
                  <p className="summary-text">{analysis.summary}</p>
                </div>

                <div className="analysis-section">
                  <h3>Mots-clés</h3>
                  <div className="keywords-list">
                    {analysis.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="analysis-placeholder">
                <div className="placeholder-icon">
                  <Brain size={48} strokeWidth={1.5} />
                </div>
                {!ocrStatus?.ready ? (
                  <>
                    <p>En attente de la fin du traitement OCR...</p>
                    <p className="placeholder-note">
                      {checkingOcr ? 'Vérification du statut...' : `Traitement ${ocrStatus?.processedPages || 0}/${ocrStatus?.pageCount || 0} pages`}
                    </p>
                  </>
                ) : (
                  <>
                    <p>Cliquez sur "Analyser" pour générer un résumé IA et extraire les mots-clés</p>
                    <p className="placeholder-note">
                      Document prêt pour l'analyse
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default DocumentViewer;
