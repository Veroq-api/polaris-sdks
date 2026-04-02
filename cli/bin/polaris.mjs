#!/usr/bin/env node

// ============================================================
// Polaris CLI — Financial intelligence from your terminal
// ============================================================
// The trust layer for AI agents. Starting with finance.
//
// Usage:
//   polaris ask "What's happening with NVDA?"
//   polaris price NVDA
//   polaris screen "oversold semiconductors"
//   polaris compare AAPL MSFT
//   polaris earnings TSLA
//   polaris insider NVDA
//   polaris signal MSFT
//   polaris market
//   polaris news "AI stocks"
//   polaris verify "Tesla delivered 1.8M vehicles"
//
// Auth:
//   export POLARIS_API_KEY=pr_live_xxx
//   polaris ask "NVDA earnings"
//
// Output:
//   JSON by default (agent-first). Use --human for formatted output.
// ============================================================

const API = process.env.POLARIS_API_URL || "https://api.thepolarisreport.com";
const KEY = process.env.POLARIS_API_KEY || "";

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

// Flags
const jsonMode = !args.includes("--human");
const humanMode = args.includes("--human");
const verbose = args.includes("--verbose") || args.includes("-v");
const cleanArgs = args.filter(a => !a.startsWith("--") && !a.startsWith("-v"));

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "version" || command === "--version") {
  console.log("@polaris-news/cli v1.0.0");
  process.exit(0);
}

if (!KEY && command !== "help") {
  console.error("Set your API key: export POLARIS_API_KEY=pr_live_xxx");
  console.error("Get one free at https://thepolarisreport.com/pricing");
  process.exit(1);
}

// ── Commands ──

const commands = {
  ask: cmdAsk,
  price: cmdPrice,
  screen: cmdScreen,
  compare: cmdCompare,
  earnings: cmdEarnings,
  insider: cmdInsider,
  signal: cmdSignal,
  market: cmdMarket,
  news: cmdNews,
  verify: cmdVerify,
  full: cmdFull,
  technicals: cmdTechnicals,
  search: cmdSearch,
};

const handler = commands[command];
if (!handler) {
  console.error(`Unknown command: ${command}`);
  console.error('Run "polaris help" for usage.');
  process.exit(1);
}

handler(cleanArgs.slice(1)).catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

// ── API Helper ──

async function api(path, method = "GET", body = null) {
  const url = `${API}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (KEY) headers["X-API-Key"] = KEY;

  if (verbose) console.error(`→ ${method} ${path}`);

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.message || `API returned ${resp.status}`);
  }
  return data;
}

function output(data, humanFormatter) {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else if (humanFormatter) {
    humanFormatter(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

// ── Command Implementations ──

async function cmdAsk(args) {
  const question = args.join(" ");
  if (!question) { console.error("Usage: polaris ask <question>"); process.exit(1); }

  const data = await api(`/api/v1/ask?q=${encodeURIComponent(question)}`);

  output(data, d => {
    if (d.summary) {
      console.log(d.summary);
      console.log();
    }
    if (d.trade_signal) {
      console.log(`Trade Signal: ${d.trade_signal.action.toUpperCase()} (${d.trade_signal.score}/100)`);
      for (const f of d.trade_signal.factors || []) console.log(`  - ${f}`);
      console.log();
    }
    console.log(`Confidence: ${d.confidence} | Credits: ${d.credits_used} | ${d.response_time_ms}ms`);
    if (d.follow_ups?.length) {
      console.log(`\nFollow up: ${d.follow_ups.join(" | ")}`);
    }
  });
}

async function cmdPrice(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: polaris price <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ticker/${encodeURIComponent(ticker)}/price`);

  output(data, d => {
    const price = d.price?.current ?? d.price ?? "-";
    const change = d.price?.change_pct ?? d.change_pct ?? 0;
    const state = d.price?.market_state ?? d.market_state ?? "";
    const name = d.entity_name || ticker;
    console.log(`${name} (${ticker}): $${price} (${change > 0 ? "+" : ""}${change}%) | ${state}`);
  });
}

