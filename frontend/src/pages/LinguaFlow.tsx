import React, { useState, useEffect } from 'react';
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  Mic,
  MicOff,
  Download,
  Trash2,
  Search,
  RotateCcw,
  Sparkles,
  History,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { TranslationResponse, TranslationHistoryResponse } from '../types';

interface LinguaFlowProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const LinguaFlow: React.FC<LinguaFlowProps> = ({ onShowToast }) => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('deep_translator');

  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [historyItems, setHistoryItems] = useState<TranslationResponse[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    loadLanguages();
    loadHistory();
  }, []);

  const loadLanguages = async () => {
    try {
      const langMap = await api.translation.getLanguages();
      setLanguages(langMap);
    } catch {
      onShowToast('error', 'Language Error', 'Failed to fetch supported languages.');
    }
  };

  const loadHistory = async (query = '') => {
    try {
      const res: TranslationHistoryResponse = await api.translation.getHistory(query, 20);
      setHistoryItems(res.items);
    } catch {
      onShowToast('error', 'History Error', 'Failed to load translation history.');
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      onShowToast('info', 'Empty Input', 'Please enter text to translate.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.translation.translate(sourceText, sourceLang, targetLang, provider);
      setTranslatedText(res.translated_text);
      if (res.detected_source) {
        setDetectedSource(res.detected_source);
      } else {
        setDetectedSource(null);
      }
      setProvider(res.provider);
      onShowToast('success', 'Translation Complete', `Translated via ${res.provider}`);
      loadHistory(historySearch);
    } catch {
      onShowToast('error', 'Translation Failed', 'Could not process translation request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const prevSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prevSource);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('success', 'Copied to Clipboard', 'Text successfully copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  const BCP47_MAP: Record<string, string> = {
    en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT',
    pt: 'pt-BR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP',
    ko: 'ko-KR', ar: 'ar-SA', hi: 'hi-IN', tr: 'tr-TR', pl: 'pl-PL',
    uk: 'uk-UA', sv: 'sv-SE', no: 'no-NO', fi: 'fi-FI', da: 'da-DK',
    cs: 'cs-CZ', el: 'el-GR', he: 'he-IL', id: 'id-ID', vi: 'vi-VN',
    th: 'th-TH', ro: 'ro-RO', hu: 'hu-HU'
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!text || !text.trim()) return;

    const targetCode = lang === 'auto' ? (detectedSource || 'en') : lang;
    const ttsUrl = `/api/v1/translate/tts?text=${encodeURIComponent(text.trim())}&lang=${encodeURIComponent(targetCode)}`;

    const audio = new Audio(ttsUrl);
    audio.play().catch(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const bcp47 = BCP47_MAP[targetCode] || 'en-US';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = bcp47;
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const match = voices.find(v => v.lang.toLowerCase() === bcp47.toLowerCase()) ||
                        voices.find(v => v.lang.toLowerCase().startsWith(targetCode.toLowerCase()));
          if (match) utterance.voice = match;
        }
        window.speechSynthesis.speak(utterance);
      } else {
        onShowToast('info', 'TTS Note', 'Could not play audio synthesis stream.');
      }
    });
  };

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('error', 'STT Unsupported', 'Browser Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = sourceLang === 'auto' ? 'en-US' : sourceLang;

      recognition.onstart = () => {
        setIsRecording(true);
        onShowToast('info', 'Listening', 'Speak now into your microphone...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        onShowToast('error', 'Speech Error', 'Failed to capture speech input.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      onShowToast('error', 'STT Failure', 'Could not initialize speech recorder.');
    }
  };

  const handleExportTxt = () => {
    if (!translatedText) return;
    const content = `NEXUS LINGUAFLOW TRANSLATION EXPORT\nDate: ${new Date().toLocaleString()}\nSource (${sourceLang}): ${sourceText}\nTarget (${targetLang}): ${translatedText}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Export Complete', 'Saved translation to TXT file.');
  };

  const handleDeleteHistoryItem = async (id: number) => {
    try {
      await api.translation.deleteHistoryItem(id);
      loadHistory(historySearch);
      onShowToast('info', 'Deleted Record', 'History entry removed.');
    } catch {
      onShowToast('error', 'Delete Failed', 'Could not delete history item.');
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.translation.clearHistory();
      setHistoryItems([]);
      onShowToast('info', 'History Cleared', 'All translation logs removed.');
    } catch {
      onShowToast('error', 'Clear Failed', 'Could not clear translation history.');
    }
  };

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const charCount = sourceText.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500">
              <Languages className="w-6 h-6" />
            </div>
            <span>LinguaFlow Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multilingual neural translation engine with automatic language detection and history persistence.
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-750 text-xs font-semibold text-slate-300 flex items-center space-x-2 transition-all"
        >
          <History className="w-4 h-4 text-brand-cyan" />
          <span>{showHistory ? 'Hide History Panel' : 'Show History Panel'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`space-y-6 ${showHistory ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="glass-card p-4 rounded-2xl border border-dark-750 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">From:</span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-dark-900 border border-dark-750 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none w-full"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} {code === 'auto' ? '(Auto)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapLanguages}
              disabled={sourceLang === 'auto'}
              title={sourceLang === 'auto' ? 'Cannot swap auto-detect' : 'Swap languages'}
              className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 text-brand-cyan" />
            </button>

            <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">To:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-dark-900 border border-dark-750 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none w-full"
              >
                {Object.entries(languages)
                  .filter(([code]) => code !== 'auto')
                  .map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-2xl border border-dark-750 flex flex-col justify-between h-[340px]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Source Text</span>
                    {detectedSource && sourceLang === 'auto' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-cyan border border-brand-500/30">
                        Detected: {languages[detectedSource] || detectedSource}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={toggleSpeechRecognition}
                      title="Speech-to-Text Voice Input"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isRecording
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse-subtle'
                          : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleSpeak(sourceText, sourceLang)}
                      disabled={!sourceText}
                      title="Listen Source Audio"
                      className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') handleTranslate();
                  }}
                  placeholder="Enter or paste text here to translate... (Ctrl + Enter)"
                  className="w-full h-52 bg-dark-950/60 border border-dark-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500/60 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-dark-800 text-xs font-mono text-slate-400">
                <span>{charCount} chars | {wordCount} words</span>
                <button
                  onClick={() => setSourceText('')}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear Text
                </button>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-dark-750 flex flex-col justify-between h-[340px]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Translation Output</span>
                    {provider && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-400 border border-dark-750">
                        {provider}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleSpeak(translatedText, targetLang)}
                      disabled={!translatedText}
                      title="Listen Audio"
                      className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(translatedText)}
                      disabled={!translatedText}
                      title="Copy Output"
                      className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleExportTxt}
                      disabled={!translatedText}
                      title="Export as TXT"
                      className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-52 bg-dark-950/60 border border-dark-800 rounded-xl p-3 text-sm text-slate-100 overflow-y-auto font-sans leading-relaxed">
                  {translatedText ? (
                    translatedText
                  ) : (
                    <span className="text-slate-400 italic">Translated output will appear here...</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-dark-800">
                <button
                  onClick={handleTranslate}
                  disabled={isLoading || !sourceText.trim()}
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-brand"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Translating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Translate Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showHistory && (
          <div className="glass-card p-5 rounded-2xl border border-dark-750 flex flex-col justify-between h-[420px] lg:h-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <History className="w-4 h-4 text-brand-cyan" />
                  <span>Translation History</span>
                </h3>
                {historyItems.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    loadHistory(e.target.value);
                  }}
                  className="w-full bg-dark-950/80 border border-dark-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500/60 font-sans"
                />
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
                {historyItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No translation history found.
                  </div>
                ) : (
                  historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-dark-900/60 border border-dark-800 hover:border-dark-750 transition-colors group relative"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span className="text-brand-cyan">
                          {item.source_lang.toUpperCase()} &rarr; {item.target_lang.toUpperCase()}
                        </span>
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium line-clamp-1">{item.source_text}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.translated_text}</p>
                      <button
                        onClick={() => item.id && handleDeleteHistoryItem(item.id)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
