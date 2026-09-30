import React, { useState } from 'react';
import {
  customers,
  products,
  returnsData,
  stores,
  orders,
  customersRawCSV,
  productsRawCSV,
  returnsRawCSV,
  storesRawCSV,
  ordersRawCSV,
} from '../data/retailData';
import { Search, Filter, Download, FileText, Table, Copy, CheckCircle, ExternalLink, Database } from 'lucide-react';

interface DataExplorerProps {
  onSelectQuery?: (query: string) => void;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ onSelectQuery }) => {
  const [activeTable, setActiveTable] = useState<'orders' | 'returns' | 'products' | 'customers' | 'stores'>('orders');
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [copiedRaw, setCopiedRaw] = useState(false);

  const rawFilesMap: Record<string, { filename: string; path: string; content: string; rowCount: number; sampleQuery: string }> = {
    orders: {
      filename: 'orders.csv',
      path: '/data/orders.csv',
      content: ordersRawCSV,
      rowCount: orders.length,
      sampleQuery: 'Analyze order distribution, gross sales, and payment statuses across all channels in orders.csv.',
    },
    returns: {
      filename: 'returns.csv',
      path: '/data/returns.csv',
      content: returnsRawCSV,
      rowCount: returnsData.length,
      sampleQuery: 'Examine return_reason in returns.csv to identify root causes and late delivery patterns.',
    },
    products: {
      filename: 'products.csv',
      path: '/data/products.csv',
      content: productsRawCSV,
      rowCount: products.length,
      sampleQuery: 'Which product in products.csv has the highest base price and how does it correlate with return rates?',
    },
    customers: {
      filename: 'customers.csv',
      path: '/data/customers.csv',
      content: customersRawCSV,
      rowCount: customers.length,
      sampleQuery: 'Compare customer_segment in customers.csv: which segment has the highest customer count and lifetime value?',
    },
    stores: {
      filename: 'stores.csv',
      path: '/data/stores.csv',
      content: storesRawCSV,
      rowCount: stores.length,
      sampleQuery: 'Compare store performance across North, South, East, West, and Central regions in stores.csv.',
    },
  };

  const currentFile = rawFilesMap[activeTable];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.store_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterSegment === 'all' || o.delivery_status === filterSegment;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_segment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReturns = returnsData.filter(
    (r) =>
      r.return_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.return_reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStores = stores.filter(
    (s) =>
      s.store_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* File Location Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-indigo-950">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Data Files Ingested in <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-indigo-700">/data/</code>:</strong>{' '}
            5 CSV files populated (<code>customers.csv</code>, <code>products.csv</code>, <code>returns.csv</code>, <code>orders.csv</code>, <code>stores.csv</code>).
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-2xs text-indigo-800">
          <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">5 Tables</span>
          <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">511 Total Rows</span>
        </div>
      </div>

      {/* KPI Cards / Table Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setActiveTable('orders');
            setSearchTerm('');
          }}
          className={`p-4 rounded-xl border text-left transition shadow-xs ${
            activeTable === 'orders'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs uppercase tracking-wider text-zinc-400 font-mono">/data/orders.csv</span>
            <FileText className="w-3.5 h-3.5 opacity-60" />
          </div>
          <span className="text-2xl font-bold font-mono">{orders.length}</span>
          <span className="text-xs block mt-1 opacity-70">₹371k Total Volume</span>
        </button>

        <button
          onClick={() => {
            setActiveTable('returns');
            setSearchTerm('');
          }}
          className={`p-4 rounded-xl border text-left transition shadow-xs ${
            activeTable === 'returns'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs uppercase tracking-wider text-zinc-400 font-mono">/data/returns.csv</span>
            <FileText className="w-3.5 h-3.5 opacity-60" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-500">{returnsData.length}</span>
          <span className="text-xs block mt-1 opacity-70">12.8% Return Rate</span>
        </button>

        <button
          onClick={() => {
            setActiveTable('customers');
            setSearchTerm('');
          }}
          className={`p-4 rounded-xl border text-left transition shadow-xs ${
            activeTable === 'customers'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs uppercase tracking-wider text-zinc-400 font-mono">/data/customers.csv</span>
            <FileText className="w-3.5 h-3.5 opacity-60" />
          </div>
          <span className="text-2xl font-bold font-mono">{customers.length}</span>
          <span className="text-xs block mt-1 opacity-70">4 Distinct Segments</span>
        </button>

        <button
          onClick={() => {
            setActiveTable('products');
            setSearchTerm('');
          }}
          className={`p-4 rounded-xl border text-left transition shadow-xs ${
            activeTable === 'products'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs uppercase tracking-wider text-zinc-400 font-mono">/data/products.csv</span>
            <FileText className="w-3.5 h-3.5 opacity-60" />
          </div>
          <span className="text-2xl font-bold font-mono">{products.length}</span>
          <span className="text-xs block mt-1 opacity-70">5 Major Categories</span>
        </button>

        <button
          onClick={() => {
            setActiveTable('stores');
            setSearchTerm('');
          }}
          className={`p-4 rounded-xl border text-left transition shadow-xs ${
            activeTable === 'stores'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xs uppercase tracking-wider text-zinc-400 font-mono">/data/stores.csv</span>
            <FileText className="w-3.5 h-3.5 opacity-60" />
          </div>
          <span className="text-2xl font-bold font-mono">{stores.length}</span>
          <span className="text-xs block mt-1 opacity-70">15 Cities / 5 Regions</span>
        </button>
      </div>

      {/* Control Bar: View Toggle, Filter & Search */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                viewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table Grid</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                viewMode === 'raw' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw CSV ({currentFile.filename})</span>
            </button>
          </div>

          {viewMode === 'table' && (
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTable}...`}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {viewMode === 'table' && activeTable === 'orders' && (
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5 text-xs text-zinc-700"
              >
                <option value="all">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="Returned">Returned</option>
                <option value="Processing">Processing</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions: Copy / Download */}
        <div className="flex items-center gap-2">
          {viewMode === 'raw' && (
            <button
              onClick={handleCopyRaw}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
            >
              {copiedRaw ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Raw CSV</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownloadFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {currentFile.filename}</span>
          </button>
        </div>
      </div>

      {/* Content View: Raw CSV vs Table */}
      {viewMode === 'raw' ? (
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-xs">
          <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{currentFile.path}</span>
              <span>·</span>
              <span>{currentFile.rowCount} rows</span>
            </div>
            <span>Encoding: UTF-8</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-auto">
            <pre className="font-mono text-xs text-zinc-200 whitespace-pre leading-relaxed">
              {currentFile.content}
            </pre>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="max-h-[550px] overflow-auto">
            {activeTable === 'orders' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-mono border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Store</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
                  {filteredOrders.slice(0, 100).map((o) => (
                    <tr key={o.order_id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-2 px-3 font-semibold text-zinc-900">{o.order_id}</td>
                      <td className="py-2 px-3 text-zinc-500">{o.order_date}</td>
                      <td className="py-2 px-3">{o.store_id}</td>
                      <td className="py-2 px-3 text-indigo-600">{o.product_id}</td>
                      <td className="py-2 px-3">{o.customer_id}</td>
                      <td className="py-2 px-3 text-zinc-600">{o.sales_channel}</td>
                      <td className="py-2 px-3 text-right">{o.units_sold}</td>
                      <td className="py-2 px-3 text-right">₹{o.unit_price}</td>
                      <td className="py-2 px-3 text-right">{o.discount_pct}%</td>
                      <td className="py-2 px-3">
                        <span className={o.payment_status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={
                            o.delivery_status === 'Returned'
                              ? 'text-rose-700 font-semibold'
                              : o.delivery_status === 'Delivered'
                              ? 'text-emerald-700'
                              : 'text-zinc-600'
                          }
                        >
                          {o.delivery_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTable === 'returns' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-mono border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Return ID</th>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Return Date</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
                  {filteredReturns.map((r) => (
                    <tr key={r.return_id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-2 px-3 font-semibold text-rose-700">{r.return_id}</td>
                      <td className="py-2 px-3 font-semibold text-zinc-900">{r.order_id}</td>
                      <td className="py-2 px-3 text-zinc-500">{r.return_date}</td>
                      <td className="py-2 px-3 font-sans text-zinc-900 font-medium">{r.return_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTable === 'products' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-mono border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Product ID</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Sub Category</th>
                    <th className="py-2.5 px-3 text-right">Base Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
                  {filteredProducts.map((p) => (
                    <tr key={p.product_id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-2 px-3 font-semibold text-indigo-700">{p.product_id}</td>
                      <td className="py-2 px-3 font-sans font-medium text-zinc-900">{p.product_name}</td>
                      <td className="py-2 px-3 text-zinc-600">{p.category}</td>
                      <td className="py-2 px-3 text-zinc-500">{p.sub_category}</td>
                      <td className="py-2 px-3 text-right font-semibold text-zinc-900">₹{p.base_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTable === 'customers' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-mono border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Customer ID</th>
                    <th className="py-2.5 px-3">Segment</th>
                    <th className="py-2.5 px-3">Signup Date</th>
                    <th className="py-2.5 px-3">Preferred Channel</th>
                    <th className="py-2.5 px-3">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
                  {filteredCustomers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-2 px-3 font-semibold text-zinc-900">{c.customer_id}</td>
                      <td className="py-2 px-3 font-sans font-medium">
                        <span
                          className={
                            c.customer_segment === 'Wholesale'
                              ? 'text-purple-700'
                              : c.customer_segment === 'Premium'
                              ? 'text-indigo-700'
                              : 'text-zinc-700'
                          }
                        >
                          {c.customer_segment}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-zinc-500">{c.signup_date}</td>
                      <td className="py-2 px-3 text-zinc-600">{c.preferred_channel}</td>
                      <td className="py-2 px-3 font-sans text-zinc-900">{c.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTable === 'stores' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-mono border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Store ID</th>
                    <th className="py-2.5 px-3">Store Name</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Store Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-zinc-700">
                  {filteredStores.map((s) => (
                    <tr key={s.store_id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-2 px-3 font-semibold text-zinc-900">{s.store_id}</td>
                      <td className="py-2 px-3 font-sans font-medium text-zinc-900">{s.store_name}</td>
                      <td className="py-2 px-3 text-indigo-700">{s.region}</td>
                      <td className="py-2 px-3 font-sans text-zinc-700">{s.city}</td>
                      <td className="py-2 px-3 text-zinc-600">{s.store_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-2xs text-zinc-500 font-mono flex items-center justify-between">
            <span>Directly mapped from files in <code>/data/</code></span>
            <span>Path: {currentFile.path}</span>
          </div>
        </div>
      )}
    </div>
  );
};
