# @veroq/sdk

**Verified AI. One function call.** Stop shipping hallucinations.

Official TypeScript SDK for [VeroQ](https://veroq.ai). `shield()` any LLM output — every claim fact-checked with evidence chains, confidence scores, and verification receipts.

> Migrating from `polaris-news-api`? Drop-in replacement — just change your import.

## Prompt Shield — One Line to Verify Any LLM

```typescript
import { shield } from "@veroq/sdk";

const result = await shield("NVIDIA reported $22B in Q4 revenue");
console.log(result.trustScore);    // 0.73
console.log(result.isTrusted);     // false — claims contradicted
console.log(result.corrections);   // [{claim: "...", correction: "actual revenue was $68B"}]
console.log(result.verifiedText);  // text with corrections inline
console.log(result.receiptIds);    // ["vr_abc123"] — permanent proof
```

Works with any LLM. One function. Every claim fact-checked.

## Installation

```bash
npm install @veroq/sdk
```

## Quick Start

```typescript
import { VeroqClient } from "@veroq/sdk";

const client = new VeroqClient(); // uses VEROQ_API_KEY env var

// Ask anything — routes to 41 intents automatically
const answer = await client.ask("How is NVDA doing?");
console.log(answer.summary);
console.log(answer.trade_signal); // { action: "hold", score: 55 }

// Verify any claim — evidence chains + confidence breakdown
const result = await client.verify("NVIDIA beat Q4 earnings by 20%");
console.log(result.verdict);          // "supported"
console.log(result.confidence);       // 0.92
console.log(result.evidence_chain);   // [{ source: "Reuters", ... }]

// Stream in real-time
for await (const event of client.askStream("AAPL technicals")) {
  if (event.type === "summary_token") process.stdout.write(event.data.token);
}
```

## Multi-Agent Workflows

```typescript
// Verified Swarm — 5 agents with automatic verification
const swarm = await client.createVerifiedSwarm("Analyze NVDA for a long position", {
  roles: ["planner", "researcher", "verifier", "critic", "synthesizer"],
  escalationThreshold: 75,
  creditBudget: 30,
});
console.log(swarm.synthesis.summary);
console.log(swarm.budget);              // { spent: 12, remaining: 18 }
console.log(swarm.verificationSummary); // { avgConfidence: 82 }

// Domain-specific runtime
const legal = await client.createRuntime("GDPR data retention requirements", {
  vertical: "legal",
  costMode: "premium",
});
```

## External Tool Calls

```typescript
const result = await client.callExternalTool("alphavantage", "get_quote", { symbol: "NVDA" });
// Permission engine → rate limiter → cache → execution → audit
```

## Self-Improvement Feedback

```typescript
await client.submitFeedback({
  sessionId: swarm.sessionId,
  query: "NVDA analysis",
  reason: "data_gap",
  detail: "Missing Q4 insider trading data",
});
```

## Enterprise Features

```typescript
client.configureEnterprise({
  enterpriseId: "acme-capital",
  escalationThreshold: 80,
  escalationPauses: true,
  sessionId: "trading-session-001",
  deniedTools: ["backtest"],
  reviewTools: ["ask", "verify"],
});

const lineage = client.getDecisionLineage("ask", { question: "Should we buy NVDA?" }, answer);
console.log(lineage.decision);   // "review" — high-stakes detected
console.log(lineage.escalated);  // true if trade signal exceeds threshold

const trail = client.getAuditTrail("trading-session-001");
```

## Why VeroQ?

| | What you get |
|---|---|
| **Trust** | Evidence chains and confidence breakdowns on every response |
| **Safety** | Permission engine, decision lineage, human-in-the-loop escalation |
| **Cost control** | 3 cost modes, per-step budgets, credit transparency |
| **Continuous improvement** | Feedback loop with web search fallback fills data gaps over time |
| **Multi-domain** | Finance (flagship), legal, research, compliance, custom verticals |

## Cached Shield — High-Volume Pipelines

```typescript
import { CachedShield } from "@veroq/sdk";

const cached = new CachedShield({ maxCache: 1000, ttlMs: 3_600_000 });
const r1 = await cached.shield("NVIDIA reported $22B in Q4 revenue"); // API call
const r2 = await cached.shield("NVIDIA reported $22B in Q4 revenue"); // instant, 0 credits
console.log(cached.stats()); // { hits: 1, misses: 1, hitRate: 0.5, size: 1 }
```

## Agent Monitoring

```typescript
// Set up autonomous monitoring
await client.agentAutoMonitor("my-bot", { trustThreshold: 0.7, checkIntervalHours: 6 });

// Manual health check
const health = await client.agentHealthCheck("my-bot");
console.log(health.health.status);      // "healthy" or "degraded"
console.log(health.health.trustTrend);  // "improving" / "declining" / "stable"
```

## All Methods

| Method | Description |
|--------|-------------|
| `shield(text)` | Verify any LLM output (module-level) |
| `CachedShield` | Local LRU cache for high-volume shield calls |
| `ask(question)` | Ask any financial question |
| `askStream(question)` | Stream via SSE |
| `verify(claim)` | Fact-check with evidence chain |
| `verifyOutput(text)` | Extract + verify claims from any text |
| `createVerifiedSwarm(query, options)` | Multi-agent verified pipeline |
| `createRuntime(query, options)` | Domain-specific runtime |
| `callExternalTool(serverId, tool, params)` | Secure external tool proxy |
| `submitFeedback(feedback)` | Self-improvement feedback |
| `memoryStore(agentId, key, value)` | Store agent memory |
| `memoryRecall(agentId)` | Recall agent memories |
| `memoryList(agentId)` | List all agent memories |
| `agentAutoMonitor(agentId)` | Configure autonomous monitoring |
| `agentHealthCheck(agentId)` | Trigger health check |
| `watch(options)` | Real-time SSE verification stream |
| `configureEnterprise(config)` | Enterprise governance |
| `getDecisionLineage(tool, input, output)` | Decision audit |
| `getAuditTrail(sessionId?)` | Audit trail |
| `feed()` / `brief(id)` / `search(query)` | Intelligence briefs |
| `stream(options?)` | Stream briefs via SSE |

## Error Handling

```typescript
import { AuthenticationError, RateLimitError, NotFoundError } from "@veroq/sdk";

try {
  await client.ask("NVDA analysis");
} catch (e) {
  if (e instanceof RateLimitError) console.log(`Retry after: ${e.retryAfter}s`);
}
```

## Links

- [API Reference](https://veroq.ai/docs) | [MCP Server](https://www.npmjs.com/package/veroq-mcp) | [Python SDK](https://pypi.org/project/veroq/) | [Enterprise](https://veroq.ai/pricing)
