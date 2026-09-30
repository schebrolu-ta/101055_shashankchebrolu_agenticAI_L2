import React, { useState } from 'react';
import { executeTool } from '../services/toolEngine';
import { Play, Copy, CheckCircle, Terminal, Database } from 'lucide-react';

const PRESET_SQL_QUERIES = [
  {
    name: 'Product Return Rates',
    sql: `SELECT p.product_id, p.product_name, p.category, p.base_price,
       COUNT(o.order_id) as total_orders,
       SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) as returned_orders,
       ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct,
       ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN o.units_sold * o.unit_price ELSE 0 END), 2) as lost_revenue
FROM products p
JOIN orders o ON p.product_id = o.product_id
GROUP BY p.product_id, p.product_name, p.category, p.base_price
ORDER BY return_rate_pct DESC;`,
  },
  {
    name: 'Customer Segment Profitability',
    sql: `SELECT c.customer_segment,
       COUNT(DISTINCT c.customer_id) as total_customers,
       COUNT(o.order_id) as total_orders,
       ROUND(SUM(o.units_sold * o.unit_price), 2) as gross_revenue,
       ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN o.units_sold * o.unit_price ELSE 0 END), 2) as returns_loss,
       ROUND(SUM(CASE WHEN o.delivery_status != 'Returned' THEN o.units_sold * o.unit_price ELSE 0 END), 2) as net_revenue,
       ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_segment
ORDER BY net_revenue DESC;`,
  },
  {
    name: 'Omnichannel Comparison',
    sql: `SELECT o.sales_channel,
       COUNT(o.order_id) as order_count,
       SUM(o.units_sold) as units_sold,
       ROUND(SUM(o.units_sold * o.unit_price), 2) as total_sales,
       ROUND(AVG(o.discount_pct), 1) as avg_discount,
       SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) as return_count,
       ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
FROM orders o
GROUP BY o.sales_channel
ORDER BY total_sales DESC;`,
  },
  {
    name: 'Root Cause of Returns',
    sql: `SELECT r.return_reason,
       COUNT(*) as return_count,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM returns), 1) as pct_of_total_returns
FROM returns r
GROUP BY r.return_reason
ORDER BY return_count DESC;`,
  },
];

export const SqlSandbox: React.FC = () => {
  const [query, setQuery] = useState(PRESET_SQL_QUERIES[0].sql);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = () => {
    const res = executeTool('execute_sql_query', { query });
    setResult(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <span>Interactive SQL Sandbox (`execute_sql_query` Tool)</span>
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Test and run read-only SQL queries against the 5 in-memory tables: <code>customers</code>, <code>products</code>, <code>orders</code>, <code>returns</code>, <code>stores</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_SQL_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p.sql);
                const res = executeTool('execute_sql_query', { query: p.sql });
                setResult(res);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>SQL Editor (SELECT queries only)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExecute}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Query</span>
            </button>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={7}
          className="w-full bg-zinc-950 text-emerald-400 font-mono text-xs p-4 focus:outline-none resize-y"
          placeholder="Enter SQL SELECT query..."
        />
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800">Query Results</span>
              {result.output?.rowCount !== undefined && (
                <span className="text-zinc-500">({result.output.rowCount} rows returned)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500">Execution time: {result.executionTimeMs}ms</span>
              <span
                className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                  result.status === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {result.status.toUpperCase()}
              </span>
            </div>
          </div>

          {result.status === 'error' ? (
            <div className="p-4 text-xs font-mono text-rose-600 bg-rose-50/50">
              Error: {result.errorMessage}
            </div>
          ) : Array.isArray(result.output?.data) && result.output.data.length > 0 ? (
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100 text-zinc-600 border-b border-zinc-200 sticky top-0">
                  <tr>
                    {Object.keys(result.output.data[0]).map((col) => (
                      <th key={col} className="py-2 px-3 font-semibold text-zinc-900">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {result.output.data.map((row: Record<string, unknown>, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="py-2 px-3">
                          {typeof val === 'number'
                            ? val.toLocaleString()
                            : typeof val === 'object'
                            ? JSON.stringify(val)
                            : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono">
              Query completed successfully. No rows returned.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
