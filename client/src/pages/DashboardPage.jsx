import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  DollarSign, 
  FileCheck2, 
  ShieldAlert, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  Eye, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import SourceBadge from '../components/SourceBadge';
import Logo from '../components/Logo';
import UserDashboardPage from './UserDashboardPage';
import { apiUrl, safeJson, authHeaders } from '../api/config';

export default function DashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // If no document ID is passed in the route, render the user overview dashboard
  if (!id) {
    return <UserDashboardPage />;
  }

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(apiUrl(`/api/documents/${id}/analysis`), {
          headers: authHeaders()
        });
        const json = await safeJson(res);
        if (!res.ok || json?.error) {
          if (json?.status === 'processing' || json?.status === 'uploaded') {
            navigate(`/processing/${id}`);
            return;
          }
          throw new Error(json?.error || `Failed to fetch analysis (${res.status} ${res.statusText})`);
        }
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Logo size="md" linkTo="" />
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Loading DocSenseAI Analysis...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Analysis Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to load analysis for this document.'}</p>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Upload New Document
        </button>
      </div>
    );
  }

  const { document: doc, analysis } = data;
  const summary = analysis.summary || {};
  const deadlines = analysis.deadlines || [];
  const obligations = analysis.obligations || [];
  const financials = analysis.financialValues || [];
  const anomalies = analysis.anomalies || [];
  const missingData = analysis.missingData || [];
  const keyFindings = analysis.keyFindings || [];

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.originalName}_DocSenseAI_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Dashboard Header Bar with Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <Logo size="sm" linkTo="" />
          <div className="space-y-0.5 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                Verified Analysis
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {doc.pageCount || 1} Pages • {doc.originalName}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-lg">
              {doc.originalName}
            </h1>
            <p className="text-[11px] text-slate-500">
              Analyzed {new Date(analysis.updatedAt || doc.uploadedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <span>← Dashboard</span>
          </button>

          <button
            onClick={() => navigate(`/ask/${id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask Your Document</span>
          </button>

          <button
            onClick={() => navigate(`/viewer/${id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Document Viewer</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Export complete analysis JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Total Pages */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Pages</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{doc.pageCount || 1}</p>
          <span className="text-[10px] text-slate-500 font-mono">100% Extracted</span>
        </div>

        {/* Deadlines */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Deadlines</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{deadlines.length}</p>
          <span className="text-[10px] text-blue-600 font-mono font-semibold">Time Sensitive</span>
        </div>

        {/* Obligations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Obligations</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{obligations.length}</p>
          <span className="text-[10px] text-emerald-600 font-mono font-semibold">Binding Clauses</span>
        </div>

        {/* Financial Commitments */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Financials</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{financials.length}</p>
          <span className="text-[10px] text-amber-600 font-mono font-semibold">Values Cataloged</span>
        </div>

        {/* Potential Anomalies */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          anomalies.length > 0 
            ? 'bg-rose-50 border-rose-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Anomalies</span>
            <ShieldAlert className={`w-4 h-4 ${anomalies.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${anomalies.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {anomalies.length}
          </p>
          <span className={`text-[10px] font-mono font-bold ${anomalies.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
            {anomalies.length > 0 ? 'Discrepancy Flagged' : 'No Conflicts'}
          </span>
        </div>

        {/* Missing Data */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          missingData.length > 0 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Missing Data</span>
            <HelpCircle className={`w-4 h-4 ${missingData.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${missingData.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {missingData.length}
          </p>
          <span className={`text-[10px] font-mono font-bold ${missingData.length > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
            {missingData.length > 0 ? 'Items To Verify' : 'None Flagged'}
          </span>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'summary', label: 'Executive & Smart Summary' },
          { id: 'deadlines', label: `Deadlines & Milestones (${deadlines.length})` },
          { id: 'obligations', label: `Obligations Matrix (${obligations.length})` },
          { id: 'financials', label: `Financial Breakdown (${financials.length})` },
          { id: 'anomalies', label: `Potential Inconsistencies (${anomalies.length})` },
          { id: 'missing', label: `Potential Missing Data (${missingData.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE & SMART SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Executive Summary</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {summary.executiveSummary || 'No executive summary generated.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Key Document Points</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(summary.keyPoints || []).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Key Operational Findings</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(keyFindings || []).map((kf, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{kf}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Financial Overview</span>
              <p className="text-xs text-slate-600 leading-relaxed">{summary.financialOverview}</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Potential Issues</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {Array.isArray(summary.potentialIssues) ? summary.potentialIssues.join('; ') : summary.potentialIssues}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Missing Information</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {Array.isArray(summary.missingInformation) ? summary.missingInformation.join('; ') : summary.missingInformation}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: DEADLINES & MILESTONES */}
      {activeTab === 'deadlines' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Extracted Operational Deadlines & Milestones</h3>
              <p className="text-xs text-slate-500">Every deadline is linked to its exact source sentence and page location.</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {deadlines.length} Items
            </span>
          </div>

          {deadlines.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No important deadlines were identified in this document.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deadlines.map((d, i) => (
                <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-sm text-blue-800 font-mono">{d.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{d.description}</p>
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      &ldquo;{d.sourceText}&rdquo;
                    </p>
                  </div>
                  <div className="shrink-0">
                    <SourceBadge docId={id} page={d.page} section={d.section} text={d.sourceText} size="md" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OBLIGATIONS MATRIX */}
      {activeTab === 'obligations' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Contractual Obligations Matrix</h3>
              <p className="text-xs text-slate-500">Specifies responsible parties, required actions, conditions, and source pages.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {obligations.length} Obligations
            </span>
          </div>

          {obligations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No formal obligations were identified in this document.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {obligations.map((o, i) => (
                <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                        {o.party}
                      </span>
                      {o.condition && o.condition !== 'Unconditional' && (
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          {o.condition}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      Action: {o.action}
                    </p>
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      &ldquo;{o.sourceText}&rdquo;
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    <SourceBadge docId={id} page={o.page} section={o.section} text={o.sourceText} size="md" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINANCIAL BREAKDOWN */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          
          {anomalies.some(a => a.type === 'Financial Discrepancy') ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-rose-800">Potential Financial Inconsistency Detected</p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Automatic mathematical cross-checking detected that stated totals do not match subtotal and tax computations. See the Inconsistencies tab for full evidence.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-800 font-semibold">
                Internal Financial Verification Passed: Extracted values and calculated figures are internally consistent.
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Extracted Financial Line Items</h3>
                <p className="text-xs text-slate-500">Preserving original terminology and source verification.</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {financials.length} Values
              </span>
            </div>

            {financials.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No financial values or amounts were extracted.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {financials.map((f, i) => (
                  <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-800">{f.item}</span>
                        <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{f.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Source: &ldquo;{f.sourceText}&rdquo;
                      </p>
                    </div>
                    <SourceBadge docId={id} page={f.page} section={f.section} text={f.sourceText} size="md" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 5: POTENTIAL ANOMALIES & INCONSISTENCIES */}
      {activeTab === 'anomalies' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Potential Anomalies & Inconsistencies</h3>
              <p className="text-xs text-slate-500">
                Objective cross-examination of internal figures, contradictory clauses, and date conflicts.
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              anomalies.length > 0 
                ? 'text-rose-700 bg-rose-50 border-rose-200' 
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              {anomalies.length} Flagged
            </span>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-800">No potential inconsistencies were identified.</p>
              <p className="text-slate-500 text-[11px]">All checked financial equations and date sequences matched.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {anomalies.map((a, i) => (
                <div key={i} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase font-bold">
                        {a.severity || 'Potential Inconsistency'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{a.type}</span>
                    </div>
                    <SourceBadge docId={id} page={a.page} section={a.section} text={a.sourceText} size="md" />
                  </div>

                  <p className="text-xs font-semibold text-rose-800 leading-relaxed">
                    {a.description}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 text-[11px]">Source Evidence:</span>
                    <p className="text-[11px] font-mono text-slate-600">{a.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: POTENTIAL MISSING DATA */}
      {activeTab === 'missing' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Potential Missing Data & Omissions</h3>
              <p className="text-xs text-slate-500">
                Identifies missing referenced appendices, unexecuted signatures, and omitted key fields.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {missingData.length} Items
            </span>
          </div>

          {missingData.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Insufficient information to determine potential missing data.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {missingData.map((m, i) => (
                <div key={i} className="p-5 space-y-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                        {m.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{m.item}</span>
                    </div>
                    {m.page && <SourceBadge docId={id} page={m.page} section={m.section} text={m.sourceText} size="md" />}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">Impact: </span>
                    {m.impact}
                  </p>

                  {m.sourceText && (
                    <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {m.sourceText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
