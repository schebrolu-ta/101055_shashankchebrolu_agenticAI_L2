import React from 'react';
import { Bot, Database, BookOpen, Activity, Terminal, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'agent' | 'guide' | 'data' | 'sql' | 'gateway';
  setActiveTab: (tab: 'agent' | 'guide' | 'data' | 'sql' | 'gateway') => void;
  hasLiveGemini: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hasLiveGemini }) => {
  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 text-lg leading-tight tracking-tight">
                  Retail Agentic AI
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  L2 Assignment
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal">
                AI Gateway · Suggested Tools · ReAct Reasoning · Enterprise Telemetry
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'agent'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Agent Console</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'guide'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Step-by-Step Solution</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'data'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Dataset Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'sql'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>SQL Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'gateway'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>AI Gateway</span>
            </button>
          </nav>

          {/* Status pill & Submission Download */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="/101055_shashank_chebrolu_agenticAI_L2.zip"
              download="101055_shashank_chebrolu_agenticAI_L2.zip"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md shadow-xs transition"
              title="Download submission zip (101055_shashank_chebrolu_agenticAI_L2.zip)"
            >
              <span>Download 101055 Submission .ZIP</span>
            </a>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 border border-zinc-200 px-2.5 py-1 rounded bg-zinc-50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DB Active &amp; Loaded</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
