import React, { useState, useEffect } from 'react';
import {
  History,
  Languages,
  Bot,
  Video,
  Search,
  Trash2,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { TranslationResponse, ChatSession, DetectionSession } from '../types';

interface HistoryPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'translations' | 'chatbot' | 'vision'>('translations');
  const [search, setSearch] = useState('');

  const [translations, setTranslations] = useState<TranslationResponse[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [visionSessions, setVisionSessions] = useState<DetectionSession[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'translations') {
        const res = await api.translation.getHistory(search);
        setTranslations(res.items);
      } else if (activeTab === 'chatbot') {
        const res = await api.chatbot.getSessions();
        setChatSessions(res);
      } else if (activeTab === 'vision') {
        const res = await api.vision.getSessions();
        setVisionSessions(res);
      }
    } catch {
      onShowToast('error', 'Fetch Error', 'Failed to load history logs.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500">
              <History className="w-6 h-6" />
            </div>
            <span>Platform Activity History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Centralized activity log repository across LinguaFlow, FAQMind, and VisionTrack.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-dark-850 p-1 rounded-xl border border-dark-750 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('translations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'translations'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translations</span>
          </button>
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'chatbot'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>FAQ Chat Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'vision'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Vision Streams</span>
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-dark-750 overflow-hidden">
        <div className="p-4 border-b border-dark-800 flex items-center justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search history entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={loadData}
              className="w-full bg-dark-950/80 border border-dark-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'translations' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-dark-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-dark-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Pair</th>
                  <th className="px-5 py-3">Source Text</th>
                  <th className="px-5 py-3">Translated Output</th>
                  <th className="px-5 py-3">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 font-sans">
                {translations.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No translation records.</td></tr>
                ) : (
                  translations.map(t => (
                    <tr key={t.id} className="hover:bg-dark-900/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-dark-800 text-[10px] font-mono text-brand-cyan">
                          {t.source_lang.toUpperCase()} &rarr; {t.target_lang.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-xs truncate">{t.source_text}</td>
                      <td className="px-5 py-3 max-w-xs truncate text-slate-200">{t.translated_text}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{t.provider}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'chatbot' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-dark-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-dark-800">
                <tr>
                  <th className="px-5 py-3">Session ID</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Created At</th>
                  <th className="px-5 py-3">Messages Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 font-sans">
                {chatSessions.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No chat sessions.</td></tr>
                ) : (
                  chatSessions.map(s => (
                    <tr key={s.id} className="hover:bg-dark-900/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-brand-cyan">{s.id.substring(0, 12)}...</td>
                      <td className="px-5 py-3 font-medium text-slate-100">{s.title}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-slate-300">{s.messages ? s.messages.length : 0} msgs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'vision' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-dark-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-dark-800">
                <tr>
                  <th className="px-5 py-3">Session ID</th>
                  <th className="px-5 py-3">Source Type</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Total Frames</th>
                  <th className="px-5 py-3">Objects Tracked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800 font-sans">
                {visionSessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No vision session records.</td></tr>
                ) : (
                  visionSessions.map(v => (
                    <tr key={v.id} className="hover:bg-dark-900/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-400">#{v.id}</td>
                      <td className="px-5 py-3 font-mono text-emerald-400">{v.source_type}</td>
                      <td className="px-5 py-3 font-mono text-slate-300">{v.duration_seconds}s</td>
                      <td className="px-5 py-3 font-mono text-slate-300">{v.total_frames}</td>
                      <td className="px-5 py-3 font-mono text-brand-cyan">{v.total_objects_tracked}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
