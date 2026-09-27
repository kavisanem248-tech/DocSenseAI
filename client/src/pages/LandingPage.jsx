import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  FileCheck2, 
  Bot, 
  SearchCode,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { apiUrl, safeJson, authHeaders } from '../api/config';

export default function LandingPage({ onRunTests }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
      alert('Failed to generate sample document: ' + e.message);
    }
  };

  return (
    <div className="space-y-20 py-8 bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 pt-10 pb-6 space-y-6">
        
        {/* Prominent Official Logo */}
        <div className="flex justify-center mb-2">
          <Logo size="xl" linkTo={isAuthenticated ? '/dashboard' : '/'} />
        </div>

        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Understand Documents. Discover Insights. Verify Sources.</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Turn lengthy documents into <br />
          <span className="text-blue-600">actionable, traceable insights.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          &ldquo;From hundreds of pages to actionable insights — with every important answer traceable to its exact source page.&rdquo;
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
          <button
            onClick={() => navigate(isAuthenticated ? '/upload' : '/signup')}
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>{isAuthenticated ? 'Analyze Your Document' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>View Your Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Sign In to Account</span>
            </button>
          )}

          <button
            onClick={handleGenerateSample}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-blue-700 font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Try Sample Report</span>
          </button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-6 text-xs text-slate-600">
          <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">✓ PDF, DOCX, & Scanned OCR</span>
          <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">✓ Mathematical Cross-Checking</span>
          <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">✓ Strict Source Attribution</span>
          <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">✓ Zero Hallucination RAG</span>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            DocSenseAI Intelligence Capabilities
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Extracts critical operational and financial commitments without hallucinated assumptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Deadlines & Milestones</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects due dates, submission deadlines, payment terms, renewal schedules, and time limits with original sentence context.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Obligations Matrix</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identifies who must do what, when they must do it, and applicable conditions (&ldquo;provided that&rdquo;, &ldquo;subject to&rdquo;).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Financial Integrity & Math</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts amounts, subtotals, taxes, and automatically validates equations (<code className="text-emerald-700 bg-emerald-50 px-1 rounded font-semibold">Subtotal + Tax = Total</code>) to spot discrepancies.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Anomaly & Inconsistency</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-compares internal sections to flag differing figures, contradictory clauses, or date sequence errors with source evidence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <SearchCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Missing Data & Attachments</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Spots referenced appendices or exhibits missing from the upload, unexecuted signature lines, and omitted required identifiers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Traceable RAG Chat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask document questions with grounded semantic search. Every answer cites exact page numbers, sections, and evidence quotes.
            </p>
          </div>

        </div>
      </section>

      {/* The Traceable Workflow */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The DocSenseAI Engine</span>
          <h2 className="text-2xl font-bold text-slate-900">How The Complete Analysis Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">01</span>
            <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Upload & Validate</h4>
            <p className="text-[11px] text-slate-600">Verifies MIME, magic bytes, size limits, and checks for corrupted files.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">02</span>
            <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Extract & OCR</h4>
            <p className="text-[11px] text-slate-600">Per-page text & tables; automatically runs OCR on image scans.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">03</span>
            <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Chunk & Cross-Check</h4>
            <p className="text-[11px] text-slate-600">Preserves page/section metadata and performs mathematical validation.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-blue-600">04</span>
            <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Dashboard & RAG</h4>
            <p className="text-[11px] text-slate-600">Interact with findings, view source citations, and chat with your document.</p>
          </div>
        </div>

        <div className="text-center pt-8">
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <span>Start Analyzing Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

    </div>
  );
}
