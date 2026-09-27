import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl, safeJson } from '../api/config';

export default function SettingsPage({ onRunTests }) {
  const [provider, setProvider] = useState('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gemini-1.5-flash');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(apiUrl('/api/settings'));
        if (res.ok) {
          const json = await safeJson(res);
          const s = json.settings || {};
          setProvider(s.provider || 'gemini');
          setGeminiApiKey(s.geminiApiKey || '');
          setOpenaiApiKey(s.openaiApiKey || '');
          setOpenaiBaseUrl(s.openaiBaseUrl || 'https://api.openai.com/v1');
          setModel(s.model || 'gemini-1.5-flash');
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setTestResult(null);

    try {
      const res = await fetch(apiUrl('/api/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          geminiApiKey,
          openaiApiKey,
          openaiBaseUrl,
          model
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errJson = await safeJson(res);
        alert('Save failed: ' + (errJson.error || 'Server error'));
      }
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(apiUrl('/api/settings/test'), { method: 'POST' });
      const json = await safeJson(res);
      setTestResult(json);
    } catch (e) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <Logo size="sm" linkTo="" />
          <div className="border-l border-slate-200 pl-4 space-y-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI & Engine Settings</h1>
            <p className="text-xs text-slate-500">Configure external LLM providers or use the built-in offline engine.</p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800">Active AI Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'gemini', title: 'Google Gemini', desc: 'Gemini 1.5 Flash / Pro' },
              { id: 'openai', title: 'OpenAI / Compatible', desc: 'GPT-4o or Ollama / Groq' },
              { id: 'builtin', title: 'Built-in Engine', desc: 'Offline Rule-Based NLP' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  provider === p.id
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <p className="text-xs font-bold">{p.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini Settings */}
        {provider === 'gemini' && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Google Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <span>Get Gemini API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Note: If no API key is provided, DocSenseAI automatically utilizes its built-in deterministic NLP engine.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Model Name</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gemini-1.5-flash"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* OpenAI / Ollama Settings */}
        {provider === 'openai' && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">OpenAI API Key</label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">API Base URL</label>
              <input
                type="text"
                value={openaiBaseUrl}
                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Model Name</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Save & Test Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5 text-blue-600" />}
              <span>Test Connection</span>
            </button>

            <button
              type="button"
              onClick={onRunTests}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              <span>Run Automated 15-Point Suite</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Settings saved!
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-4 rounded-xl text-xs border ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' 
              : 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
          }`}>
            <p className="font-bold">{testResult.message || (testResult.success ? 'Success' : 'Connection Failed')}</p>
            {testResult.response && <p className="text-[11px] font-mono mt-1 opacity-90">&quot;{testResult.response}&quot;</p>}
            {testResult.error && <p className="text-[11px] mt-1">{testResult.error}</p>}
          </div>
        )}

      </form>

    </div>
  );
}
