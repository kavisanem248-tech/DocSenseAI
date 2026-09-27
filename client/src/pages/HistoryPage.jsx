import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Trash2, 
  Eye, 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import Logo from '../components/Logo';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const json = await res.json();
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
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document and all its analysis?')) return;

    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleGenerateSample = async () => {
    try {
      const res = await fetch('/api/tests/generate-sample', { method: 'POST' });
      const data = await res.json();
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
          <Logo size="sm" linkTo="" />
          <div className="border-l border-slate-200 pl-4 space-y-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analysis History</h1>
            <p className="text-xs text-slate-500">Document workspace catalog & verified analyses</p>
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
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Loading document history...
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-4 max-w-md mx-auto shadow-xs">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No documents analyzed yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your own PDF, DOCX, or scanned document, or generate a safe sample report to get started.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Upload Document
            </button>
            <button
              onClick={handleGenerateSample}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Try Sample
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(doc.status === 'completed' ? `/dashboard/${doc.id}` : `/processing/${doc.id}`)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{doc.originalName}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                      <span>{doc.pageCount || 1} pages</span>
                      <span>•</span>
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                    doc.status === 'completed'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : doc.status === 'processing'
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {doc.status}
                  </span>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${doc.id}`); }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Open Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/ask/${doc.id}`); }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Ask Document"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/viewer/${doc.id}`); }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="View Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
