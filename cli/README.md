# @polaris-news/cli

> **DEPRECATED**: This package has moved to [@veroq/cli](https://www.npmjs.com/package/@veroq/cli).
>
> ```bash
> npm uninstall -g @polaris-news/cli
> npm install -g @veroq/cli
> ```
>
> Your existing `POLARIS_API_KEY` will continue to work.

---

Financial intelligence from your terminal. The trust layer for AI agents.

```bash
npm install -g @veroq/cli
export VEROQ_API_KEY=pr_live_xxx
veroq ask "What's happening with NVDA?"
```

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ask <question>` | Natural language query | `polaris ask "Is Tesla overvalued?"` |
| `price <TICKER>` | Live price | `polaris price NVDA` |
| `screen <criteria>` | NLP stock screener | `polaris screen "oversold semiconductors"` |
| `compare <T1> <T2>` | Side-by-side comparison | `polaris compare AAPL MSFT` |
| `earnings <TICKER>` | Next earnings + estimates | `polaris earnings TSLA` |
| `insider <TICKER>` | Insider transactions | `polaris insider NVDA` |
| `signal <TICKER>` | Trade readiness (0-100) | `polaris signal MSFT` |
| `technicals <TICKER>` | Technical indicators | `polaris technicals AMD` |
| `full <TICKER>` | Everything in one call | `polaris full AAPL` |
| `market` | Market overview + indices | `polaris market` |
| `news <query>` | Search briefs | `polaris news "AI stocks"` |
| `verify <claim>` | Fact-check a claim | `polaris verify "NVDA revenue grew 73%"` |

## Output

JSON by default (agent-first). Use `--human` for formatted output.

```bash
# Agent mode (JSON)
polaris ask "NVDA earnings"

# Human mode (formatted)
polaris ask "NVDA earnings" --human
```

## Auth

Get a free API key at [thepolarisreport.com/pricing](https://thepolarisreport.com/pricing) (1,000 credits/month free).

```bash
export POLARIS_API_KEY=pr_live_xxx
```

## What You Get

- 891 tracked tickers (equities, crypto, ETFs, commodities, indices)
- 20 technical indicators + signal summary
- NLP screener that parses natural language into filters
- Trade readiness signal (0-100) with factor breakdown
- Insider trades, SEC filings, analyst ratings, congressional trades
- AI-powered reports (Quick/Full/Deep)
- Verified, bias-scored intelligence briefs
- Real-time market data from multiple providers

## Links

- [API Documentation](https://thepolarisreport.com/docs)
- [Interactive Demo](https://thepolarisreport.com/ask)
- [Python SDK](https://pypi.org/project/polaris-news/)
- [TypeScript SDK](https://www.npmjs.com/package/polaris-news-api)
