import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LinguaFlow } from './pages/LinguaFlow';
import { FAQMind } from './pages/FAQMind';
import { VisionTrack } from './pages/VisionTrack';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { api } from './services/api';
import { AnalyticsData, HealthCheckData } from './types';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    fetchHealthAndAnalytics();
    const interval = setInterval(fetchHealthAndAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthAndAnalytics = async () => {
    try {
      const healthData = await api.health.check();
      setHealth(healthData);
      const analyticsData = await api.analytics.get();
      setAnalytics(analyticsData);
    } catch {
      // quiet fallback
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <Dashboard
            analytics={analytics}
            health={health}
            onLaunchModule={(mod) => setActiveModule(mod)}
          />
        );
      case 'lingua_flow':
        return <LinguaFlow onShowToast={showToast} />;
      case 'faq_mind':
        return <FAQMind onShowToast={showToast} />;
      case 'vision_track':
        return <VisionTrack onShowToast={showToast} />;
      case 'history':
        return <HistoryPage onShowToast={showToast} />;
      case 'analytics':
        return <AnalyticsPage onShowToast={showToast} />;
      case 'settings':
        return <SettingsPage health={health} onShowToast={showToast} />;
      default:
        return (
          <Dashboard
            analytics={analytics}
            health={health}
            onLaunchModule={(mod) => setActiveModule(mod)}
          />
        );
    }
  };

  return (
    <Layout
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      health={health}
    >
      {renderActiveModule()}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </Layout>
  );
};

export default App;
