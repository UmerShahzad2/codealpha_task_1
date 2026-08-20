import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { HealthCheckData } from '../types';

interface LayoutProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  health: HealthCheckData | null;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeModule,
  setActiveModule,
  health,
  children
}) => {
  return (
    <div className="flex min-h-screen bg-dark-950 text-slate-100 font-sans">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar health={health} activeModule={activeModule} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
