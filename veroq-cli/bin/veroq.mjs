#!/usr/bin/env node

// ============================================================
// VEROQ CLI — Verified intelligence from your terminal
// ============================================================
// The truth protocol for agentic AI. Starting with finance.
//
// Usage:
//   veroq ask "What's happening with NVDA?"
//   veroq price NVDA
//   veroq screen "oversold semiconductors"
//   veroq compare AAPL MSFT
//   veroq earnings TSLA
//   veroq insider NVDA
//   veroq signal MSFT
//   veroq market
//   veroq news "AI stocks"
//   veroq verify "Tesla delivered 1.8M vehicles"
//   veroq test prompts.json --threshold 0.7
//
// Auth:
//   export VEROQ_API_KEY=pr_live_xxx
//   # or: export POLARIS_API_KEY=pr_live_xxx (backwards compatible)
//   veroq ask "NVDA earnings"
//
// Output:
//   JSON by default (agent-first). Use --human for formatted output.
// ============================================================

const API = process.env.VEROQ_API_URL || process.env.POLARIS_API_URL || "https://api.veroq.ai";
const KEY = process.env.VEROQ_API_KEY || process.env.POLARIS_API_KEY || "";

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

// Flags
const jsonMode = !args.includes("--human");
const humanMode = args.includes("--human");
const verbose = args.includes("--verbose") || args.includes("-v");
const lineageMode = args.includes("--lineage");
const thresholdIdx = args.indexOf("--threshold");
const thresholdArg = thresholdIdx >= 0 ? parseFloat(args[thresholdIdx + 1]) : null;
const cleanArgs = args.filter((a, i) => !a.startsWith("--") && !a.startsWith("-v") && (thresholdIdx < 0 || i !== thresholdIdx + 1));

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "version" || command === "--version") {
  console.log("@veroq/cli v2.0.0");
  process.exit(0);
}

if (!KEY && command !== "help") {
  console.error("Set your API key: export VEROQ_API_KEY=pr_live_xxx");
  console.error("  (or: export POLARIS_API_KEY=pr_live_xxx)");
  console.error("Get one free at https://veroq.ai/pricing");
  process.exit(1);
}

// ── Commands ──

const commands = {
  ask: cmdAsk,
  "/ask": cmdAsk,
  price: cmdPrice,
  screen: cmdScreen,
  compare: cmdCompare,
  earnings: cmdEarnings,
  insider: cmdInsider,
  signal: cmdSignal,
  market: cmdMarket,
  news: cmdNews,
  verify: cmdVerify,
  "/verify": cmdVerify,
  full: cmdFull,
  technicals: cmdTechnicals,
  search: cmdSearch,
  shield: cmdShield,
  "/shield": cmdShield,
  swarm: cmdSwarm,
  "/swarm": cmdSwarm,
  analyze: cmdAnalyze,
  "/analyze": cmdAnalyze,
  feedback: cmdFeedback,
  "/feedback": cmdFeedback,
  consolidate: cmdConsolidate,
  "shield-doc": cmdShieldDoc,
  "/shield-doc": cmdShieldDoc,
  test: cmdTest,
  "/test": cmdTest,
};

const handler = commands[command];
if (!handler) {
  console.error(`Unknown command: ${command}`);
  console.error('Run "veroq help" for usage.');
  process.exit(1);
}

