import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck
} from 'lucide-react';
import Logo from '../components/Logo';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const validateFile = (file) => {
    setValidationError(null);

    if (!file) {
      setValidationError('Please select a file to upload.');
      return false;
    }

    if (file.size === 0) {
      setValidationError('Empty file. Uploaded document contains 0 bytes.');
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setValidationError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 50MB.`);
      return false;
    }

    const name = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext));
    if (!hasValidExt) {
      setValidationError('Unsupported file type. Supported formats are PDF, DOC, DOCX, PNG, JPG, and JPEG.');
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setValidationError(null);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(data.document);
      setTimeout(() => {
        navigate(`/processing/${data.document.id}`);
      }, 1000);
    } catch (err) {
      setValidationError(err.message || 'Unable to read this document.');
      setUploading(false);
    }
  };

  const handleGenerateSample = async () => {
    setUploading(true);
    try {
      const res = await fetch('/api/tests/generate-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.document) {
        navigate(`/processing/${data.document.id}`);
      } else {
        throw new Error(data.error || 'Failed to generate test document');
      }
    } catch (e) {
      setValidationError(e.message);
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      
      {/* Page Header with DocSenseAI Logo */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Logo size="md" linkTo="" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Upload Document</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload any report, contract, invoice, or scanned file for automated intelligence analysis.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all bg-white ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' 
            : 'border-slate-300 hover:border-blue-400 shadow-xs'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Drag and drop your document here, or{' '}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 underline font-bold cursor-pointer"
              >
                browse computer
              </button>
            </p>
            <p className="text-xs text-slate-500">
              Supports PDF, DOC, DOCX, PNG, JPG, and JPEG up to 50MB
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automatic validation: file type, magic byte structure, and OCR fallback</span>
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5">
            <p className="font-bold">Document Validation Failed</p>
            <p className="text-slate-600">{validationError}</p>
          </div>
        </div>
      )}

      {/* Selected File Details Card */}
      {selectedFile && !uploadSuccess && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 truncate max-w-md">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              Validated
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading & Validating...</span>
                </>
              ) : (
                <>
                  <span>Upload & Start Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Successful Upload State */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">Upload Successful!</p>
              <p className="text-xs text-slate-600">File validated and stored. Initializing analysis pipeline...</p>
            </div>
          </div>
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
        </div>
      )}

      {/* Quick Option: Load Test Document */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Don&apos;t have a document ready?</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-mono font-bold">3 Pages</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Generate a safe test agreement with deadlines, intentional math discrepancy, obligations, and missing appendix.
            </p>
          </div>
          <button
            onClick={handleGenerateSample}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Sample Report</span>
          </button>
        </div>
      </div>

    </div>
  );
}
