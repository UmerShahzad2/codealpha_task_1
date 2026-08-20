import React from 'react';
import { Cpu, ShieldCheck, Activity } from 'lucide-react';
import { HealthCheckData } from '../types';

interface NavbarProps {
  health: HealthCheckData | null;
  activeModule: string;
}

export const Navbar: React.FC<NavbarProps> = ({ health, activeModule }) => {
  const getModuleTitle = (mod: string) => {
    switch (mod) {
      case 'dashboard': return 'Executive AI Dashboard';
      case 'lingua_flow': return 'LinguaFlow — Translation Workspace';
      case 'faq_mind': return 'FAQMind — Intelligent FAQ Assistant';
      case 'vision_track': return 'VisionTrack — Object Detection & Tracking';
      case 'history': return 'Platform Activity History';
      case 'analytics': return 'Performance & Analytics Engine';
      case 'settings': return 'System Configuration & Preferences';
      default: return 'Nexus AI Lab';
    }
  };

  const isOperational = health?.status === 'operational';

  return (
    <header className="h-16 border-b border-dark-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center text-white shadow-glow-cyan">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide">
              {getModuleTitle(activeModule)}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              NEXUS AI PLATFORM v1.0.0
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-2 bg-dark-850 px-3 py-1.5 rounded-full border border-dark-750 text-xs">
          <Activity className="w-3.5 h-3.5 text-brand-cyan animate-pulse-subtle" />
          <span className="text-slate-400">System Status:</span>
          <span className={`font-medium ${isOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOperational ? 'Operational' : 'Initializing'}
          </span>
        </div>

        <div className="flex items-center space-x-2 bg-dark-850 px-3 py-1.5 rounded-full border border-dark-750 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
          <span className="font-mono text-slate-400">Security Mode:</span>
          <span className="text-slate-200 font-medium">Enterprise</span>
        </div>
      </div>
    </header>
  );
};
