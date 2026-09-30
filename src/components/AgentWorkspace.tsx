import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  Coins,
  Shield,
  CheckCircle2,
  Code,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { AgentRunResult, runLocalAgent, defaultGatewayConfig } from '../services/aiGateway';
import { SUGGESTED_TOOLS } from '../services/toolEngine';

interface AgentWorkspaceProps {
  onExecuteQuery?: (query: string) => Promise<AgentRunResult>;
}

const PRESET_QUERIES = [
  {
    title: 'Product Return Rates & Lost Revenue',
    query: 'Analyze which products have the highest return rate, total lost revenue, and the leading causes for returns across categories using products.csv and returns.csv.',
    tag: '/data/products.csv',
  },
  {
    title: 'Customer Segment LTV & Net Profitability',
    query: 'Compare customer segment performance (Regular, Budget, Premium, Wholesale) in terms of order count, gross revenue, returns loss, and net realized revenue from customers.csv.',
    tag: '/data/customers.csv',
  },
  {
    title: 'Omnichannel & Delivery Fulfillment',
    query: 'Compare Online, Mobile App, In-store, and Partner channels to identify return frequency and dominant return reasons per channel in orders.csv.',
    tag: '/data/orders.csv',
  },
  {
    title: 'Store Performance & Regional Breakdown',
    query: 'Identify the top revenue generating stores, regional return rates across North, South, East, West, and Central using stores.csv.',
    tag: '/data/stores.csv',
  },
  {
    title: 'Late Delivery & Quality Returns Intervention',
    query: 'Find all orders in returns.csv that suffered Late Delivery or Damaged returns, identifying the impacted customers and recommended operational remedies.',
    tag: '/data/returns.csv',
  },
];

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [selectedToolDetails, setSelectedToolDetails] = useState<string | null>(null);

  const handleRun = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    setLoading(true);
    try {
      // Send to server endpoint
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, config: defaultGatewayConfig }),
      });

      if (res.ok) {
        const json = await res.json();
        setResult(json.data);
      } else {
        // Fallback to local in-browser agent
        const localRes = runLocalAgent(q, defaultGatewayConfig);
        setResult(localRes);
      }
    } catch {
      const localRes = runLocalAgent(q, defaultGatewayConfig);
      setResult(localRes);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-indigo-950 text-white rounded-xl p-6 mb-8 border border-zinc-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Framework: LangGraph StateGraph
              </span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Database: MySQL (retail_db)
              </span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                LLM: Tiger AI Gateway
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Retail SQL Data Analyst Agent (LangGraph + MySQL)
            </h1>
            <p className="text-sm text-zinc-300 max-w-2xl mt-1">
              Natural Language SQL Agent that generates safe MySQL SELECT queries, validates read-only security, executes via <code>mysql-connector-python</code>, maintains conversation memory for follow-ups, and grounds business answers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">Available Suggested Tools:</span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOOLS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedToolDetails(selectedToolDetails === t.name ? null : t.name)}
                  className="text-xs font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition"
                  title={t.description}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tool Details Modal/Drawer */}
        {selectedToolDetails && (
          <div className="mt-4 p-4 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-zinc-300 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-400">{selectedToolDetails}() Tool Specification</span>
              <button
                onClick={() => setSelectedToolDetails(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-zinc-400 mb-2">
              {SUGGESTED_TOOLS.find((t) => t.name === selectedToolDetails)?.description}
            </p>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <span className="text-zinc-400">Parameters:</span>
              <pre className="mt-1 text-emerald-400 overflow-x-auto">
                {JSON.stringify(
                  SUGGESTED_TOOLS.find((t) => t.name === selectedToolDetails)?.parameters,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Preset Assignment Scenarios */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Preset Assignment Benchmark Scenarios</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(preset.query);
                handleRun(preset.query);
              }}
              className="text-left p-3.5 rounded-lg border border-zinc-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-indigo-600 font-mono">{preset.tag}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 line-clamp-1">{preset.title}</p>
              <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{preset.query}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRun();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask the Agent (e.g. Which product has the highest return rate and what are the top reasons?)"
              className="w-full px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Agent Reasoning...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Agent</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* AI Gateway Telemetry Header */}
          <div className="bg-zinc-900 text-white rounded-xl p-4 border border-zinc-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-400">Gateway Route:</span>
                <span className="text-white font-semibold">{result.gatewayLog.model}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-emerald-400">{result.gatewayLog.status}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Latency: {result.totalDurationMs}ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Tokens: {result.gatewayLog.promptTokens + result.gatewayLog.completionTokens}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Cost: ${result.gatewayLog.costEstimated.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Cache: {result.gatewayLog.cacheHit ? 'HIT (0ms)' : 'MISS'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ReAct Execution Steps & Tool Calls */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-zinc-900">
                  Step-by-Step ReAct Trace ({result.steps.length} steps)
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                Plan → Tool Selection → Execution → Observation
              </span>
            </div>

            <div className="space-y-4">
              {result.steps.map((step) => {
                const isExpanded = expandedSteps[step.stepNumber] !== false;
                return (
                  <div
                    key={step.stepNumber}
                    className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/50"
                  >
                    <button
                      onClick={() => toggleStep(step.stepNumber)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-zinc-100/70 hover:bg-zinc-100 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <div>
                          <span className="text-xs font-semibold uppercase text-zinc-500 mr-2">Thought</span>
                          <span className="text-xs text-zinc-800 font-medium">{step.thought}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.toolCall && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">
                            Tool: {step.toolCall.name}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-white border-t border-zinc-200 text-xs">
                        {/* Tool Call Arguments */}
                        {step.toolCall && (
                          <div className="bg-zinc-900 text-zinc-200 p-3 rounded-md font-mono">
                            <div className="flex items-center justify-between text-zinc-400 mb-1">
                              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                                <Code className="w-3.5 h-3.5" />
                                Invoking Tool: {step.toolCall.name}()
                              </span>
                              <span>Args</span>
                            </div>
                            <pre className="overflow-x-auto text-emerald-400">
                              {JSON.stringify(step.toolCall.args, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Tool Result Data */}
                        {step.toolResult && (
                          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-md">
                            <div className="flex items-center justify-between text-zinc-600 mb-2 font-mono">
                              <span className="flex items-center gap-1 font-semibold text-zinc-800">
                                <Database className="w-3.5 h-3.5 text-indigo-600" />
                                Tool Output ({step.toolResult.executionTimeMs}ms)
                              </span>
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Status: {step.toolResult.status}
                              </span>
                            </div>
                            <div className="max-h-48 overflow-y-auto bg-white p-2 rounded border border-zinc-200 font-mono text-zinc-800 text-2xs">
                              <pre className="overflow-x-auto">
                                {JSON.stringify(step.toolResult.output, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Observation */}
                        {step.observation && (
                          <div className="p-2.5 rounded bg-indigo-50/50 border border-indigo-100 text-indigo-950 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold mr-1">Agent Observation:</span>
                              <span>{step.observation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Synthesized Intelligence */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
              <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                Final Synthesized Executive Intelligence
              </h3>
            </div>

            <div className="prose prose-sm max-w-none text-zinc-800 leading-relaxed font-sans">
              <div className="whitespace-pre-line text-sm text-zinc-700">
                {result.finalAnswer}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
