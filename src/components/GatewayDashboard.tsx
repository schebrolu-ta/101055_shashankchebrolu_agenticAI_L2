import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Clock,
  Coins,
  Cpu,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getGatewayStats, defaultGatewayConfig, GatewayConfig } from '../services/aiGateway';

export const GatewayDashboard: React.FC = () => {
  const [stats, setStats] = useState(getGatewayStats());
  const [config, setConfig] = useState<GatewayConfig>(defaultGatewayConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const refreshStats = () => {
    setStats(getGatewayStats());
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setStats(getGatewayStats());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Gateway Status: Operational
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            <span>AI Gateway Control Plane & Telemetry</span>
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Centralized policy governance, rate limiting, token telemetry, and model fallback routing for autonomous agents.
          </p>
        </div>

        <button
          onClick={refreshStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Gateway Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Requests</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-zinc-900">{stats.totalRequests}</span>
          <span className="text-2xs block text-zinc-400 mt-1">Governed by Gateway</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Latency</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-zinc-900">{stats.avgLatencyMs}ms</span>
          <span className="text-2xs block text-zinc-400 mt-1">End-to-end response time</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Tokens Consumed</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-zinc-900">{stats.totalTokens}</span>
          <span className="text-2xs block text-zinc-400 mt-1">Prompt + Completion</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Estimated Cost</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-zinc-900">${stats.estimatedCostUsd.toFixed(5)}</span>
          <span className="text-2xs block text-zinc-400 mt-1">Based on Gemini Flash rates</span>
        </div>
      </div>

      {/* Gateway Configuration & Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Tiger AI Gateway Configuration</span>
              </h3>
              <p className="text-2xs text-zinc-500 mt-0.5">Mandatory enterprise routing & auth parameters</p>
            </div>
            {saveSuccess && (
              <span className="text-2xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-700 font-medium mb-1">Gateway Base URL</label>
              <input
                type="text"
                value={config.gatewayBaseUrl}
                onChange={(e) => setConfig({ ...config, gatewayBaseUrl: e.target.value })}
                placeholder="https://ai-gateway.tigeranalytics.in/v1"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2 font-mono text-zinc-800 text-2xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-700 font-medium mb-1">User Email (Header)</label>
                <input
                  type="email"
                  value={config.userEmail || 'shashank.chebrolu@tigeranalytics.com'}
                  onChange={(e) => setConfig({ ...config, userEmail: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2 font-mono text-zinc-800 text-2xs"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-medium mb-1">Project ID (Header)</label>
                <input
                  type="text"
                  value={config.projectId || 'retail-agentic-ai-l2'}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2 font-mono text-zinc-800 text-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-medium mb-1">Routed Model Name</label>
              <select
                value={config.defaultModel}
                onChange={(e) => setConfig({ ...config, defaultModel: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2 font-mono text-zinc-800"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Standard Agentic)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Analytical)</option>
                <option value="azure/gpt-4o">azure/gpt-4o (Tiger Gateway Alias)</option>
                <option value="azure/gpt-4o-mini">azure/gpt-4o-mini (Tiger Fast Gateway)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-medium mb-1">Rate Limit (RPM)</label>
                <input
                  type="number"
                  value={config.rateLimitRpm}
                  onChange={(e) => setConfig({ ...config, rateLimitRpm: Number(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2 font-mono text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-medium mb-1">Rate Limit (TPM)</label>
                <input
                  type="number"
                  value={config.rateLimitTpm}
                  onChange={(e) => setConfig({ ...config, rateLimitTpm: Number(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-md p-2 font-mono text-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableGuardrails}
                  onChange={(e) => setConfig({ ...config, enableGuardrails: e.target.checked })}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-zinc-700 font-medium">Enforce Read-Only SQL Guardrails</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableSemanticCache}
                  onChange={(e) => setConfig({ ...config, enableSemanticCache: e.target.checked })}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-zinc-700 font-medium">Enable Semantic Response Cache</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium text-xs transition"
            >
              Update Policy Settings
            </button>
          </form>
        </div>

        {/* Live Audit Log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-zinc-900 font-mono">Gateway Request Audit Log</h3>
            </div>
            <span className="text-2xs text-zinc-500 font-mono">Real-time Telemetry</span>
          </div>

          <div className="flex-1 max-h-96 overflow-auto">
            {stats.logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 font-mono">
                No gateway requests recorded yet. Run a query in the Agent Console to generate live telemetry.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100 text-zinc-600 border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Model</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Tokens</th>
                    <th className="py-2 px-3">Tools</th>
                    <th className="py-2 px-3">Cache</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {stats.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50">
                      <td className="py-2 px-3 text-zinc-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-zinc-900 font-medium">{log.model}</td>
                      <td className="py-2 px-3">{log.latencyMs}ms</td>
                      <td className="py-2 px-3">{log.promptTokens + log.completionTokens}</td>
                      <td className="py-2 px-3">{log.toolCallsCount}</td>
                      <td className="py-2 px-3">
                        {log.cacheHit ? (
                          <span className="text-emerald-700 font-semibold">HIT</span>
                        ) : (
                          <span className="text-zinc-400">MISS</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-2xs ${
                            log.status.includes('200')
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
