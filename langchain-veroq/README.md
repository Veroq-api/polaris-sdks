# langchain-veroq

> **New:** VeroQ 2.0 adds Verified Swarm (multi-agent pipelines), Agent Runtime (finance/legal/research/compliance verticals), and secure external MCP integration. Available via the [MCP server](https://www.npmjs.com/package/veroq-mcp) and [SDKs](https://veroq.ai/docs).

LangChain tools for the [VEROQ Intelligence API](https://veroq.ai) -- verified intelligence with confidence scores, bias ratings, and source analysis.

## Installation

```bash
pip install langchain-veroq
```

## Quick Start

```python
from langchain_veroq import VeroqAskTool, VeroqVerifyTool

tools = [VeroqAskTool(), VeroqVerifyTool()]
# Use with any LangChain agent
```

Two tools cover 90% of use cases:

- **`VeroqAskTool`** -- ask any financial question in natural language
- **`VeroqVerifyTool`** -- fact-check any claim against verified intelligence

### Full Agent Example

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_veroq import VeroqAskTool, VeroqVerifyTool, VeroqSearchTool

tools = [
    VeroqAskTool(api_key="your-api-key"),
    VeroqVerifyTool(api_key="your-api-key"),
    VeroqSearchTool(api_key="your-api-key"),
]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a financial research assistant with access to verified intelligence."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

llm = ChatOpenAI(model="gpt-5.4")
agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

# Ask anything
result = executor.invoke({"input": "How is NVDA doing?"})
print(result["output"])

# Verify a claim
result = executor.invoke({"input": "Is it true that NVIDIA beat Q4 earnings?"})
print(result["output"])
```

## Environment Variables

The tools accept `api_key` in the constructor. If omitted, the SDK checks these environment variables in order:

1. `VEROQ_API_KEY`
2. `POLARIS_API_KEY`

## RAG with VeroqRetriever

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_veroq import VeroqRetriever

retriever = VeroqRetriever(api_key="your-api-key", category="ai_ml", limit=5)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | ChatPromptTemplate.from_template(
        "Answer based on these verified briefs:\n\n{context}\n\nQuestion: {question}"
    )
    | ChatOpenAI(model="gpt-5.4")
    | StrOutputParser()
)

print(chain.invoke("Latest developments in AI?"))
```

## Available Tools

| Tool | Description |
|------|-------------|
| **`VeroqAskTool`** | **Ask any financial question in natural language** |
| **`VeroqVerifyTool`** | **Fact-check a claim against verified intelligence** |
| `VeroqSearchTool` | Search verified intelligence across 18 verticals |
| `VeroqFullTool` | Cross-reference data from 9 sources |
| `VeroqFeedTool` | Get latest briefs, filtered by category or source |
| `VeroqBriefTool` | Get a specific brief by ID with full analysis |
| `VeroqEntityTool` | Look up entities mentioned in coverage |
| `VeroqExtractTool` | Extract clean article content from URLs |
| `VeroqCompareTool` | Compare outlet coverage of the same story |
| `VeroqForecastTool` | AI-generated forecast for a topic |
| `VeroqResearchTool` | Deep research report on a query |
| `VeroqTrendingTool` | Trending topics across categories |
| `VeroqContradictionsTool` | Find contradictions across sources |
| `VeroqEventsTool` | Key events timeline for a topic |
| `VeroqWebSearchTool` | Search the open web |
| `VeroqCrawlTool` | Crawl and extract from a URL |
| `VeroqTickerTool` | Market data for a stock/crypto ticker |
| `VeroqTickerResolveTool` | Resolve company name to ticker symbol |
| `VeroqTickerScoreTool` | Sentiment score for a ticker |
| `VeroqSectorsTool` | Sector-level market analysis |
| `VeroqPortfolioFeedTool` | News feed filtered to a portfolio |
| `VeroqEventsCalendarTool` | Upcoming market-moving events |
| `VeroqCandlesTool` | OHLCV candle data |
| `VeroqTechnicalsTool` | Technical indicators for a ticker |
| `VeroqMarketMoversTool` | Top market movers |
| `VeroqEconomyTool` | Economic indicators (GDP, CPI, etc.) |
| `VeroqCryptoTool` | Crypto market data |
| `VeroqDefiTool` | DeFi protocol data |
| `VeroqInsiderTool` | Insider trading data |
| `VeroqFilingsTool` | SEC filings |
| `VeroqAnalystsTool` | Analyst ratings and price targets |
| `VeroqCongressTool` | Congressional trading data |
| `VeroqInstitutionsTool` | Institutional holdings |
| `VeroqRunAgentTool` | Run a marketplace agent |
| `VeroqRetriever` | LangChain retriever for RAG pipelines |

## Backward Compatibility

This package also exports all tools under their original `Polaris*` names for backward compatibility. Both `VeroqSearchTool` and `PolarisSearchTool` work identically.

## Documentation

Full API docs at [veroq.ai/docs](https://veroq.ai/docs)