// Pass full args (not cleanArgs) so commands can parse their own --flags
handler(args.slice(1)).catch(err => {
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

// ── Decision Lineage ──

function computeLineage(toolName, input, output) {
  const start = performance.now();
  const question = String(input.question || input.claim || '');
  const highStakes = /\bshould\s+(i|we)\s+(buy|sell|trade|invest)\b/i.test(question);
  const tradeScore = output?.trade_signal?.score || 0;
  const escalated = tradeScore > 80;
  const decision = escalated ? 'escalate' : highStakes ? 'review' : 'allow';
  const durationMs = Math.round(performance.now() - start);
  return { decision, highStakes, escalated, rulesEvaluated: 2, durationMs };
}

function printLineage(lineage) {
  console.log();
  console.log(`Decision: ${lineage.decision} | High-stakes: ${lineage.highStakes} | Escalated: ${lineage.escalated}`);
  console.log(`Rules evaluated: ${lineage.rulesEvaluated} | Duration: ${lineage.durationMs}ms`);
}

// ── Command Implementations ──

async function cmdAsk(args) {
  const question = args.join(" ");
  if (!question) { console.error("Usage: veroq ask <question>"); process.exit(1); }

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

  if (lineageMode) {
    printLineage(computeLineage('ask', { question }, data));
  }
}

async function cmdPrice(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: veroq price <TICKER>"); process.exit(1); }

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
  if (!query) { console.error("Usage: veroq screen <criteria>"); process.exit(1); }

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
  if (args.length < 2) { console.error("Usage: veroq compare <TICKER1> <TICKER2> [TICKER3...]"); process.exit(1); }

  const tickers = args.map(t => t.toUpperCase()).slice(0, 5);
  const question = tickers.join(" vs ");
  const data = await api(`/api/v1/ask?q=${encodeURIComponent(question)}`);

  output(data, d => {
    if (d.summary) console.log(d.summary);
  });
}

async function cmdEarnings(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: veroq earnings <TICKER>"); process.exit(1); }

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
  if (!ticker) { console.error("Usage: veroq insider <TICKER>"); process.exit(1); }

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
  if (!ticker) { console.error("Usage: veroq signal <TICKER>"); process.exit(1); }

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
  if (!claim) { console.error("Usage: veroq verify <claim>"); process.exit(1); }

  const data = await api("/api/v1/verify", "POST", { claim });

  output(data, d => {
    const icon = d.verdict === "supported" ? "SUPPORTED" : d.verdict === "contradicted" ? "CONTRADICTED" : "UNVERIFIABLE";
    console.log(`${icon} (confidence: ${d.confidence})\n`);
    if (d.summary) console.log(`  ${d.summary}\n`);
    console.log(`  Sources analyzed: ${d.sources_analyzed} | Briefs matched: ${d.briefs_matched}`);
  });

  if (lineageMode) {
    printLineage(computeLineage('verify', { claim }, data));
  }
}

async function cmdFull(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: veroq full <TICKER>"); process.exit(1); }

  const data = await api(`/api/v1/ticker/${encodeURIComponent(ticker)}/full`);
  output(data, d => console.log(JSON.stringify(d, null, 2)));
}

async function cmdTechnicals(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: veroq technicals <TICKER>"); process.exit(1); }

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
  if (!query) { console.error("Usage: veroq search <query>"); process.exit(1); }
  return cmdNews(args);
}

// ── Help ──

function printHelp() {
  console.log(`
VEROQ CLI v2.0 — Verified multi-agent platform from your terminal.
The truth protocol for agentic AI. Starting with finance.

  Verified Swarm and Agent Runtime available via the API — see veroq.ai/docs

USAGE
  veroq <command> [args] [--human] [--json] [--verbose] [--lineage]

COMMANDS
  ask <question>              Ask any financial question (natural language)
  verify <claim>              Fact-check a claim against verified intelligence
  shield <text>               Verify any LLM output — extract + check claims
  swarm <query>               Run 5-agent verified analysis pipeline
  analyze <TICKER>            Deep analysis (swarm-backed /ask with deep=true)
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
  shield-doc <text> [--type]  Verify document text (pdf, transcript, filing)
  feedback [--session] [--reason] [--detail]  Submit feedback
  consolidate <agent_id>      Compress old memories into snapshot
  test <file.json>            CI/CD shield — verify AI outputs from test file
                              Exits with code 1 if any test fails threshold

OUTPUT
  JSON by default (agent-first). Use --human for formatted output.
  Use --lineage with ask/verify to show enterprise decision lineage.

AUTH
  export VEROQ_API_KEY=pr_live_xxx
  # or (backwards compatible):
  export POLARIS_API_KEY=pr_live_xxx

  Get a free key: https://veroq.ai/pricing

EXAMPLES
  veroq ask "How is NVDA doing?"
  veroq verify "NVIDIA beat Q4 earnings"
  veroq shield "NVIDIA reported $22B in Q4 revenue"
  veroq swarm "Analyze NVDA for a long position"
  veroq /analyze NVDA
  veroq feedback --session swarm_123 --reason data_gap --detail "Missing insider data"
  veroq screen "low RSI semiconductors" --human
  veroq signal MSFT
  veroq compare AAPL MSFT GOOGL --human
  veroq market --human
  veroq shield-doc "Revenue was $5.2B..." --type filing
  veroq test veroq-tests.json --threshold 0.7

DOCS
  https://veroq.ai/docs
`.trim());
}

// ── Slash commands ──

async function cmdShield(args) {
  const text = args.join(" ");
  if (!text) { console.error("Usage: veroq shield <text to verify>"); process.exit(1); }

  const data = await api("/api/v1/verify/output", "POST", { text, source: "cli", max_claims: 5 });

  output(data, d => {
    console.log(`Trust: ${Math.round((d.overall_confidence || 0) * 100)}% | Verdict: ${d.overall_verdict || "unknown"}\n`);
    console.log(`Claims: ${d.claims_extracted} extracted, ${d.claims_supported || 0} supported, ${d.claims_contradicted || 0} contradicted\n`);
    if (d.summary) console.log(`  ${d.summary}\n`);
    for (const c of (d.claims || [])) {
      const icon = c.verdict === "supported" ? "✓" : c.verdict === "contradicted" ? "✗" : "?";
      console.log(`  [${icon}] ${c.text}`);
      if (c.correction) console.log(`    → ${c.correction}`);
      if (c.receipt_id) console.log(`    Receipt: ${c.receipt_id}`);
    }
  });
}

async function cmdShieldDoc(args) {
  const VALID_TYPES = ["pdf", "transcript", "filing", "article", "report"];
  let sourceType = "pdf";
  let textArgs = [];

  // Parse --type flag
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) {
      sourceType = args[i + 1].toLowerCase();
      i++; // skip value
    } else if (!args[i].startsWith("--")) {
      textArgs.push(args[i]);
    }
  }

  const text = textArgs.join(" ");
  if (!text) {
    console.error("Usage: veroq shield-doc <text> [--type pdf|transcript|filing|article|report]");
    console.error("");
    console.error("Verify extracted document text. The client extracts text; VeroQ verifies claims.");
    console.error("  --type    Document type (default: pdf)");
    process.exit(1);
  }

  if (!VALID_TYPES.includes(sourceType)) {
    console.error(`Invalid type: ${sourceType}. Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  const data = await api("/api/v1/verify/output", "POST", {
    text,
    source: "cli",
    source_type: sourceType,
    max_claims: 5,
  });

  output(data, d => {
    console.log(`Document type: ${d.source_type || sourceType}`);
    console.log(`Trust: ${Math.round((d.overall_confidence || 0) * 100)}% | Verdict: ${d.overall_verdict || "unknown"}\n`);
    console.log(`Claims: ${d.claims_extracted} extracted, ${d.claims_supported || 0} supported, ${d.claims_contradicted || 0} contradicted\n`);
    if (d.summary) console.log(`  ${d.summary}\n`);
    for (const c of (d.claims || [])) {
      const icon = c.verdict === "supported" ? "+" : c.verdict === "contradicted" ? "x" : "?";
      console.log(`  [${icon}] ${c.text}`);
      if (c.correction) console.log(`    -> ${c.correction}`);
      if (c.receipt_id) console.log(`    Receipt: ${c.receipt_id}`);
    }
  });
}

async function cmdSwarm(args) {
  const query = args.join(" ");
  if (!query) { console.error("Usage: veroq swarm <query>"); process.exit(1); }

  const data = await api("/api/v1/swarm/run", "POST", {
    query,
    roles: ["planner", "researcher", "verifier", "critic", "synthesizer"],
  });

  output(data, d => {
    console.log(`Swarm: ${d.steps?.length || 0} steps | Credits: ${d.total_credits_used}\n`);
    for (const s of (d.steps || [])) {
      const summary = (s.summary || "").replace(/[#*|]/g, "").replace(/\n{2,}/g, " ").trim().slice(0, 150);
      console.log(`  [${s.role}] ${summary}`);
    }
    const vs = d.verification_summary;
    if (vs) console.log(`\n  Verified: ${vs.steps_verified}/${vs.steps_total} | Confidence: ${vs.avg_confidence}%`);
    if (d.shield) console.log(`  Shield: trust=${d.shield.trust_score} corrections=${d.shield.corrections?.length || 0}`);
    if (d.synthesis?.summary) {
      const syn = d.synthesis.summary.replace(/[#*|]/g, "").replace(/\n{2,}/g, " ").trim().slice(0, 300);
      console.log(`\n  Synthesis: ${syn}`);
    }
  });
}

async function cmdAnalyze(args) {
  const ticker = args[0]?.toUpperCase();
  if (!ticker) { console.error("Usage: veroq analyze <TICKER>"); process.exit(1); }

  const data = await api("/api/v1/ask", "POST", { question: `Full analysis of ${ticker}`, deep: true });

  output(data, d => {
    console.log(`Deep Analysis: ${ticker}\n`);
    if (d.summary) {
      const clean = d.summary.replace(/[#*|]/g, "").replace(/\n{2,}/g, "\n").trim().slice(0, 500);
      console.log(clean);
    }
    if (d.trade_signal) console.log(`\n  Signal: ${d.trade_signal.action?.toUpperCase()} (${d.trade_signal.score}/100)`);
    if (d.verification_summary) console.log(`  Verified: ${d.verification_summary.steps_verified}/${d.verification_summary.steps_total} steps`);
  });
}

async function cmdFeedback(args) {
  const sessionIdx = args.indexOf("--session");
  const reasonIdx = args.indexOf("--reason");
  const detailIdx = args.indexOf("--detail");

  const sessionId = sessionIdx >= 0 ? args[sessionIdx + 1] : null;
  const reason = reasonIdx >= 0 ? args[reasonIdx + 1] : "manual";
  const detail = detailIdx >= 0 ? args.slice(detailIdx + 1).join(" ") : args.filter(a => !a.startsWith("--")).join(" ");

  if (!sessionId && !detail) { console.error("Usage: veroq feedback --session <id> --reason <reason> --detail <detail>"); process.exit(1); }

  const data = await api("/api/v1/feedback", "POST", {
    session_id: sessionId || "cli",
    query: detail || "CLI feedback",
    reason: reason || "manual",
    detail: detail || "Submitted via CLI",
  });

  output(data, d => {
    console.log(`Feedback submitted: ${d.feedback_id || "ok"}`);
  });
}

async function cmdConsolidate(args) {
  const agentId = args[0];
  if (!agentId) { console.error("Usage: veroq consolidate <agent_id>"); process.exit(1); }

  const data = await api("/api/v1/memory/consolidate", "POST", { agent_id: agentId });

  output(data, d => {
    console.log(`Consolidated: ${d.consolidated} memories → snapshot`);
    if (d.tickers_covered?.length) console.log(`  Tickers: ${d.tickers_covered.join(", ")}`);
    if (d.avg_confidence) console.log(`  Avg confidence: ${d.avg_confidence}`);
  });
}

// ── CI/CD Shield ──

async function cmdTest(args) {
  const filePath = args[0];
  if (!filePath) {
    console.error("Usage: veroq test <file.json> [--threshold 0.7]");
    console.error("");
    console.error("Test file format (JSON):");
    console.error('  { "threshold": 0.7, "tests": [');
    console.error('    { "name": "test name", "text": "AI output to verify", "source": "gpt-5.4" }');
    console.error("  ]}");
    process.exit(1);
  }

  // Read and parse test file
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");

  const absPath = resolve(filePath);
  let raw;
  try {
    raw = readFileSync(absPath, "utf-8");
  } catch (err) {
    console.error(`Cannot read test file: ${absPath}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  let suite;
  try {
    suite = JSON.parse(raw);
  } catch (err) {
    console.error(`Cannot parse test file as JSON: ${err.message}`);
    process.exit(1);
  }

  const tests = suite.tests || [];
  if (tests.length === 0) {
    console.error("No tests found in file. Expected { tests: [...] }");
    process.exit(1);
  }

  // Threshold: CLI flag > file-level > default 0.7
  const threshold = thresholdArg ?? suite.threshold ?? 0.7;

  console.log(`\nVeroQ Shield Test — ${tests.length} test(s), threshold: ${threshold}\n`);

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const t of tests) {
    const name = t.name || t.text?.slice(0, 40) || "unnamed";
    const text = t.text;
    if (!text) {
      console.log(`  SKIP  ${name} (no text)`);
      continue;
    }

    try {
      const data = await api("/api/v1/verify/output", "POST", {
        text,
        source: t.source || "ci",
        max_claims: t.max_claims || 10,
      });

      const trust = data.overall_confidence || 0;
      const verdict = data.overall_verdict || "unknown";
      const pass = trust >= threshold;

      if (pass) {
        passed++;
        console.log(`  PASS  ${name}  (trust: ${(trust * 100).toFixed(0)}%, verdict: ${verdict})`);
      } else {
        failed++;
        console.log(`  FAIL  ${name}  (trust: ${(trust * 100).toFixed(0)}%, verdict: ${verdict}, threshold: ${(threshold * 100).toFixed(0)}%)`);
        // Show claim-level detail on failure
        for (const c of (data.claims || [])) {
          const icon = c.verdict === "supported" ? "+" : c.verdict === "contradicted" ? "x" : "?";
          console.log(`        [${icon}] ${c.text}`);
          if (c.correction) console.log(`            -> ${c.correction}`);
        }
      }

      results.push({ name, trust, verdict, pass, claims: data.claims_extracted || 0, credits: data.credits_used || 0 });
    } catch (err) {
      failed++;
      console.log(`  FAIL  ${name}  (error: ${err.message})`);
      results.push({ name, trust: 0, verdict: "error", pass: false, error: err.message });
    }
  }

  // Summary
  const totalCredits = results.reduce((s, r) => s + (r.credits || 0), 0);
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed | Credits used: ${totalCredits}\n`);

  // JSON output for CI parsing
  if (jsonMode) {
    console.log(JSON.stringify({ threshold, total: passed + failed, passed, failed, results }, null, 2));
  }

  // Exit with code 1 if any test failed — breaks CI pipeline
  if (failed > 0) process.exit(1);
}