async function cmdScreen(args) {
  const query = args.join(" ");
  if (!query) { console.error("Usage: polaris screen <criteria>"); process.exit(1); }

  const data = await api("/api/v1/screener/natural", "POST", { query, limit: 15 });

  output(data, d => {
    if (d.interpreted_as) {
      const ia = d.interpreted_as;
      const parts = [];
      if (ia.sector) parts.push(ia.sector);
      const f = ia.filters || {};
      if (f.rsi_below) parts.push(`RSI < ${f.rsi_below}`);
      if (f.rsi_above) parts.push(`RSI > ${f.rsi_above}`);
      if (f.sentiment) parts.push(`${f.sentiment} sentiment`);
      console.log(`Screening: ${parts.join(" + ")}\n`);
    }
    const results = d.results || [];
    if (results.length === 0) { console.log("0 matches"); return; }

    console.log(`${results.length} match${results.length > 1 ? "es" : ""}:\n`);
    for (const r of results) {
      const parts = [r.ticker.padEnd(6)];
      if (r.entity_name) parts.push(r.entity_name.padEnd(25));
      if (r.price != null) parts.push(`$${r.price}`);
      if (r.rsi_14 != null) parts.push(`RSI: ${r.rsi_14.toFixed(1)}`);
      if (r.signal) parts.push(`Signal: ${r.signal}`);
      if (r.sentiment_7d != null) parts.push(r.sentiment_7d > 0.2 ? "Bullish" : r.sentiment_7d < -0.2 ? "Bearish" : "Neutral");
      console.log(`  ${parts.join("  ")}`);
    }
  });
}

async function cmdCompare(args) {
  if (args.length < 2) { console.error("Usage: polaris compare <TICKER1> <TICKER2> [TICKER3...]"); process.exit(1); }

  const tickers = args.map(t => t.toUpperCase()).slice(0, 5);
  const question = tickers.join(" vs ");
  const data = await api(`/api/v1/ask?q=${encodeURIComponent(question)}`);

  output(data, d => {
    if (d.summary) console.log(d.summary);
  });
}

async function cmdEarnings(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: polaris earnings <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ticker/${encodeURIComponent(ticker)}/earnings`);

  output(data, d => {
    console.log(`${ticker} Earnings`);
    if (d.earnings_date) console.log(`  Next: ${d.earnings_date} (${d.fiscal_quarter || ""})`);
    if (d.eps_estimate != null) console.log(`  EPS Estimate: $${d.eps_estimate}`);
    if (d.revenue_estimate != null) console.log(`  Revenue Estimate: $${(d.revenue_estimate / 1e9).toFixed(1)}B`);
  });
}

async function cmdInsider(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: polaris insider <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ticker/${encodeURIComponent(ticker)}/insider`);

  output(data, d => {
    console.log(`${ticker} Insider Activity (${d.total || 0} filings)\n`);
    for (const t of (d.transactions || []).slice(0, 10)) {
      const type = t.transaction_type || t.type || "Filing";
      const value = t.value ? `$${(t.value / 1e6).toFixed(1)}M` : "";
      console.log(`  ${(t.date || "").slice(0, 10)}  ${(t.insider_name || "").padEnd(25)}  ${type.padEnd(10)}  ${value}`);
    }
  });
}

