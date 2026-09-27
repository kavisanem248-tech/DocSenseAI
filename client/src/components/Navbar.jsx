import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  LayoutDashboard, 
  Eye, 
  MessageSquare, 
  History, 
  Settings, 
  Sparkles, 
  FlaskConical,
  User,
  ShieldCheck
} from 'lucide-react';
import Logo from './Logo';
import { apiUrl, safeJson } from '../api/config';

export default function Navbar({ onRunTests }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [recentDocId, setRecentDocId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const match = location.pathname.match(/\/(?:dashboard|processing|viewer|ask)\/([a-zA-Z0-9_-]+)/);
    if (match) {
      setRecentDocId(match[1]);
      localStorage.setItem('recentDocId', match[1]);
    } else {
      const stored = localStorage.getItem('recentDocId');
      if (stored) setRecentDocId(stored);
    }
  }, [location.pathname]);

  const navItems = [
    { label: 'Upload', path: '/upload', icon: Upload },
    { 
      label: 'Dashboard', 
      path: recentDocId ? `/dashboard/${recentDocId}` : '/history', 
      icon: LayoutDashboard,
      disabled: !recentDocId && location.pathname !== '/history'
    },
    { 
      label: 'Document Viewer', 
      path: recentDocId ? `/viewer/${recentDocId}` : '/history', 
      icon: Eye,
      disabled: !recentDocId && location.pathname !== '/history'
    },
    { 
      label: 'Ask Document', 
      path: recentDocId ? `/ask/${recentDocId}` : '/history', 
      icon: MessageSquare,
      disabled: !recentDocId && location.pathname !== '/history'
    },
    { label: 'History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleGenerateSample = async () => {
    try {
      const res = await fetch(apiUrl('/api/tests/generate-sample'), { method: 'POST' });
      const data = await safeJson(res);
      if (data.success && data.document) {
        navigate(`/processing/${data.document.id}`);
      }
    } catch (e) {
      alert('Failed to generate sample document: ' + e.message);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Official Brand Logo */}
          <div className="flex items-center gap-4">
            <Logo size="sm" showTagline={false} />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path.split('?')[0]);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRunTests}
              title="Run 15-Point Automated Health Check"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Health Check</span>
            </button>

            <button
              onClick={handleGenerateSample}
              title="Load Safe Multi-Page Sample Report with intentional inconsistencies"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try Sample Report</span>
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              title="User Account"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Login / Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex flex-col items-center text-center space-y-2">
              <Logo size="md" />
              <div className="pt-2">
                <h3 className="text-base font-bold text-slate-900">Workspace Authentication</h3>
                <p className="text-xs text-slate-500">Secure enterprise session active</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Enterprise Local Sandbox</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Signed in as <span className="font-semibold text-slate-900">auditor@enterprise.local</span>
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Session Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
