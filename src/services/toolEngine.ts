import alasql from 'alasql';
import {
  customers,
  products,
  returnsData,
  stores,
  orders,
  Customer,
  Product,
  ReturnRecord,
  Store,
  Order,
} from '../data/retailData';

let dbInitialized = false;

export function initDatabase() {
  if (dbInitialized) return;
  try {
    alasql('CREATE TABLE IF NOT EXISTS customers');
    alasql('CREATE TABLE IF NOT EXISTS products');
    alasql('CREATE TABLE IF NOT EXISTS [returns]');
    alasql('CREATE TABLE IF NOT EXISTS stores');
    alasql('CREATE TABLE IF NOT EXISTS orders');

    alasql.tables.customers.data = customers;
    alasql.tables.products.data = products;
    alasql.tables['returns'].data = returnsData;
    alasql.tables.stores.data = stores;
    alasql.tables.orders.data = orders;

    dbInitialized = true;
  } catch (err) {
    console.error('Failed to initialize AlaSQL tables:', err);
  }
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const SUGGESTED_TOOLS: ToolDefinition[] = [
  {
    name: 'execute_sql_query',
    description:
      'Execute a read-only SQL query on the retail database. Available tables: customers (customer_id, customer_segment, signup_date, preferred_channel, city), products (product_id, product_name, category, sub_category, base_price), orders (order_id, order_date, store_id, product_id, customer_id, sales_channel, units_sold, unit_price, discount_pct, payment_status, delivery_status), returns (return_id, order_id, return_date, return_reason), stores (store_id, store_name, region, city, store_type).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The standard SQL query to execute (SELECT only).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_metrics',
    description:
      'Compute comprehensive performance and return metrics for a specific product by product_id (e.g. P-001) or product name (e.g. "Tea Premium"). Returns revenue, unit volume, return rate, and return reasons.',
    parameters: {
      type: 'object',
      properties: {
        product_identifier: {
          type: 'string',
          description: 'The Product ID (e.g., "P-001") or Product Name (e.g., "Tea Premium").',
        },
      },
      required: ['product_identifier'],
    },
  },
  {
    name: 'get_customer_profile',
    description:
      'Retrieve deep customer behavioral analytics, total spend, return frequency, order count, preferred channel, city, and segment for a customer ID (e.g., "C-0014").',
    parameters: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'The Customer ID (e.g., "C-0014").',
        },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'get_store_performance',
    description:
      'Retrieve store operational performance, gross revenue, return rate, channel distribution, and regional rank for a store ID (e.g., "ST-001") or city (e.g., "Mumbai").',
    parameters: {
      type: 'object',
      properties: {
        store_identifier: {
          type: 'string',
          description: 'Store ID (e.g., "ST-001") or City (e.g., "Bengaluru").',
        },
      },
      required: ['store_identifier'],
    },
  },
  {
    name: 'analyze_returns',
    description:
      'Perform root-cause diagnostics on returns across dimensions: reason, product category, sales channel, or delivery status.',
    parameters: {
      type: 'object',
      properties: {
        dimension: {
          type: 'string',
          description: 'The dimension to aggregate returns by.',
          enum: ['reason', 'category', 'channel', 'region'],
        },
      },
      required: ['dimension'],
    },
  },
];

export interface ToolExecutionResult {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  executionTimeMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export function executeTool(name: string, args: Record<string, unknown>): ToolExecutionResult {
  initDatabase();
  const start = performance.now();

