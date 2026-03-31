# veroq

Official Python SDK for [VeroQ](https://veroq.ai) — the verified intelligence layer for AI agents.

Every claim is fact-checked with evidence chains. Every output includes confidence scores. Enterprise customers get decision lineage, escalation triggers, and full audit trails.

> Migrating from `polaris-news`? Drop-in replacement — just change your import.

## Installation

```bash
pip install veroq
```

## Quick Start

```python
from veroq import VeroqClient

client = VeroqClient()  # uses VEROQ_API_KEY env var

# Ask anything — routes to 41 intents automatically
answer = client.ask("How is NVDA doing?")
print(answer["summary"])
print(answer["trade_signal"])  # { action: "hold", score: 55 }

# Verify any claim — evidence chains + confidence breakdown
result = client.verify("NVIDIA beat Q4 earnings by 20%")
print(result["verdict"])          # "supported"
print(result["confidence"])       # 0.92
print(result["evidence_chain"])   # [{ source: "Reuters", ... }]

# Stream in real-time
for event in client.ask_stream("AAPL price and technicals"):
    if event["type"] == "summary_token":
        print(event["data"]["token"], end="", flush=True)
```

## Multi-Agent Workflows

```python
# Verified Swarm — 5 agents with automatic verification
swarm = client.create_verified_swarm(
    "Analyze NVDA for a long position",
    roles=["planner", "researcher", "verifier", "critic", "synthesizer"],
    escalation_threshold=75,
    credit_budget=30,
)
print(swarm["synthesis"]["summary"])
print(swarm["budget"])                # { spent: 12, remaining: 18 }
print(swarm["verification_summary"])  # { avg_confidence: 82 }

# Domain-specific runtime
legal = client.create_runtime(
    "GDPR data retention requirements",
    vertical="legal",
    cost_mode="premium",
)
```

## External Tool Calls

```python
result = client.call_external_tool("alphavantage", "get_quote", {"symbol": "NVDA"})
# Permission engine → rate limiter → cache → execution → audit
```

## Self-Improvement Feedback

```python
client.submit_feedback(
    session_id=swarm["session_id"],
    query="NVDA analysis",
    reason="data_gap",
    detail="Missing Q4 insider trading data",
)
```

## Enterprise Features

```python
client.configure_enterprise({
    "enterprise_id": "acme-capital",
    "escalation_threshold": 80,
    "escalation_pauses": True,
    "session_id": "trading-session-001",
})

lineage = client.get_decision_lineage("ask", {"question": "Should I buy NVDA?"})
print(lineage["decision"])     # "review" — high-stakes detected

trail = client.get_audit_trail(session_id="trading-session-001")
```

## Why VeroQ?

| | What you get |
|---|---|
| **Trust** | Evidence chains and confidence breakdowns on every response |
| **Safety** | Permission engine, decision lineage, human-in-the-loop escalation |
| **Cost control** | 3 cost modes, per-step budgets, credit transparency |
| **Continuous improvement** | Feedback loop with web search fallback fills data gaps over time |
| **Multi-domain** | Finance (flagship), legal, research, compliance, custom verticals |

## All Methods

| Method | Description |
|--------|-------------|
| `ask(question)` | Ask any financial question |
| `ask_stream(question)` | Stream via SSE |
| `verify(claim)` | Fact-check with evidence chain |
| `create_verified_swarm(query, ...)` | Multi-agent verified pipeline |
| `create_runtime(query, ...)` | Domain-specific runtime |
| `call_external_tool(server_id, tool, params)` | Secure external tool proxy |
| `submit_feedback(...)` | Self-improvement feedback |
| `configure_enterprise(config)` | Enterprise governance |
| `get_decision_lineage(tool, input, output)` | Decision audit |
| `get_audit_trail(session_id?)` | Audit trail |
| `feed()` / `brief(id)` / `search(query)` | Intelligence briefs |
| `stream(categories?)` | Stream briefs via SSE |

## Error Handling

```python
from veroq import AuthenticationError, RateLimitError, NotFoundError

try:
    client.ask("NVDA analysis")
except RateLimitError as e:
    print(f"Retry after: {e.retry_after}s")
```

## Backward Compatibility

`PolarisClient` aliased to `VeroqClient`. Both `VEROQ_API_KEY` and `POLARIS_API_KEY` supported.

## Links

- [API Reference](https://veroq.ai/docs) | [MCP Server](https://www.npmjs.com/package/veroq-mcp) | [TypeScript SDK](https://www.npmjs.com/package/@veroq/sdk) | [Enterprise](https://veroq.ai/pricing)
