# langchain-polaris

LangChain integration for [The Polaris Report](https://thepolarisreport.com) — verified news intelligence with confidence scores, bias ratings, and source analysis.

## Installation

```bash
pip install langchain-polaris
```

## Quick Start

### Agent with Tools

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_polaris import PolarisSearchTool, PolarisBriefTool, PolarisCompareTool

tools = [
    PolarisSearchTool(api_key="pr_live_xxx"),
    PolarisBriefTool(api_key="pr_live_xxx"),
    PolarisCompareTool(api_key="pr_live_xxx"),
]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a news research assistant with access to verified intelligence."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

llm = ChatOpenAI(model="gpt-5.4")
agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

result = executor.invoke({"input": "What's happening with AI regulation?"})
print(result["output"])
```

### Retriever for RAG

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_polaris import PolarisRetriever

retriever = PolarisRetriever(
    api_key="pr_live_xxx",
    category="ai_ml",
    min_confidence=0.7,
    limit=5,
)

prompt = ChatPromptTemplate.from_template(
    "Answer based on these verified news briefs:\n\n{context}\n\nQuestion: {question}"
)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(model="gpt-5.4")
    | StrOutputParser()
)

print(chain.invoke("What are the latest developments in AI?"))
```

## Tools

| Tool | Description |
|------|-------------|
| `PolarisSearchTool` | Search verified news intelligence across 18 verticals. Supports category filtering and speed tiers (`depth`: fast, standard, deep). |
| `PolarisFeedTool` | Get latest verified news briefs, optionally filtered by category or source domain. |
| `PolarisEntityTool` | Look up entities (companies, people, technologies) mentioned in verified news coverage. |
| `PolarisBriefTool` | Get a specific verified news brief by ID with full analysis, sources, and counter-arguments. |
| `PolarisExtractTool` | Extract clean article content from URLs. Returns structured text with metadata. |
| `PolarisVerifyTool` | Fact-check a claim against the brief corpus. Returns verdict, confidence, evidence, and nuances. Costs 3 API credits. |
| `PolarisCompareTool` | Compare how different news outlets covered the same story. Shows framing, bias, and what each side emphasizes or omits. |

## Retriever

`PolarisRetriever` implements LangChain's `BaseRetriever` interface, returning `Document` objects with:

- **page_content**: Headline, summary, and body text
- **metadata**: `brief_id`, `confidence`, `bias_score`, `category`, `published_at`, `counter_argument`, `sources`, `entities`

### Retriever Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | str | None | Polaris API key (auto-reads from `POLARIS_API_KEY` env var or `~/.polaris/credentials` if omitted) |
| `category` | str | None | Category filter |
| `min_confidence` | float | None | Minimum confidence score (0-1) |
| `limit` | int | 10 | Max results to return |
| `include_sources` | str | None | Comma-separated source domains to include |
| `exclude_sources` | str | None | Comma-separated source domains to exclude |

## Documentation

Full API docs at [thepolarisreport.com/docs](https://thepolarisreport.com/docs)
