import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  Sparkles,
  Sliders,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { ChatSession, ChatMessage, FAQItem, FAQCreateInput } from '../types';
import { Modal } from '../components/Modal';

interface FAQMindProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const FAQMind: React.FC<FAQMindProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'admin'>('chat');

  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<string>('');
  const [isRebuildingIndex, setIsRebuildingIndex] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState<FAQCreateInput>({
    question: '',
    answer: '',
    category: 'General',
    keywords: ''
  });

  useEffect(() => {
    initChatSessions();
    loadFaqs();
    loadCategories();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  const initChatSessions = async () => {
    try {
      const list = await api.chatbot.getSessions();
      setSessions(list);
      if (list.length > 0) {
        setSessionId(list[0].id);
        loadSessionDetails(list[0].id);
      } else {
        createNewSession();
      }
    } catch {
      createNewSession();
    }
  };

  const createNewSession = async () => {
    try {
      const session = await api.chatbot.createSession('New FAQ Query Session');
      setSessions(prev => [session, ...prev]);
      setSessionId(session.id);
      setCurrentMessages([]);
    } catch {
      const fallbackId = `session_${Date.now()}`;
      setSessionId(fallbackId);
      setCurrentMessages([]);
    }
  };

  const loadSessionDetails = async (id: string) => {
    try {
      const data = await api.chatbot.getSession(id);
      setCurrentMessages(data.messages);
    } catch {
      setCurrentMessages([]);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    if (!customText) setInputMessage('');
    setIsTyping(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      session_id: sessionId,
      sender: 'user',
      message: textToSend.trim(),
      timestamp: new Date().toISOString()
    };
    setCurrentMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await api.chatbot.query(sessionId, textToSend.trim(), categoryFilter || undefined);
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: sessionId,
        sender: 'bot',
        message: response.bot_response,
        confidence: response.confidence,
        intent_category: response.intent_category,
        timestamp: response.timestamp
      };
      setCurrentMessages(prev => [...prev, botMsg]);
    } catch {
      onShowToast('error', 'Query Error', 'Failed to process question match.');
    } finally {
      setIsTyping(false);
    }
  };

  const loadFaqs = async () => {
    try {
      const list = await api.faq.list(faqSearch, selectedAdminCategory);
      setFaqs(list);
    } catch {
      onShowToast('error', 'Fetch Error', 'Failed to load FAQ items.');
    }
  };

  const loadCategories = async () => {
    try {
      const catList = await api.faq.getCategories();
      setCategories(catList);
    } catch {
      setCategories(['General', 'LinguaFlow', 'FAQMind', 'VisionTrack', 'API & Security']);
    }
  };

  const handleRebuildIndex = async () => {
    setIsRebuildingIndex(true);
    try {
      const res = await api.faq.rebuildIndex();
      onShowToast('success', 'Index Rebuilt', res.message);
    } catch {
      onShowToast('error', 'Rebuild Failed', 'Could not rebuild NLP index.');
    } finally {
      setIsRebuildingIndex(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '', category: 'General', keywords: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FAQItem) => {
    setEditingFaq(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      keywords: item.keywords || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      onShowToast('info', 'Validation Error', 'Question and answer are required.');
      return;
    }

    try {
      if (editingFaq) {
        await api.faq.update(editingFaq.id, formData);
        onShowToast('success', 'FAQ Updated', 'FAQ item updated successfully.');
      } else {
        await api.faq.create(formData);
        onShowToast('success', 'FAQ Created', 'New FAQ item added to database.');
      }
      setIsModalOpen(false);
      loadFaqs();
      loadCategories();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save FAQ item.';
      onShowToast('error', 'Save Failed', msg);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    try {
      await api.faq.delete(id);
      onShowToast('info', 'FAQ Deleted', 'FAQ item removed from database.');
      loadFaqs();
    } catch {
      onShowToast('error', 'Delete Failed', 'Could not delete FAQ item.');
    }
  };

  const handleExportSession = () => {
    if (currentMessages.length === 0) return;
    const exportText = currentMessages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.message}`).join('\n\n');
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faqmind_chat_${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Export Complete', 'Chat transcript exported to TXT file.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan">
              <Bot className="w-6 h-6" />
            </div>
            <span>FAQMind Intelligent Assistant</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            NLP TF-IDF & Cosine Similarity FAQ engine with confidence scoring and fallback suggestions.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto bg-dark-850 p-1 rounded-xl border border-dark-750">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chat Assistant
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Knowledge Base Admin
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="glass-card p-4 rounded-2xl border border-dark-750 flex flex-col justify-between h-[520px] order-2 lg:order-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Chat Sessions</span>
                <button
                  onClick={createNewSession}
                  className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSessionId(s.id);
                      loadSessionDetails(s.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      s.id === sessionId
                        ? 'bg-brand-600/20 border-brand-500/40 text-slate-100 font-semibold'
                        : 'bg-dark-900/60 border-dark-800 text-slate-400 hover:bg-dark-850'
                    }`}
                  >
                    <div className="truncate">{s.title || 'Chat Session'}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 glass-card p-5 rounded-2xl border border-dark-750 flex flex-col justify-between h-[520px] order-1 lg:order-2">
            <div>
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-dark-800 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                  <span className="text-xs font-bold text-slate-200">FAQMind Active Session</span>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-dark-900 border border-dark-750 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportSession}
                    disabled={currentMessages.length === 0}
                    title="Export Transcript"
                    className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-400 hover:text-slate-200 disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 my-3 rounded-xl bg-dark-900/40 border border-dark-800 flex items-center space-x-2 text-xs text-slate-400 overflow-x-auto">
                <span className="font-semibold text-slate-300 shrink-0">Quick Topics:</span>
                {['What is Nexus AI Lab?', 'LinguaFlow features', 'VisionTrack model', 'API security'].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full bg-dark-800 hover:bg-brand-600/30 text-slate-300 border border-dark-700 text-[11px] shrink-0 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="space-y-4 overflow-y-auto h-[320px] pr-2">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                    <HelpCircle className="w-8 h-8 text-brand-cyan mx-auto opacity-40" />
                    <p>Ask a question about Nexus AI Lab, LinguaFlow, or VisionTrack.</p>
                  </div>
                ) : (
                  currentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-dark-900/80 border border-dark-800 text-slate-200 rounded-bl-none'
                      }`}>
                        {msg.sender === 'bot' && msg.confidence !== undefined && (
                          <div className="flex items-center justify-between text-[10px] font-mono border-b border-dark-800 pb-1.5 mb-2">
                            <span className="text-slate-400">Category: {msg.intent_category || 'General'}</span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${
                              msg.confidence >= 0.7
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : msg.confidence >= 0.45
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              Confidence: {Math.round(msg.confidence * 100)}%
                            </span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <div className="text-[9px] font-mono text-slate-400 mt-1.5 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 text-white flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isTyping && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                    <Bot className="w-4 h-4 text-brand-cyan animate-pulse-subtle" />
                    <span>FAQMind is processing vector matrix...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="pt-3 border-t border-dark-800 flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask FAQMind a question about the platform..."
                className="flex-1 bg-dark-950/80 border border-dark-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-cyan"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-dark-750 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search FAQ database..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  onKeyUp={loadFaqs}
                  className="w-full bg-dark-950/80 border border-dark-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <select
                value={selectedAdminCategory}
                onChange={(e) => {
                  setSelectedAdminCategory(e.target.value);
                  loadFaqs();
                }}
                className="bg-dark-900 border border-dark-750 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRebuildIndex}
                disabled={isRebuildingIndex}
                className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRebuildingIndex ? 'animate-spin' : ''}`} />
                <span>Rebuild NLP Index</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-glow-brand"
              >
                <Plus className="w-4 h-4" />
                <span>Add New FAQ</span>
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-dark-750 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-dark-800">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Question</th>
                    <th className="px-5 py-3">Answer Summary</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {faqs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        No FAQ items found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    faqs.map(item => (
                      <tr key={item.id} className="hover:bg-dark-900/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-slate-400">#{item.id}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-[10px] font-mono text-brand-cyan">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-100">{item.question}</td>
                        <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{item.answer}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(item.id)}
                              className="p-1.5 rounded-lg bg-dark-850 hover:bg-rose-950 text-rose-400 border border-dark-750 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? 'Edit FAQ Knowledge Base Item' : 'Add New FAQ Item'}
      >
        <form onSubmit={handleSaveFaq} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. General, LinguaFlow, VisionTrack"
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Question
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter question text..."
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Answer
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Enter comprehensive answer text..."
              rows={4}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Keywords (Optional)
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="comma separated tags for NLP vector weighting..."
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-cyan font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-dark-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand"
            >
              Save FAQ Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
