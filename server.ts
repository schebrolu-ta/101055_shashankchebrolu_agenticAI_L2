import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration, FunctionCall } from '@google/genai';
import { executeTool, SUGGESTED_TOOLS, initDatabase } from './src/services/toolEngine';
import { runLocalAgent, getGatewayStats, defaultGatewayConfig } from './src/services/aiGateway';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize database
initDatabase();

// Setup Gemini AI client if key exists
let geminiAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    geminiAI = new GoogleGenAI();
    console.log('[AI Gateway] Initialized GoogleGenAI with API Key.');
  } catch (err) {
    console.warn('[AI Gateway] Failed to initialize GoogleGenAI:', err);
  }
}

// API Routes
app.get('/api/gateway/stats', (_req: Request, res: Response) => {
  const stats = getGatewayStats();
  res.json({
    success: true,
    data: stats,
    hasLiveGemini: !!geminiAI,
  });
});

app.get('/api/gateway/tools', (_req: Request, res: Response) => {
  res.json({
    success: true,
    tools: SUGGESTED_TOOLS,
  });
});

app.post('/api/tools/execute', (req: Request, res: Response) => {
  const { name, args } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Tool name is required' });
  }
  const result = executeTool(name, args || {});
  res.json({ success: true, result });
});

app.post('/api/agent/query', async (req: Request, res: Response) => {
  const { query, config = defaultGatewayConfig } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }

  // If live Gemini is configured and requested, attempt live tool calling
  if (geminiAI && config.defaultModel) {
    try {
      const startTime = performance.now();
      const modelName = 'gemini-3.8-flash';

      // Define Gemini function calling declarations explicitly
      const functionDeclarations: FunctionDeclaration[] = [
        {
          name: 'execute_sql_query',
          description: 'Execute a SELECT SQL query against the retail database (tables: customers, products, orders, returns, stores).',
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: 'The SQL SELECT query to run.' },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_product_metrics',
          description: 'Get units sold, revenue, return rate and return reasons for a product ID (e.g. P-001) or product name.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              product_identifier: { type: Type.STRING, description: 'Product ID or Name.' },
            },
            required: ['product_identifier'],
          },
        },
        {
          name: 'get_customer_profile',
          description: 'Get customer lifetime spend, return rate, segment and order history for a customer ID (e.g. C-0014).',
          parameters: {
            type: Type.OBJECT,
            properties: {
              customer_id: { type: Type.STRING, description: 'Customer ID (e.g. C-0014).' },
            },
            required: ['customer_id'],
          },
        },
        {
          name: 'get_store_performance',
          description: 'Get sales, revenue and return metrics for a retail store by store ID (e.g. ST-001) or city.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              store_identifier: { type: Type.STRING, description: 'Store ID or City.' },
            },
            required: ['store_identifier'],
          },
        },
        {
          name: 'analyze_returns',
          description: 'Aggregate return reasons, category breakdowns, channel return rates, or regional returns.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              dimension: {
                type: Type.STRING,
                description: 'Dimension to analyze: reason, category, channel, or region.',
              },
            },
            required: ['dimension'],
          },
        },
      ];

      const systemInstruction = `You are an expert Retail Operations Agentic AI.
You have access to 5 suggested tools to query the retail enterprise database:
1. execute_sql_query: for custom SQL queries (customers, products, orders, returns, stores)
2. get_product_metrics: for product sales, revenue, return rates
3. get_customer_profile: for customer lifetime value and behavior
4. get_store_performance: for store and city operational data
5. analyze_returns: for return root cause and dimensional diagnostics

Always use ONLY these suggested tools to retrieve factual ground truth before forming conclusions.
Formulate clear thoughts, invoke the appropriate tools, observe the results, and provide a clear, executive-grade analysis with numerical evidence and actionable recommendations.`;

      const response = await geminiAI.models.generateContent({
        model: modelName,
        contents: query,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }],
        },
      });

      const functionCalls: FunctionCall[] = response.functionCalls || [];
      const steps = [];
      let finalAnswer = response.text || '';

      if (functionCalls.length > 0) {
        for (let i = 0; i < functionCalls.length; i++) {
          const call = functionCalls[i];
          if (!call.name) continue;
          const toolResult = executeTool(call.name, (call.args as Record<string, unknown>) || {});
          steps.push({
            stepNumber: i + 1,
            thought: `Gemini decided to call tool "${call.name}" with arguments: ${JSON.stringify(call.args)}`,
            toolCall: {
              name: call.name,
              args: (call.args as Record<string, unknown>) || {},
            },
            toolResult,
            observation: JSON.stringify(toolResult.output).substring(0, 300) + '...',
          });
        }

        // Secondary synthesis step
        const followUp = await geminiAI.models.generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: query }] },
            {
              role: 'model',
              parts: functionCalls.map((fc: FunctionCall) => ({
                functionCall: { name: fc.name, args: fc.args },
              })),
            },
            {
              role: 'user',
              parts: steps.map((s) => ({
                functionResponse: {
                  name: s.toolCall!.name,
                  response: { result: s.toolResult?.output },
                },
              })),
            },
          ],
          config: { systemInstruction },
        });

        finalAnswer = followUp.text || 'Analysis complete.';
      }

      const durationMs = Math.round(performance.now() - startTime);
      return res.json({
        success: true,
        data: {
          query,
          finalAnswer,
          steps: steps.length > 0 ? steps : [{ stepNumber: 1, thought: 'Direct answer synthesized.', observation: finalAnswer }],
          gatewayLog: {
            id: 'gw-gemini-' + Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            model: modelName,
            endpoint: '/v1/models/' + modelName,
            promptTokens: Math.round(query.length / 3),
            completionTokens: Math.round(finalAnswer.length / 3),
            latencyMs: durationMs,
            cacheHit: false,
            status: '200 OK',
            toolCallsCount: steps.length,
            costEstimated: Math.round((durationMs * 0.00001) * 1000) / 1000,
          },
          totalDurationMs: durationMs,
        },
      });
    } catch (geminiError) {
      console.warn('[AI Gateway] Live Gemini call failed, falling back to local agent:', geminiError);
    }
  }

  // Local Agentic Reasoning Engine fallback
  const result = runLocalAgent(query, config);
  res.json({
    success: true,
    data: result,
  });
});

// Serve /data folder directly
app.use('/data', express.static(path.resolve(__dirname, 'data')));

// Mount Vite or serve static
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Retail AI Gateway server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
