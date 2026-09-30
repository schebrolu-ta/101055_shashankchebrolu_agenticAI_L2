import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentWorkspace } from './components/AgentWorkspace';
import { AssignmentGuide } from './components/AssignmentGuide';
import { DataExplorer } from './components/DataExplorer';
import { SqlSandbox } from './components/SqlSandbox';
import { GatewayDashboard } from './components/GatewayDashboard';
import { initDatabase } from './services/toolEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'agent' | 'guide' | 'data' | 'sql' | 'gateway'>('agent');
  const [hasLiveGemini, setHasLiveGemini] = useState(false);

  useEffect(() => {
    initDatabase();
    fetch('/api/gateway/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasLiveGemini) {
          setHasLiveGemini(true);
        }
      })
      .catch(() => {
        // Local mode
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasLiveGemini={hasLiveGemini}
      />

      <main className="flex-1">
        {activeTab === 'agent' && <AgentWorkspace />}
        {activeTab === 'guide' && <AssignmentGuide />}
        {activeTab === 'data' && <DataExplorer />}
        {activeTab === 'sql' && <SqlSandbox />}
        {activeTab === 'gateway' && <GatewayDashboard />}
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">Agentic AI Assignment - Level 2 Solution</span>
            <span>·</span>
            <span>AI Gateway Governed Retail System</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-2xs">
            <span>Orders: 360</span>
            <span>·</span>
            <span>Returns: 46</span>
            <span>·</span>
            <span>Customers: 80</span>
            <span>·</span>
            <span>Products: 10</span>
            <span>·</span>
            <span>Stores: 15</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
