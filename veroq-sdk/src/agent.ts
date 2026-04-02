/**
 * VEROQ Universal Agent Connector (TypeScript)
 *
 * The simplest way to give any AI agent financial intelligence.
 *
 *   import { Agent } from '@veroq/sdk';
 *
 *   const agent = new Agent({ apiKey: 'pr_live_...' });
 *   const result = await agent.ask("What's happening with NVDA?");
 *   console.log(result.summary);
 *
 *   const full = await agent.full('AAPL');
 *   console.log(full.price, full.technicals, full.earnings);
 */

export interface AskResult {
  question: string;
  intents: string[];
  tickers: string[];
  reasoning: string[];
  summary: string;
  data: Record<string, any>;
  credits_used: number;
  endpoints_called: string[];
}

export interface FullResult {
  ticker: string;
  entity_name: string;
  sector: string;
  asset_type: string;
  price: { current?: number; change_pct?: number; market_state?: string };
  sentiment: { score?: number; label?: string; briefs_24h?: number; signals?: any[]; current_streak?: any };
  technicals: { signal?: string; rsi_14?: number; sma_20?: number; macd?: any; bollinger?: any };
  earnings: { next_date?: string; fiscal_quarter?: string; eps_estimate?: number; revenue_estimate?: number };
  news: { total: number; briefs: { id: string; headline: string; deck: string; category: string; published_at: string }[] };
  insider: { transactions: any[]; total: number };
  filings: { recent: any[]; total: number };
  analysts: { consensus: any; ratings: any[]; total: number };
  institutions: { holders: any[]; total: number };
  data_sources: string[];
  fetched_at: string;
}

export interface SubscribeEvent {
  type: string;
  ticker: string | null;
  data: Record<string, any>;
  timestamp: string;
}

export interface AgentOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export class Agent {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: AgentOptions = {}) {
    this.apiKey = options.apiKey || process.env.VEROQ_API_KEY || process.env.POLARIS_API_KEY || '';
    this.baseUrl = (options.baseUrl || 'https://api.thepolarisreport.com').replace(/\/$/, '');
    this.timeout = options.timeout || 30_000;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'veroq-agent/1.0',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const error = await resp.json().catch(() => ({ message: `HTTP ${resp.status}` }));
        throw new Error(error.message || `HTTP ${resp.status}`);
      }

      return resp.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Ask any financial question. Returns structured data + markdown summary.
   *
   *   const result = await agent.ask("What's happening with NVDA?");
   *   console.log(result.summary);
   *   console.log(result.tickers);    // ['NVDA']
   *   console.log(result.reasoning);  // ['Identified ticker: NVDA', ...]
   */
  async ask(question: string): Promise<AskResult> {
    return this.request<AskResult>('POST', '/api/v1/ask', { question });
  }

  /**
   * Get EVERYTHING about a ticker in one call.
   *
   *   const result = await agent.full('NVDA');
   *   console.log(result.price);       // { current: 178.68, change_pct: -0.95 }
   *   console.log(result.technicals);  // { signal: 'neutral', rsi_14: 46.4 }
   *   console.log(result.insider);     // { transactions: [...], total: 20 }
   */
  async full(ticker: string): Promise<FullResult> {
    return this.request<FullResult>('GET', `/api/v1/ticker/${ticker.toUpperCase()}/full`);
  }

  /**
   * Subscribe to real-time financial events via SSE.
   *
   *   const stream = agent.subscribe({ tickers: ['NVDA', 'AAPL'], events: ['brief'] });
   *   for await (const event of stream) {
   *     console.log(event.type, event.ticker, event.data);
   *   }
   */
  async *subscribe(options: { tickers?: string[]; events?: string[] } = {}): AsyncGenerator<SubscribeEvent> {
    const params = new URLSearchParams();
    params.set('tickers', options.tickers?.map(t => t.toUpperCase()).join(',') || '*');
    if (options.events) params.set('events', options.events.join(','));

    const resp = await fetch(`${this.baseUrl}/api/v1/subscribe?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'text/event-stream',
        'User-Agent': 'veroq-agent/1.0',
      },
    });

    if (!resp.ok || !resp.body) throw new Error(`Subscribe failed: ${resp.status}`);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = '';
    let dataLines: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
          eventType = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          dataLines.push(trimmed.slice(5).trim());
        } else if (trimmed === '' && eventType && dataLines.length > 0) {
          try {
            const data = JSON.parse(dataLines.join(''));
            yield { type: eventType, ticker: data.ticker || null, data: data.data || data, timestamp: data.timestamp || '' };
          } catch { /* ignore parse errors */ }
          eventType = '';
          dataLines = [];
        }
      }
    }
  }

  /**
   * Run a marketplace agent.
   *
   *   const result = await agent.runAgent('sector-pulse', { sector: 'Technology' });
   *   console.log(result.summary);
   */
  async runAgent(slug: string, inputs: Record<string, any> = {}): Promise<any> {
    return this.request('POST', `/api/v1/agents/run/${slug}`, inputs);
  }

  /** Search intelligence briefs. */
  async search(query: string, perPage = 10): Promise<any> {
    return this.request('GET', `/api/v1/search?q=${encodeURIComponent(query)}&per_page=${perPage}`);
  }

  /** Fact-check a claim against the intelligence corpus. */
  async verify(claim: string): Promise<any> {
    return this.request('POST', '/api/v1/verify', { claim });
  }
}
