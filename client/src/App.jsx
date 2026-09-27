import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TestRunnerModal from './components/TestRunnerModal';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import DashboardPage from './pages/DashboardPage';
import DocumentViewerPage from './pages/DocumentViewerPage';
import AskDocumentPage from './pages/AskDocumentPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import Logo from './components/Logo';

export default function App() {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        
        {/* Navigation Bar */}
        <Navbar onRunTests={() => setIsTestModalOpen(true)} />

        {/* Automated Test Suite Modal */}
        <TestRunnerModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage onRunTests={() => setIsTestModalOpen(true)} />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/processing/:id" element={<ProcessingPage />} />
            <Route path="/dashboard/:id" element={<DashboardPage />} />
            <Route path="/viewer/:id" element={<DocumentViewerPage />} />
            <Route path="/ask/:id" element={<AskDocumentPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage onRunTests={() => setIsTestModalOpen(true)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size="xs" linkTo="" />
              <div className="text-left border-l border-slate-200 pl-3">
                <p className="font-bold text-slate-900 text-xs">DocSenseAI — Intelligent Document Analysis Platform</p>
                <p className="text-[11px] text-blue-600 font-semibold">Understand Documents. Discover Insights. Verify Sources.</p>
              </div>
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              © 2026 DocSenseAI • Enterprise Traceable Intelligence
            </p>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}
