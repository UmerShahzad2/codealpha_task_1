import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsData } from '../types';

interface AnalyticsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onShowToast }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.analytics.get();
      setData(res);
    } catch {
      onShowToast('error', 'Analytics Error', 'Failed to fetch analytics metrics.');
    }
  };

  const moduleData = [
    { name: 'LinguaFlow', count: data?.total_translations || 0 },
    { name: 'FAQMind', count: data?.total_chat_sessions || 0 },
    { name: 'VisionTrack', count: data?.total_detection_sessions || 0 },
  ];

  const categoryPieData = Object.entries(data?.top_faq_categories || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span>Platform Performance Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated usage metrics, NLP match precision, and computer vision class distribution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-dark-750">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FAQ Match Accuracy</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">{data?.faq_match_rate || 100}%</h3>
              <p className="text-xs text-slate-400 mt-1">Confidence score threshold performance</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-750">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unmatched Queries</p>
              <h3 className="text-3xl font-extrabold text-rose-400 font-mono mt-2">{data?.unmatched_query_count || 0}</h3>
              <p className="text-xs text-slate-400 mt-1">Logged questions for KB expansion</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-750">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total System FAQs</p>
              <h3 className="text-3xl font-extrabold text-brand-cyan font-mono mt-2">{data?.total_faqs || 0}</h3>
              <p className="text-xs text-slate-400 mt-1">Indexed TF-IDF feature vectors</p>
            </div>
            <div className="p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-dark-750">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <span>AI Module Execution Frequency</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162032" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1d2a42', color: '#f8fafc' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-dark-750">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-brand-cyan" />
            <span>Top FAQ Knowledge Base Categories</span>
          </h3>

          <div className="h-64 flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <div className="text-xs text-slate-400">No category distribution data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1d2a42', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
