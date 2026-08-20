import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'brand' | 'cyan' | 'emerald' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'brand'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'cyan':
        return 'text-brand-cyan border-brand-cyan/20 bg-brand-cyan/10';
      case 'emerald':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case 'amber':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      default:
        return 'text-brand-500 border-brand-500/20 bg-brand-500/10';
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl glass-card-hover relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-2 font-mono">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${getColorClasses()}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-dark-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Activity Trend</span>
          <span className="font-mono text-emerald-400">{trend}</span>
        </div>
      )}
    </div>
  );
};
