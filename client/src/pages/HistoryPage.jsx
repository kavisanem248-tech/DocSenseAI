import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Trash2, 
  Eye, 
  LayoutDashboard, 
  MessageSquare, 
  Plus, 
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl, safeJson, authHeaders } from '../api/config';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/documents'), {
        headers: authHeaders()
      });
      if (res.ok) {
        const json = await safeJson(res);
        setDocuments(json.documents || []);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document and its analysis?')) return;

    try {
      const res = await fetch(apiUrl(`/api/documents/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await safeJson(res);
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        alert(data.error || 'Delete failed.');
      }
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleGenerateSample = async () => {
    try {
      const res = await fetch(apiUrl('/api/tests/generate-sample'), { 
        method: 'POST',
        headers: authHeaders()
      });
      const data = await safeJson(res);
      if (data.success && data.document) {
        navigate(`/processing/${data.document.id}`);
      }
    } catch (e) {
      alert('Failed to generate sample: ' + e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <Logo size="sm" linkTo="/dashboard" />
          <div className="border-l border-slate-200 pl-4 space-y-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Document History</h1>
            <p className="text-xs text-slate-500">Your secure document archive and verified AI analyses</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDocuments}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Document History Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Loading your document history...
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">No documents yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your first document to start analyzing it with DocSenseAI.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Upload Document
            </button>
            <button
              onClick={handleGenerateSample}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Try Sample PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => {
            const formattedDate = new Date(doc.uploadedAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            const statusText = 
              doc.status === 'completed' ? 'Analysis Complete' :
              doc.status === 'processing' ? 'Processing...' :
              doc.status === 'failed' ? 'Analysis Failed' : 'Uploaded';

            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Document Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {doc.originalName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Uploaded: {formattedDate}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{doc.pageCount || 1} pages</span>
                        <span>•</span>
                        <span className="font-mono">{(doc.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  {/* Key findings preview / stage info */}
                  <div className="pl-13 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Status: </span>
                    <span className={`font-medium ${
                      doc.status === 'completed' ? 'text-emerald-700' :
                      doc.status === 'processing' ? 'text-blue-700' :
                      doc.status === 'failed' ? 'text-rose-700' : 'text-slate-600'
                    }`}>
                      {statusText}
                    </span>
                    {doc.stage && doc.status !== 'completed' && (
                      <span className="text-slate-400 ml-2 font-mono">({doc.stage})</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <button
                    onClick={() => navigate(`/dashboard/${doc.id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>View Analysis</span>
                  </button>

                  <button
                    onClick={() => navigate(`/ask/${doc.id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Document</span>
                  </button>

                  <button
                    onClick={() => navigate(`/viewer/${doc.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="View Document Pages"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Viewer</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    title="Delete document and analysis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
