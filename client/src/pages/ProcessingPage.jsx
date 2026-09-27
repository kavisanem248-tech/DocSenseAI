import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';
import Logo from '../components/Logo';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'File Ingestion & Magic Validation', threshold: 10 },
  { id: 'extract', label: 'Extracting Text, Pages & Tables', threshold: 25 },
  { id: 'quality', label: 'Automated Text Quality Check & OCR Verification', threshold: 40 },
  { id: 'chunk', label: 'Page-Aware Document Chunking & Source Indexing', threshold: 55 },
  { id: 'vector', label: 'Building Semantic RAG Vector Index', threshold: 70 },
  { id: 'analyze', label: 'AI Extraction: Deadlines, Obligations, Financials', threshold: 85 },
  { id: 'complete', label: 'Mathematical Cross-Checks & Smart Summary', threshold: 100 }
];

export default function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(10);
  const [stage, setStage] = useState('Initiating document pipeline...');

  useEffect(() => {
    let intervalId = null;
    let isMounted = true;

    const startAndMonitor = async () => {
      try {
        const initialRes = await fetch(`/api/documents/${id}`);
        if (!initialRes.ok) {
          throw new Error('Document not found or removed.');
        }
        const initialData = await initialRes.json();
        if (!isMounted) return;
        setDoc(initialData.document);

        if (initialData.document.status === 'uploaded') {
          await fetch(`/api/documents/${id}/analyze`, { method: 'POST' });
        } else if (initialData.document.status === 'completed') {
          navigate(`/dashboard/${id}`);
          return;
        }

        intervalId = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/documents/${id}`);
            if (!pollRes.ok) return;
            const pollData = await pollRes.json();
            const currentDoc = pollData.document;

            if (!isMounted) return;
            setDoc(currentDoc);
            setProgress(currentDoc.progress || 10);
            setStage(currentDoc.stage || 'Processing document...');

            if (currentDoc.status === 'completed') {
              clearInterval(intervalId);
              setTimeout(() => {
                navigate(`/dashboard/${id}`);
              }, 600);
            } else if (currentDoc.status === 'failed') {
              clearInterval(intervalId);
              setError(currentDoc.error || 'Document processing failed.');
            }
          } catch (pollErr) {
            console.error('Polling error:', pollErr);
          }
        }, 800);

      } catch (err) {
        if (isMounted) setError(err.message);
      }
    };

    startAndMonitor();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, navigate]);

  const handleRetry = async () => {
    setError(null);
    setProgress(15);
    setStage('Retrying analysis...');
    try {
      await fetch(`/api/documents/${id}/analyze`, { method: 'POST' });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      
      {/* Header with Logo */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Logo size="md" linkTo="" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>DocSenseAI Analysis Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analyzing Document
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto truncate">
            {doc ? doc.originalName : 'Extracting structure, financial values, deadlines, and cross-checking facts...'}
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        
        {/* Progress Bar & Percent */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">{stage}</span>
            <span className="font-mono font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Real Stage Steps */}
        <div className="space-y-2.5 pt-2">
          {PIPELINE_STEPS.map((step) => {
            const isDone = progress >= step.threshold;
            const isCurrent = progress < step.threshold && progress >= (step.threshold - 15);

            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${
                  isDone 
                    ? 'bg-slate-50/80 border-slate-200 text-slate-700 font-medium'
                    : isCurrent
                    ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                    : 'opacity-40 border-slate-100 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Error State if pipeline halts */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold text-rose-800">Processing Interrupted</p>
                <p className="text-slate-600 mt-0.5">{error}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => navigate('/upload')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Back to Upload
              </button>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
