# Polaris SDKs + CLI

**The trust layer for AI agents. Starting with finance. Just /ask Polaris.**

Official SDKs, CLI, and framework integrations for [The Polaris Report](https://thepolarisreport.com) — 1,061+ tickers, 20 technical indicators, NLP screener, trade signals, and verified intelligence.

## Fastest Way to Start

```bash
npm install -g @polaris-news/cli
export POLARIS_API_KEY=pr_live_xxx   # Free: thepolarisreport.com/pricing

polaris ask "What's happening with NVDA?"
polaris screen "oversold semiconductors"
polaris signal MSFT
polaris compare AAPL MSFT GOOGL
```

Or use the SDKs:

```python
from polaris_news import Agent
agent = Agent()
result = agent.ask("What's happening with NVDA?")
print(result.summary)        # Markdown summary with bottom line
print(result.trade_signal)   # { action: "hold", score: 50, factors: [...] }
```

```typescript
import { Agent } from 'polaris-news-api';
const agent = new Agent();
const result = await agent.ask("What's happening with NVDA?");
```

[Try it live](https://thepolarisreport.com/ask) — no signup required.

## Packages

| Package | Type | Install |
|---------|------|---------|
| [`@polaris-news/cli`](./cli/) | CLI | `npm install -g @polaris-news/cli` |
| [`polaris-news`](./python/) | Python SDK | `pip install polaris-news` |
| [`polaris-news-api`](./typescript/) | TypeScript SDK | `npm install polaris-news-api` |
| [`@polaris-news/ai`](./ai/) | Vercel AI SDK | `npm install @polaris-news/ai` |
| [`crewai-polaris`](./crewai-polaris/) | CrewAI | `pip install crewai-polaris` |
| [`langchain-polaris`](./langchain/) | LangChain | `pip install langchain-polaris` |
| [`n8n-nodes-polaris`](./n8n/) | n8n | [GitHub](https://github.com/Polaris-API/polaris-sdks/tree/main/n8n) |
| [`polaris-news-mcp`](https://www.npmjs.com/package/polaris-news-mcp) | MCP Server | `npm install -g polaris-news-mcp` |
| Cursor | MCP Plugin | [Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Polaris&config=eyJ1cmwiOiJodHRwczovL2FwaS50aGVwb2xhcmlzcmVwb3J0LmNvbS9hcGkvdjEvbWNwP2tleT1ZT1VSX0FQSV9LRVkifQ==) |

## CLI Commands

| Command | Description |
|---------|-------------|
| `polaris ask <question>` | Natural language query — returns structured intelligence |
| `polaris price <TICKER>` | Live price |
| `polaris screen <criteria>` | NLP stock screener |
| `polaris compare <T1> <T2>` | Side-by-side comparison |
| `polaris signal <TICKER>` | Trade readiness score (0-100) |
| `polaris earnings <TICKER>` | Next earnings + estimates |
| `polaris insider <TICKER>` | Insider transactions |
| `polaris technicals <TICKER>` | RSI, MACD, SMA, signals |
| `polaris full <TICKER>` | 9 data sources in one call |
| `polaris market` | Market overview + VIX |
| `polaris news <query>` | Search intelligence briefs |
| `polaris verify <claim>` | Fact-check against brief corpus |

JSON by default (agent-first). Use `--human` for formatted output.

## Examples

See [`examples/`](./examples/) for working integration examples:
- `trading-bot.py` — Automated trading signals
- `research-agent.ts` — Multi-step research pipeline
- `crypto-monitor.py` — Real-time crypto tracking

## What You Get

- **1,061+ tickers** — equities, crypto, ETFs, commodities, indices (auto-discovery for any ticker)
- **20 technical indicators** + composite signal summary
- **Trade readiness signal** — 0-100 score combining RSI, sentiment, VIX, technicals, earnings proximity
- **NLP screener** — "oversold semiconductors" → structured filters → results
- **Insider trades, SEC filings, analyst ratings, congressional trades**
- **Verified intelligence briefs** — bias-scored, confidence-rated
- **Real-time subscriptions** via SSE
- **300+ API endpoints** — all structured JSON

## Auth

```bash
export POLARIS_API_KEY=pr_live_xxx
```

Get a free key (1,000 credits/month): [thepolarisreport.com/pricing](https://thepolarisreport.com/pricing)

## Links

- [Interactive Demo](https://thepolarisreport.com/ask)
- [API Documentation](https://thepolarisreport.com/docs)
- [API Reference](https://thepolarisreport.com/api-reference)
- [TradingAgents-Pro](https://github.com/Polaris-API/TradingAgents-Pro) — 18-agent trading framework powered by Polaris

## License

MIT
