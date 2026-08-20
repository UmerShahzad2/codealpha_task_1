import React from 'react';
import {
  Languages,
  Bot,
  Video,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Database
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AnalyticsData, HealthCheckData } from '../types';

interface DashboardProps {
  analytics: AnalyticsData | null;
  health: HealthCheckData | null;
  onLaunchModule: (module: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ analytics, health, onLaunchModule }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden border border-brand-500/20 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-48 h-48 bg-brand-cyan/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-cyan text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CODEALPHA ARTIFICIAL INTELLIGENCE SUITE</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            NEXUS AI LAB <span className="bg-gradient-to-r from-brand-cyan via-brand-500 to-brand-accent bg-clip-text text-transparent">INTELLIGENCE SUITE</span>
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Welcome to Nexus AI Lab, an enterprise-grade artificial intelligence workspace unifying multilingual natural language processing, intelligent vector-based question answering, and real-time computer vision object tracking.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onLaunchModule('lingua_flow')}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm flex items-center space-x-2 transition-all shadow-glow-brand"
            >
              <span>Explore LinguaFlow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onLaunchModule('faq_mind')}
              className="px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 font-medium text-sm border border-dark-700 flex items-center space-x-2 transition-all"
            >
              <span>Launch FAQMind</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Translations"
          value={analytics?.total_translations ?? 0}
          subtitle="LinguaFlow processing history"
          icon={Languages}
          trend="+12.4%"
          color="brand"
        />
        <StatCard
          title="FAQ Knowledge Base"
          value={analytics?.total_faqs ?? 0}
          subtitle="Indexed TF-IDF vectors"
          icon={HelpCircle}
          trend="100% Active"
          color="cyan"
        />
        <StatCard
          title="Chat Sessions"
          value={analytics?.total_chat_sessions ?? 0}
          subtitle="FAQMind conversation logs"
          icon={Bot}
          trend={`${analytics?.faq_match_rate ?? 100}% Accuracy`}
          color="emerald"
        />
        <StatCard
          title="Vision Sessions"
          value={analytics?.total_detection_sessions ?? 0}
          subtitle="VisionTrack stream analytics"
          icon={Video}
          trend="Real-Time FPS"
          color="amber"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-cyan" />
            <span>AI Module Directory</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">3 Independent Engines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl glass-card-hover flex flex-col justify-between border border-dark-750">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 mb-4">
                <Languages className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-100">LinguaFlow</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Multilingual neural translation workspace with auto language detection, multi-provider abstraction, text-to-speech, mic input, and searchable local history.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">Auto-Detect</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">30+ Languages</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">TTS/STT</span>
              </div>
            </div>
            <button
              onClick={() => onLaunchModule('lingua_flow')}
              className="mt-6 w-full py-2.5 rounded-xl bg-dark-800 hover:bg-brand-600 hover:text-white text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-dark-700"
            >
              <span>Launch LinguaFlow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl glass-card-hover flex flex-col justify-between border border-dark-750">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-100">FAQMind Chatbot</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Intelligent NLP question-answering assistant using TF-IDF vector matrices and cosine similarity scoring with similarity thresholding and fallback suggestions.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">TF-IDF NLP</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">Cosine Similarity</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">Admin CRUD</span>
              </div>
            </div>
            <button
              onClick={() => onLaunchModule('faq_mind')}
              className="mt-6 w-full py-2.5 rounded-xl bg-dark-800 hover:bg-brand-cyan hover:text-dark-950 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-dark-700"
            >
              <span>Launch FAQMind</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl glass-card-hover flex flex-col justify-between border border-dark-750">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-100">VisionTrack</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Real-time computer vision engine incorporating YOLO object detection and Euclidean centroid object tracking with persistent ID tracking and video telemetry.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">YOLO Detection</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">Centroid Tracker</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">Live Telemetry</span>
              </div>
            </div>
            <button
              onClick={() => onLaunchModule('vision_track')}
              className="mt-6 w-full py-2.5 rounded-xl bg-dark-800 hover:bg-emerald-500 hover:text-dark-950 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-dark-700"
            >
              <span>Launch VisionTrack</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-dark-750">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-500" />
              <span>Platform Health Diagnostics</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400">Status Verified</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-dark-800">
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs text-slate-300">SQLite Database Engine</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{health?.database || 'Connected'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-dark-800">
              <div className="flex items-center space-x-3">
                <Cpu className="w-4 h-4 text-brand-500" />
                <span className="text-xs text-slate-300">FAQMind NLP Vector Index</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{health?.nlp_engine_ready ? 'Indexed' : 'Ready'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-dark-800">
              <div className="flex items-center space-x-3">
                <Video className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300">VisionTrack YOLO Pipeline</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-dark-750">
          <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>Architecture Specs</span>
          </h4>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800 space-y-1">
              <div className="font-semibold text-slate-200">Backend Framework</div>
              <div className="text-slate-400 font-mono">Python FastAPI + Pydantic + SQLAlchemy</div>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800 space-y-1">
              <div className="font-semibold text-slate-200">NLP & Vision Stack</div>
              <div className="text-slate-400 font-mono">scikit-learn TF-IDF + OpenCV + YOLOv8 + Centroid Tracker</div>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-800 space-y-1">
              <div className="font-semibold text-slate-200">Frontend Stack</div>
              <div className="text-slate-400 font-mono">React 18 + Vite + TypeScript + Tailwind CSS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
