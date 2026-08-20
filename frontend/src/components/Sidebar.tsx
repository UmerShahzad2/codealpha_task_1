import React from 'react';
import {
  LayoutDashboard,
  Languages,
  Bot,
  Video,
  History,
  BarChart3,
  Settings,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'lingua_flow', label: 'LinguaFlow', icon: Languages, badge: 'NLP' },
    { id: 'faq_mind', label: 'FAQMind', icon: Bot, badge: 'AI' },
    { id: 'vision_track', label: 'VisionTrack', icon: Video, badge: 'CV' },
    { id: 'history', label: 'History Logs', icon: History, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-dark-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-accent to-brand-cyan flex items-center justify-center shadow-glow-brand">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wider text-slate-100 uppercase">NEXUS</span>
              <span className="text-xs text-brand-cyan font-mono block -mt-1 tracking-widest">AI LAB</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            AI Platform Suite
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/90 to-brand-700/80 text-white shadow-md border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-dark-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-cyan'
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-dark-800 text-slate-400 border-dark-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-dark-800 bg-dark-950/40">
        <div className="p-3 rounded-xl bg-dark-850 border border-dark-750">
          <div className="text-xs font-semibold text-slate-200">CodeAlpha Internship</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">AI Internship Project Suite</div>
          <div className="mt-2 text-[10px] text-brand-cyan font-mono flex items-center justify-between border-t border-dark-700/60 pt-2">
            <span>Module Status</span>
            <span className="text-emerald-400">100% Verified</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
