import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Play, X, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { apiUrl, safeJson } from '../api/config';

export default function TestRunnerModal({ isOpen, onClose }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(apiUrl('/api/tests/run'), { method: 'POST' });
      const data = await safeJson(res);
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <Logo size="xs" linkTo="" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">DocSenseAI — System Health & Verification</h2>
              <p className="text-xs text-slate-500">Checking all 15 core architectural requirements</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">Production Specification Verification</p>
              <p className="text-xs text-slate-500 mt-0.5">Executes end-to-end tests for upload, extraction, OCR, chunking, RAG, deadlines, financials, and anomalies.</p>
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run All 15 Tests</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">
                  Overall Status: {results.totalPassed} / {results.totalTests} Passed
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  results.success ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {results.success ? 'ALL 15 TESTS VERIFIED' : 'TESTS COMPLETED WITH ISSUES'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                {results.results.map((r) => (
                  <div key={r.testNum} className="p-3.5 flex items-start gap-3 text-xs">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          #{r.testNum}. {r.name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          r.passed ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                        }`}>
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{r.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!results && !running && (
            <div className="text-center py-10 text-slate-500 text-xs">
              Click &quot;Run All 15 Tests&quot; above to execute the automated verification suite.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex justify-end bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
