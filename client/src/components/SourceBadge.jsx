import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';

export default function SourceBadge({ docId, page, section, text, size = 'sm' }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    if (!docId) return;
    const searchParams = new URLSearchParams();
    if (page) searchParams.set('page', page);
    if (text) {
      const querySnippet = text.trim().slice(0, 40);
      searchParams.set('highlight', querySnippet);
    }
    navigate(`/viewer/${docId}?${searchParams.toString()}`);
  };

  const isSmall = size === 'sm';

  return (
    <button
      onClick={handleClick}
      title={`Trace back to Page ${page || 1}${section ? ` - ${section}` : ''}. Click to view in Document Viewer.`}
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono font-medium transition-all group cursor-pointer ${
        isSmall
          ? 'px-2 py-0.5 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200/90 shadow-2xs'
          : 'px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 hover:text-blue-950 border border-blue-300/80 shadow-2xs'
      }`}
    >
      <BookOpen className="w-3 h-3 text-blue-600 group-hover:text-blue-700 transition-colors" />
      <span className="font-semibold">Page {page || 1}</span>
      {section && <span className="text-slate-500 font-sans text-[10px]">({section})</span>}
      <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-600" />
    </button>
  );
}
