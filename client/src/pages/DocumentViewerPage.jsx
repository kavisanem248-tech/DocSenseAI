import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Download, 
  ArrowLeft
} from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl, safeJson, authHeaders, authUrl } from '../api/config';

export default function DocumentViewerPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'native'

  useEffect(() => {
    const pageFromQuery = searchParams.get('page');
    if (pageFromQuery) {
      const p = parseInt(pageFromQuery, 10);
      if (!isNaN(p) && p > 0) {
        setCurrentPage(p);
      }
    }
    const highlightFromQuery = searchParams.get('highlight');
    if (highlightFromQuery) {
      setSearchQuery(highlightFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(apiUrl(`/api/documents/${id}`), {
          headers: authHeaders()
        });
        const json = await safeJson(res);
        if (!res.ok) throw new Error(json.error || 'Document not found');
        setDoc(json.document);
        setTotalPages(json.document?.pageCount || json.pagesCount || 1);
      } catch (e) {
        console.error('Error fetching document metadata:', e);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    const fetchPage = async () => {
      setLoadingPage(true);
      try {
        const res = await fetch(apiUrl(`/api/documents/${id}/pages/${currentPage}`), {
          headers: authHeaders()
        });
        const json = await safeJson(res);
        if (!res.ok) throw new Error(json.error || 'Page not found');
        setPageData(json.page);
      } catch (e) {
        setPageData(null);
      } finally {
        setLoadingPage(false);
      }
    };
    fetchPage();
  }, [id, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
  };

  const renderHighlightedText = (text, query) => {
    if (!text) return null;
    if (!query || !query.trim()) {
      return <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">{text}</pre>;
    }

    try {
      const words = query.trim().split(/\s+/).filter(w => w.length > 2);
      if (words.length === 0) {
        return <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">{text}</pre>;
      }

      const regexPattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const regex = new RegExp(`(${regexPattern})`, 'gi');
      const parts = text.split(regex);

      return (
        <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
          {parts.map((part, index) => 
            regex.test(part) ? (
              <mark key={index} className="bg-amber-200 text-slate-900 font-bold px-1 py-0.5 rounded shadow-2xs">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </pre>
      );
    } catch (e) {
      return <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">{text}</pre>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Top Controls Bar with DocSenseAI Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/dashboard/${id}`)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <Logo size="xs" linkTo="" />

          <div className="border-l border-slate-200 pl-3">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {doc ? doc.originalName : 'Document Viewer'}
            </h1>
            <p className="text-[11px] text-slate-500 font-mono">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Pagination Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('reader')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'reader' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Traceable Reader
            </button>
            <button
              onClick={() => setViewMode('native')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'native' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Native Document
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 text-slate-700 hover:text-slate-950 disabled:opacity-30 rounded-lg hover:bg-white transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-800 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 text-slate-700 hover:text-slate-950 disabled:opacity-30 rounded-lg hover:bg-white transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <a
            href={authUrl(`/api/documents/${id}/file`)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300"
            title="Download original file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

        </div>

      </div>

      {/* In-Document Search Bar */}
      {viewMode === 'reader' && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search text or enter highlight snippet..."
            className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-[10px] text-slate-500 hover:text-slate-800 font-mono px-1.5 py-0.5 rounded bg-slate-100 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Main Viewer Body */}
      {viewMode === 'native' ? (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[75vh]">
          <iframe
            src={`${authUrl(`/api/documents/${id}/file`)}#page=${currentPage}`}
            className="w-full h-full border-0 bg-white"
            title="Native Document Embed"
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs min-h-[60vh] space-y-6">
          
          {/* Page Header Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Page {currentPage}
              </span>
              {pageData?.tableDetected && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
                  Tables Detected
                </span>
              )}
              {pageData?.ocrUsed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                  OCR Engine
                </span>
              )}
            </div>

            <span className="text-xs text-slate-400 font-mono">
              {pageData ? `${pageData.charCount || 0} characters` : ''}
            </span>
          </div>

          {/* Page Content with Highlighting */}
          {loadingPage ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              Loading page content...
            </div>
          ) : pageData?.text ? (
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 overflow-x-auto">
              {renderHighlightedText(pageData.text, searchQuery)}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              No selectable text on this page.
            </div>
          )}

        </div>
      )}

    </div>
  );
}