async function cmdSignal(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: polaris signal <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ask?q=${encodeURIComponent(ticker + " analysis")}`);

  output(data, d => {
    const ts = d.trade_signal;
    if (ts) {
      console.log(`${ticker} Trade Signal: ${ts.action.toUpperCase()} (${ts.score}/100)\n`);
      for (const f of ts.factors || []) console.log(`  - ${f}`);
    } else {
      console.log(`${ticker}: No trade signal available`);
    }
    if (d.summary) {
      console.log();
      // Print just the bottom line
      for (const line of d.summary.split("\n")) {
        if (line.includes("Bottom line")) { console.log(line.replace(/[>#*]/g, "").trim()); break; }
      }
    }
  });
}

async function cmdMarket(_args) {
  const data = await api(`/api/v1/ask?q=${encodeURIComponent("how is the market doing")}`);

  output(data, d => {
    if (d.summary) console.log(d.summary);
  });
}

async function cmdNews(args) {
  const query = args.join(" ") || "latest";
  const data = await api(`/api/v1/search?q=${encodeURIComponent(query)}&per_page=10`);

  output(data, d => {
    const briefs = d.results || d.briefs || [];
    console.log(`${d.total || briefs.length} results for "${query}"\n`);
    for (const b of briefs.slice(0, 10)) {
      const conf = b.confidence ? ` [${(b.confidence * 100).toFixed(0)}%]` : "";
      console.log(`  ${b.headline || b.title}${conf}`);
      if (b.summary) console.log(`    ${b.summary.slice(0, 120)}`);
      console.log();
    }
  });
}

async function cmdVerify(args) {
  const claim = args.join(" ");
  if (!claim) { console.error("Usage: polaris verify <claim>"); process.exit(1); }

  const data = await api("/api/v1/verify", "POST", { claim });

  output(data, d => {
    const icon = d.verdict === "supported" ? "SUPPORTED" : d.verdict === "contradicted" ? "CONTRADICTED" : "UNVERIFIABLE";
    console.log(`${icon} (confidence: ${d.confidence})\n`);
    if (d.summary) console.log(`  ${d.summary}\n`);
    console.log(`  Sources analyzed: ${d.sources_analyzed} | Briefs matched: ${d.briefs_matched}`);
  });
}

async function cmdFull(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: polaris full <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ticker/${encodeURIComponent(ticker)}/full`);
  output(data, d => console.log(JSON.stringify(d, null, 2)));
}

async function cmdTechnicals(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: polaris technicals <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ticker/${encodeURIComponent(ticker)}/technicals`);

  output(data, d => {
    const sig = d.signal_summary || {};
    const lat = d.latest || {};
    console.log(`${ticker} Technicals\n`);
    if (sig.overall) console.log(`  Signal: ${sig.overall} (${sig.buy} buy, ${sig.sell} sell, ${sig.neutral} neutral)`);
    if (lat.rsi_14 != null) console.log(`  RSI(14): ${lat.rsi_14.toFixed(1)}`);
    if (lat.sma_20 != null) console.log(`  SMA(20): $${lat.sma_20.toFixed(2)}`);
    if (lat.sma_50 != null) console.log(`  SMA(50): $${lat.sma_50.toFixed(2)}`);
    if (lat.macd) console.log(`  MACD: ${lat.macd.macd?.toFixed(2)} / Signal: ${lat.macd.signal?.toFixed(2)}`);
  });
}

async function cmdSearch(args) {
  const query = args.join(" ");
  if (!query) { console.error("Usage: polaris search <query>"); process.exit(1); }
  return cmdNews(args);
}

// ── Help ──

function printHelp() {
  console.log(`
Polaris CLI — Financial intelligence from your terminal.
The trust layer for AI agents. Starting with finance.

USAGE
  polaris <command> [args] [--human] [--json] [--verbose]

COMMANDS
  ask <question>              Ask any financial question (natural language)
  price <TICKER>              Live price
  screen <criteria>           NLP stock screener ("oversold semiconductors")
  compare <T1> <T2> [T3...]  Side-by-side comparison
  earnings <TICKER>           Next earnings date + estimates
  insider <TICKER>            Insider transactions
  signal <TICKER>             Trade readiness signal (0-100)
  technicals <TICKER>         Technical indicators + signal summary
  full <TICKER>               Everything about a ticker (9 sources)
  market                      Market overview + indices
  news <query>                Search intelligence briefs
  search <query>              Alias for news
  verify <claim>              Fact-check against brief corpus

OUTPUT
  JSON by default (agent-first). Use --human for formatted output.

AUTH
  export POLARIS_API_KEY=pr_live_xxx
  Get a free key: https://thepolarisreport.com/pricing

EXAMPLES
  polaris ask "What's happening with NVDA?"
  polaris screen "low RSI semiconductors" --human
  polaris signal MSFT
  polaris compare AAPL MSFT GOOGL --human
  polaris earnings TSLA --json
  polaris market --human

DOCS
  https://thepolarisreport.com/docs
  https://github.com/Polaris-API/polaris-cli
`.trim());
}
