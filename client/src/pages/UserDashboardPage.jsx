import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Upload, 
  Clock, 
  MessageSquare, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl, safeJson, authHeaders } from '../api/config';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
      console.error('Error loading documents for dashboard:', e);
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
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
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

  // Compute live user stats
  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.status === 'completed').length;
  const processingDocs = documents.filter(d => d.status === 'processing').length;
  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount || 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-medium backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            <span>Secure Multi-Tenant Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || 'Explorer'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Your documents are strictly isolated and encrypted. Upload reports to extract verified deadlines, obligations, financials, and cross-checks.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={handleGenerateSample}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl text-xs backdrop-blur-xs transition-colors cursor-pointer border border-white/20"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Try Sample</span>
          </button>
        </div>
      </div>

      {/* Analysis Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Documents</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalDocs}</div>
          <span className="text-[11px] text-slate-400">Stored in your account</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Completed Analyses</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{completedDocs}</div>
          <span className="text-[11px] text-emerald-600/80">100% verified sources</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Processing Queue</span>
          <div className="text-2xl font-bold text-blue-600 font-mono">{processingDocs}</div>
          <span className="text-[11px] text-slate-400">Active pipeline tasks</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Pages Read</span>
          <div className="text-2xl font-bold text-indigo-600 font-mono">{totalPages}</div>
          <span className="text-[11px] text-slate-400">OCR & digital parsed</span>
        </div>
      </div>

      {/* Recent Documents & History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Recent Documents</h2>
            <span className="text-xs text-slate-400 font-mono">({documents.length})</span>
          </div>

          {documents.length > 0 && (
            <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Loading your documents...
          </div>
        ) : documents.length === 0 ? (
          /* Required Empty State */
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
            <div className="pt-2">
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.slice(0, 6).map((doc) => {
              const formattedDate = new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                        doc.status === 'completed'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : doc.status === 'processing'
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {doc.originalName}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                        <span>{doc.pageCount || 1} pages</span>
                        <span>•</span>
                        <span>{(doc.size / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(doc.status === 'completed' ? `/dashboard/${doc.id}` : `/processing/${doc.id}`)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                      >
                        View Analysis
                      </button>
                      <button
                        onClick={() => navigate(`/ask/${doc.id}`)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Ask Document"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account / User Details Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                Active Member
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/settings')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Settings
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

    </div>
  );
}
