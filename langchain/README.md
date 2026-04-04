# langchain-polaris

LangChain tools for the [Polaris Knowledge API](https://thepolarisreport.com) -- verified intelligence with confidence scores, bias ratings, and source analysis.

## Installation

```bash
pip install langchain-polaris
```

## Quick Start

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_polaris import PolarisSearchTool, PolarisFeedTool, PolarisCompareTool

tools = [
    PolarisSearchTool(api_key="pr_live_xxx"),
    PolarisFeedTool(api_key="pr_live_xxx"),
    PolarisCompareTool(api_key="pr_live_xxx"),
]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a research assistant with access to verified intelligence."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

llm = ChatOpenAI(model="gpt-5.4")
agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

result = executor.invoke({"input": "What's happening with AI regulation?"})
print(result["output"])
```

## RAG with PolarisRetriever

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_polaris import PolarisRetriever

retriever = PolarisRetriever(api_key="pr_live_xxx", category="ai_ml", limit=5)

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
| `PolarisSearchTool` | Search verified intelligence across 18 verticals |
| `PolarisFeedTool` | Get latest briefs, filtered by category or source |
| `PolarisBriefTool` | Get a specific brief by ID with full analysis |
| `PolarisEntityTool` | Look up entities mentioned in coverage |
| `PolarisExtractTool` | Extract clean article content from URLs |
| `PolarisCompareTool` | Compare outlet coverage of the same story |
| `PolarisVerifyTool` | Fact-check a claim against the brief corpus |
| `PolarisForecastTool` | AI-generated forecast for a topic |
| `PolarisResearchTool` | Deep research report on a query |
| `PolarisTrendingTool` | Trending topics across categories |
| `PolarisContradictionsTool` | Find contradictions across sources |
| `PolarisEventsTool` | Key events timeline for a topic |
| `PolarisWebSearchTool` | Search the open web |
| `PolarisCrawlTool` | Crawl and extract from a URL |
| `PolarisTickerTool` | Market data for a stock/crypto ticker |
| `PolarisTickerResolveTool` | Resolve company name to ticker symbol |
| `PolarisTickerScoreTool` | Sentiment score for a ticker |
| `PolarisSectorsTool` | Sector-level market analysis |
| `PolarisPortfolioFeedTool` | News feed filtered to a portfolio |
| `PolarisEventsCalendarTool` | Upcoming market-moving events |
| `PolarisCandlesTool` | OHLCV candle data |
| `PolarisTechnicalsTool` | Technical indicators for a ticker |
| `PolarisMarketMoversTool` | Top market movers |
| `PolarisEconomyTool` | Economic indicators (GDP, CPI, etc.) |
| `PolarisCryptoTool` | Crypto market data |
| `PolarisDefiTool` | DeFi protocol data |
| `PolarisRetriever` | LangChain retriever for RAG pipelines |

## Documentation

Full API docs at [thepolarisreport.com/docs](https://thepolarisreport.com/docs)
