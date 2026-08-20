import React, { useState } from 'react';
import { Settings, Sliders, ShieldCheck, Database, RefreshCw, Cpu } from 'lucide-react';
import { HealthCheckData } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  health: HealthCheckData | null;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ health, onShowToast }) => {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.45);
  const [targetLang, setTargetLang] = useState<string>('es');
  const [isReseeding, setIsReseeding] = useState<boolean>(false);

  const handleReseedDatabase = async () => {
    setIsReseeding(true);
    try {
      await api.faq.rebuildIndex();
      onShowToast('success', 'Database Reseeded', 'Reset knowledge base and reindexed NLP matrix.');
    } catch {
      onShowToast('error', 'Reseed Failed', 'Failed to reseed database.');
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500">
            <Settings className="w-6 h-6" />
          </div>
          <span>System Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure module defaults, confidence thresholds, and runtime parameters.
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-dark-750 space-y-6">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-dark-800 pb-3">
          <Sliders className="w-4 h-4 text-brand-cyan" />
          <span>AI Engine Thresholds</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-mono text-slate-300 mb-1.5">
              <span>FAQMind Similarity Threshold:</span>
              <span className="text-brand-cyan font-bold">{Math.round(similarityThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full accent-brand-cyan bg-dark-900 rounded-lg h-2"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Queries scoring below this threshold will trigger fallback responses and related FAQ suggestions.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Default Translation Target Language
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="zh">Chinese (zh)</option>
              <option value="ja">Japanese (ja)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-dark-750 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-dark-800 pb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Database & System Maintenance</span>
        </h3>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div>
            <h4 className="font-semibold text-slate-200">Reseed FAQ Knowledge Base</h4>
            <p className="text-slate-400 mt-0.5">
              Reset default FAQ questions and force rebuild of TF-IDF feature matrices.
            </p>
          </div>

          <button
            onClick={handleReseedDatabase}
            disabled={isReseeding}
            className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 font-semibold flex items-center space-x-2 transition-all self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'Reseeding...' : 'Reseed & Reindex'}</span>
          </button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-dark-750 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-dark-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <span>Environment Information</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800">
            <span className="text-slate-400 block text-[10px]">ENVIRONMENT</span>
            <span className="text-slate-200 mt-1 block font-bold">{health?.environment || 'development'}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800">
            <span className="text-slate-400 block text-[10px]">VERSION</span>
            <span className="text-slate-200 mt-1 block font-bold">{health?.version || '1.0.0'}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800">
            <span className="text-slate-400 block text-[10px]">DATABASE</span>
            <span className="text-emerald-400 mt-1 block font-bold">{health?.database || 'healthy'}</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800">
            <span className="text-slate-400 block text-[10px]">NLP ENGINE</span>
            <span className="text-brand-cyan mt-1 block font-bold">{health?.nlp_engine_ready ? 'INDEXED' : 'READY'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
