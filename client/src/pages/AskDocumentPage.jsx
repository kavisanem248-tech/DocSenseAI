import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  Eye, 
  ArrowLeft
} from 'lucide-react';
import SourceBadge from '../components/SourceBadge';
import Logo from '../components/Logo';

const SAMPLE_QUESTIONS = [
  'What are the critical deadlines and milestones?',
  'What is the total financial value of this agreement?',
  'What obligations does Zenith Solutions Corp have?',
  'Are there any potential anomalies or inconsistencies?',
  'What information or attachments might be missing?',
  'What is this document mainly about?'
];

export default function AskDocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [doc, setDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [docRes, chatRes] = await Promise.all([
          fetch(`/api/documents/${id}`),
          fetch(`/api/documents/${id}/chat-history`)
        ]);

        if (docRes.ok) {
          const docData = await docRes.json();
          setDoc(docData.document);
        }

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const mapped = (chatData.history || []).flatMap(item => [
            { id: `${item.id}_q`, sender: 'user', text: item.question },
            { 
              id: `${item.id}_a`, 
              sender: 'assistant', 
              text: item.answer, 
              sources: item.sources,
              confidence: item.confidence 
            }
          ]);
          setMessages(mapped);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
      } finally {
        setFetchingHistory(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const botMsg = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        sources: data.sources || [],
        confidence: data.confidence
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `e_${Date.now()}`,
        sender: 'assistant',
        text: 'The document does not provide enough information to answer this.',
        sources: [],
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Header with DocSenseAI Logo */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-xs mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/dashboard/${id}`)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Logo size="xs" linkTo="" />

          <div className="border-l border-slate-200 pl-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-sm">
                Ask Your Document
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Grounded RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
              {doc ? doc.originalName : 'Query document facts with strict source citations'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/viewer/${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">View Document</span>
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        
        {/* Welcome Banner */}
        {messages.length === 0 && !fetchingHistory && (
          <div className="p-8 text-center space-y-4 max-w-lg mx-auto my-auto bg-white border border-slate-200 rounded-3xl shadow-xs">
            <div className="flex justify-center">
              <Logo size="md" linkTo="" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Ask Any Question About This Document</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understand Documents. Discover Insights. Verify Sources.
              </p>
            </div>
            
            <div className="pt-2 text-left space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggested queries:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-left text-[11px] p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div 
              key={m.id} 
              className={`flex gap-3 text-xs sm:text-sm animate-in fade-in ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2.5 ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {/* Source Citations */}
                {!isUser && m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Traceable Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((s, idx) => (
                        <SourceBadge 
                          key={idx} 
                          docId={id} 
                          page={s.page} 
                          section={s.section} 
                          text={s.quote} 
                          size="sm" 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-slate-500 flex items-center gap-2 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Retrieving source context and synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="relative shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about deadlines, payments, parties, or clauses..."
          className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