  try {
    switch (name) {
      case 'execute_sql_query': {
        const query = String(args.query || '').trim();
        // Guardrail: Read-only validation
        const forbidden = /\b(drop|delete|insert|update|alter|truncate|create|grant|revoke)\b/i;
        if (forbidden.test(query)) {
          throw new Error('AI Gateway Guardrail Error: Write/mutating SQL operations are strictly forbidden.');
        }

        // Normalize returns to [returns] for AlaSQL
        const normalizedQuery = query.replace(/\b(from|join)\s+returns\b/gi, '$1 [returns]');
        const res = alasql(normalizedQuery) as Record<string, unknown>[];
        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        return {
          tool: name,
          input: args,
          output: {
            rowCount: Array.isArray(res) ? res.length : 1,
            data: res,
          },
          executionTimeMs,
          status: 'success',
        };
      }

      case 'get_product_metrics': {
        const rawId = String(args.product_identifier || '').trim().toLowerCase();
        const prod = products.find(
          (p) => p.product_id.toLowerCase() === rawId || p.product_name.toLowerCase().includes(rawId)
        );

        if (!prod) {
          throw new Error(`Product "${args.product_identifier}" not found in catalog.`);
        }

        const prodOrders = orders.filter((o) => o.product_id === prod.product_id);
        const orderIds = prodOrders.map((o) => o.order_id);
        const prodReturns = returnsData.filter((r) => orderIds.includes(r.order_id));

        const totalUnitsSold = prodOrders.reduce((acc, o) => acc + o.units_sold, 0);
        const grossRevenue = prodOrders.reduce((acc, o) => acc + o.units_sold * o.unit_price, 0);
        const returnedOrders = prodOrders.filter((o) => o.delivery_status === 'Returned');
        const lostRevenue = returnedOrders.reduce((acc, o) => acc + o.units_sold * o.unit_price, 0);
        const netRevenue = grossRevenue - lostRevenue;
        const returnRatePct = prodOrders.length > 0 ? (prodReturns.length / prodOrders.length) * 100 : 0;

        const reasonBreakdown: Record<string, number> = {};
        prodReturns.forEach((r) => {
          reasonBreakdown[r.return_reason] = (reasonBreakdown[r.return_reason] || 0) + 1;
        });

        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        return {
          tool: name,
          input: args,
          output: {
            product: prod,
            totalOrders: prodOrders.length,
            totalUnitsSold,
            grossRevenue: Math.round(grossRevenue * 100) / 100,
            lostRevenue: Math.round(lostRevenue * 100) / 100,
            netRevenue: Math.round(netRevenue * 100) / 100,
            returnCount: prodReturns.length,
            returnRatePercent: Math.round(returnRatePct * 10) / 10,
            returnReasons: reasonBreakdown,
          },
          executionTimeMs,
          status: 'success',
        };
      }

      case 'get_customer_profile': {
        const cid = String(args.customer_id || '').trim().toUpperCase();
        const cust = customers.find((c) => c.customer_id.toUpperCase() === cid);
        if (!cust) {
          throw new Error(`Customer "${args.customer_id}" not found.`);
        }

        const custOrders = orders.filter((o) => o.customer_id === cust.customer_id);
        const orderIds = custOrders.map((o) => o.order_id);
        const custReturns = returnsData.filter((r) => orderIds.includes(r.order_id));
        const totalSpend = custOrders.reduce((acc, o) => acc + o.units_sold * o.unit_price, 0);

        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        return {
          tool: name,
          input: args,
          output: {
            customer: cust,
            totalOrdersPlaced: custOrders.length,
            totalLifetimeSpend: Math.round(totalSpend * 100) / 100,
            returnsCount: custReturns.length,
            returnRatePercent: custOrders.length ? Math.round((custReturns.length / custOrders.length) * 1000) / 10 : 0,
            orders: custOrders.map((o) => ({
              order_id: o.order_id,
              order_date: o.order_date,
              product_id: o.product_id,
              channel: o.sales_channel,
              amount: Math.round(o.units_sold * o.unit_price * 100) / 100,
              status: o.delivery_status,
            })),
            returns: custReturns,
          },
          executionTimeMs,
          status: 'success',
        };
      }

      case 'get_store_performance': {
        const query = String(args.store_identifier || '').trim().toLowerCase();
        const store = stores.find(
          (s) => s.store_id.toLowerCase() === query || s.city.toLowerCase() === query || s.store_name.toLowerCase().includes(query)
        );

        if (!store) {
          throw new Error(`Store "${args.store_identifier}" not found.`);
        }

        const storeOrders = orders.filter((o) => o.store_id === store.store_id);
        const orderIds = storeOrders.map((o) => o.order_id);
        const storeReturns = returnsData.filter((r) => orderIds.includes(r.order_id));
        const grossRevenue = storeOrders.reduce((acc, o) => acc + o.units_sold * o.unit_price, 0);
        const returnRatePct = storeOrders.length ? (storeReturns.length / storeOrders.length) * 100 : 0;

        const channelBreakdown: Record<string, number> = {};
        storeOrders.forEach((o) => {
          channelBreakdown[o.sales_channel] = (channelBreakdown[o.sales_channel] || 0) + 1;
        });

        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        return {
          tool: name,
          input: args,
          output: {
            store,
            totalOrders: storeOrders.length,
            grossRevenue: Math.round(grossRevenue * 100) / 100,
            returnCount: storeReturns.length,
            returnRatePercent: Math.round(returnRatePct * 10) / 10,
            channelBreakdown,
          },
          executionTimeMs,
          status: 'success',
        };
      }

      case 'analyze_returns': {
        const dimension = String(args.dimension || 'reason').toLowerCase();
        let aggregatedData: Record<string, unknown>[] = [];

        if (dimension === 'reason') {
          aggregatedData = alasql(`
            SELECT r.return_reason as reason, COUNT(*) as return_count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM [returns]), 1) as percentage
            FROM [returns] r
            GROUP BY r.return_reason
            ORDER BY return_count DESC
          `) as Record<string, unknown>[];
        } else if (dimension === 'category') {
          aggregatedData = alasql(`
            SELECT p.category, COUNT(r.return_id) as return_count,
            COUNT(DISTINCT o.order_id) as total_orders,
            ROUND(COUNT(r.return_id) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
            FROM products p
            JOIN orders o ON p.product_id = o.product_id
            LEFT JOIN [returns] r ON o.order_id = r.order_id
            GROUP BY p.category
            ORDER BY return_count DESC
          `) as Record<string, unknown>[];
        } else if (dimension === 'channel') {
          aggregatedData = alasql(`
            SELECT o.sales_channel, COUNT(r.return_id) as return_count,
            COUNT(o.order_id) as total_orders,
            ROUND(COUNT(r.return_id) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
            FROM orders o
            LEFT JOIN [returns] r ON o.order_id = r.order_id
            GROUP BY o.sales_channel
            ORDER BY return_count DESC
          `) as Record<string, unknown>[];
        } else if (dimension === 'region') {
          aggregatedData = alasql(`
            SELECT s.region, COUNT(r.return_id) as return_count,
            COUNT(o.order_id) as total_orders,
            ROUND(COUNT(r.return_id) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
            FROM stores s
            JOIN orders o ON s.store_id = o.store_id
            LEFT JOIN [returns] r ON o.order_id = r.order_id
            GROUP BY s.region
            ORDER BY return_count DESC
          `) as Record<string, unknown>[];
        }

        const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
        return {
          tool: name,
          input: args,
          output: {
            dimension,
            totalReturns: returnsData.length,
            breakdown: aggregatedData,
          },
          executionTimeMs,
          status: 'success',
        };
      }

      default:
        throw new Error(`Tool "${name}" is not supported. Use only the suggested tools.`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      tool: name,
      input: args,
      output: null,
      executionTimeMs,
      status: 'error',
      errorMessage: errorMsg,
    };
  }
}
