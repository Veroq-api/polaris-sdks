import os
from typing import List, Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from polaris_news import PolarisClient


def _resolve_api_key(api_key: str = "") -> str:
    """Resolve API key from argument, VEROQ_API_KEY, or POLARIS_API_KEY."""
    if api_key:
        return api_key
    return os.environ.get("VEROQ_API_KEY", "") or os.environ.get("POLARIS_API_KEY", "")


class SearchInput(BaseModel):
    query: str = Field(description="Search query for verified intelligence")
    category: Optional[str] = Field(default=None, description="Category slug (e.g. ai_ml, markets, crypto)")
    depth: Optional[str] = Field(default=None, description="Speed tier: fast, standard, or deep")


class PolarisSearchTool(BaseTool):
    name: str = "veroq_search"
    description: str = "Search verified intelligence across 18 verticals. Returns briefs with confidence scores and bias ratings."
    args_schema: Type[BaseModel] = SearchInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, query: str, category: str = None, depth: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.search(query, category=category, depth=depth)
        if not result.briefs:
            return "No results found for '{}'.".format(query)
        lines = []
        for b in result.briefs[:5]:
            lines.append("- {} (confidence: {}, bias: {})".format(
                b.headline,
                b.confidence or "N/A",
                b.bias_score or "N/A",
            ))
            if b.summary:
                lines.append("  {}".format(b.summary[:200]))
        return "\n".join(lines)


class FeedInput(BaseModel):
    category: Optional[str] = Field(default=None, description="Category slug to filter by")
    limit: Optional[int] = Field(default=None, description="Max number of briefs to return")
    include_sources: Optional[str] = Field(default=None, description="Comma-separated source domains to include")


class PolarisFeedTool(BaseTool):
    name: str = "veroq_feed"
    description: str = "Get latest verified intelligence briefs, optionally filtered by category or source domain."
    args_schema: Type[BaseModel] = FeedInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, category: str = None, limit: int = None, include_sources: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.feed(category=category, limit=limit, include_sources=include_sources)
        if not result.briefs:
            return "No briefs found."
        lines = []
        for b in result.briefs[:10]:
            lines.append("- [{}] {} (confidence: {})".format(b.category or "general", b.headline, b.confidence or "N/A"))
            if b.summary:
                lines.append("  {}".format(b.summary[:200]))
        return "\n".join(lines)


class EntityInput(BaseModel):
    name: str = Field(description="Entity name to look up (person, company, technology)")


class PolarisEntityTool(BaseTool):
    name: str = "veroq_entities"
    description: str = "Look up entities (companies, people, technologies) mentioned in verified intelligence coverage."
    args_schema: Type[BaseModel] = EntityInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, name: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        briefs = client.entity_briefs(name)
        if not briefs:
            return "No coverage found for entity '{}'.".format(name)
        lines = ["Coverage for '{}':".format(name)]
        for b in briefs[:5]:
            lines.append("- {} ({})".format(b.headline, b.published_at or ""))
        return "\n".join(lines)


class BriefInput(BaseModel):
    brief_id: str = Field(description="Brief ID to retrieve")
    include_full_text: Optional[bool] = Field(default=None, description="Include full source article text")


class PolarisBriefTool(BaseTool):
    name: str = "veroq_brief"
    description: str = "Get a specific verified intelligence brief by ID with full analysis, sources, and counter-arguments."
    args_schema: Type[BaseModel] = BriefInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, brief_id: str, include_full_text: bool = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        b = client.brief(brief_id, include_full_text=include_full_text)
        parts = [b.headline or "Untitled"]
        if b.summary:
            parts.append("Summary: {}".format(b.summary))
        if b.body:
            parts.append("Body: {}".format(b.body[:500]))
        if b.counter_argument:
            parts.append("Counter-argument: {}".format(b.counter_argument))
        parts.append("Confidence: {} | Bias: {} | Sentiment: {}".format(
            b.confidence or "N/A", b.bias_score or "N/A", b.sentiment or "N/A"))
        if b.sources:
            parts.append("Sources: {}".format(", ".join(s.name for s in b.sources)))
        return "\n".join(parts)


class TimelineInput(BaseModel):
    brief_id: str = Field(description="Brief ID to get the story evolution timeline for")


class PolarisTimelineTool(BaseTool):
    name: str = "veroq_timeline"
    description: str = "Get the story evolution timeline for a living brief, showing how it developed over time with versioned updates."
    args_schema: Type[BaseModel] = TimelineInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, brief_id: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.timeline(brief_id)
        if not result:
            return "No timeline found for brief '{}'.".format(brief_id)
        import json
        return json.dumps(result, indent=2, default=str)


class ExtractInput(BaseModel):
    urls: str = Field(description="Comma-separated URLs to extract article content from")


class PolarisExtractTool(BaseTool):
    name: str = "veroq_extract"
    description: str = "Extract clean article content from URLs. Returns structured text with metadata."
    args_schema: Type[BaseModel] = ExtractInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, urls: str) -> str:
        url_list = [u.strip() for u in urls.split(",") if u.strip()]
        if not url_list:
            return "No URLs provided."
        client = PolarisClient(api_key=self.api_key)
        result = client.extract(url_list[:5])
        lines = []
        for r in result.results:
            if r.success:
                lines.append("--- {} ---".format(r.title or r.url))
                lines.append("Domain: {} | Words: {} | Language: {}".format(r.domain or "N/A", r.word_count or 0, r.language or "N/A"))
                if r.text:
                    lines.append(r.text[:1000])
            else:
                lines.append("Failed: {} — {}".format(r.url, r.error or "Unknown error"))
        lines.append("Credits used: {}".format(result.credits_used))
        return "\n".join(lines)


class ResearchInput(BaseModel):
    query: str = Field(description="Research query to investigate across intelligence briefs")
    category: Optional[str] = Field(default=None, description="Category slug to filter briefs (e.g. ai_ml, policy, markets)")
    max_sources: Optional[int] = Field(default=None, description="Maximum briefs to analyze (1-50, default: 20)")


class PolarisResearchTool(BaseTool):
    name: str = "veroq_research"
    description: str = "Deep research across verified intelligence briefs. Expands a query into sub-queries, searches in parallel, aggregates entities, and synthesizes a comprehensive report with key findings and information gaps. Requires Growth plan. Costs 5 API credits."
    args_schema: Type[BaseModel] = ResearchInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, query: str, category: str = None, max_sources: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.research(query, category=category, max_sources=max_sources)
        lines = []
        if result.report:
            summary = result.report.get("summary", "")
            if summary:
                lines.append("Summary: {}".format(summary[:500]))
            findings = result.report.get("key_findings", [])
            if findings:
                lines.append("Key Findings:")
                for f in findings[:10]:
                    lines.append("- {}".format(f))
            gaps = result.report.get("information_gaps", [])
            if gaps:
                lines.append("Information Gaps:")
                for g in gaps[:5]:
                    lines.append("- {}".format(g))
        if result.entity_map:
            lines.append("Top Entities:")
            for e in result.entity_map[:5]:
                lines.append("- {} ({}, {} mentions)".format(e.name, e.type or "N/A", e.mentions or 0))
        if result.metadata:
            lines.append("Analyzed {} briefs from {} sources in {}ms".format(
                result.metadata.briefs_analyzed, result.metadata.unique_sources, result.metadata.processing_time_ms or 0))
        if not lines:
            return "No results found for research query '{}'.".format(query)
        return "\n".join(lines)


class VerifyInput(BaseModel):
    claim: str = Field(description="The claim to fact-check (10-1000 characters)")
    context: Optional[str] = Field(default=None, description="Category to narrow the search (e.g. tech, policy, markets)")


class PolarisVerifyTool(BaseTool):
    name: str = "veroq_verify"
    description: str = "Fact-check a claim against the Polaris brief corpus. Returns a verdict (supported/contradicted/partially_supported/unverifiable) with confidence, evidence, and nuances. Costs 3 API credits."
    args_schema: Type[BaseModel] = VerifyInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, claim: str, context: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.verify(claim, context=context)
        lines = ["Verdict: {} (confidence: {:.0%})".format(result.verdict, result.confidence)]
        if result.summary:
            lines.append("Summary: {}".format(result.summary))
        if result.supporting_briefs:
            lines.append("Supporting Evidence:")
            for b in result.supporting_briefs:
                lines.append("- {} ({})".format(b.headline, b.id))
        if result.contradicting_briefs:
            lines.append("Contradicting Evidence:")
            for b in result.contradicting_briefs:
                lines.append("- {} ({})".format(b.headline, b.id))
        if result.nuances:
            lines.append("Nuances: {}".format(result.nuances))
        lines.append("Sources analyzed: {} | Briefs matched: {} | Credits: {}".format(
            result.sources_analyzed, result.briefs_matched, result.credits_used))
        return "\n".join(lines)


class CompareInput(BaseModel):
    topic: str = Field(description="Topic to compare coverage across outlets")


class PolarisCompareTool(BaseTool):
    name: str = "veroq_compare"
    description: str = "Compare how different outlets covered the same story. Shows framing, bias, and what each side emphasizes or omits."
    args_schema: Type[BaseModel] = CompareInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, topic: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        search_result = client.search(topic, per_page=1)
        if not search_result.briefs:
            return "No coverage found for topic '{}'.".format(topic)
        brief_id = search_result.briefs[0].id
        try:
            comparison = client.compare_sources(brief_id)
        except Exception as e:
            return "Could not compare sources: {}".format(str(e))
        lines = ["Topic: {}".format(comparison.topic or topic)]
        if comparison.source_analyses:
            for sa in comparison.source_analyses:
                lines.append("- {} ({})".format(sa.outlet or "Unknown", sa.political_lean or "N/A"))
                if sa.framing:
                    lines.append("  {}".format(sa.framing[:200]))
        if comparison.polaris_analysis:
            summary = comparison.polaris_analysis.get("summary", "") if isinstance(comparison.polaris_analysis, dict) else str(comparison.polaris_analysis)
            lines.append("Synthesis: {}".format(summary[:500]))
        return "\n".join(lines)


class ForecastInput(BaseModel):
    topic: str = Field(description="Topic to forecast future developments for")
    depth: Optional[str] = Field(default=None, description="Analysis depth: fast, standard, or deep")


class PolarisForecastTool(BaseTool):
    name: str = "veroq_forecast"
    description: str = "Generate a forward-looking forecast for a topic based on current intelligence trends, momentum signals, and historical patterns."
    args_schema: Type[BaseModel] = ForecastInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, topic: str, depth: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.forecast(topic, depth=depth)
        import json
        return json.dumps(result, indent=2, default=str)


class ContradictionsInput(BaseModel):
    severity: Optional[str] = Field(default=None, description="Filter by severity level (e.g. high, medium, low)")


class PolarisContradictionsTool(BaseTool):
    name: str = "veroq_contradictions"
    description: str = "Find contradictions across the intelligence brief network — stories where sources disagree on facts, framing, or conclusions."
    args_schema: Type[BaseModel] = ContradictionsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, severity: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.contradictions(severity=severity)
        import json
        return json.dumps(result, indent=2, default=str)


class EventsInput(BaseModel):
    type: Optional[str] = Field(default=None, description="Event type to filter by")
    subject: Optional[str] = Field(default=None, description="Subject or entity to filter events for")


class PolarisEventsTool(BaseTool):
    name: str = "veroq_events"
    description: str = "Get notable events detected across intelligence briefs — significant developments, announcements, and inflection points."
    args_schema: Type[BaseModel] = EventsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, type: str = None, subject: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.events(type=type, subject=subject)
        import json
        return json.dumps(result, indent=2, default=str)


class WebSearchInput(BaseModel):
    query: str = Field(description="Web search query")
    limit: Optional[int] = Field(default=None, description="Max results to return (default 5)")
    freshness: Optional[str] = Field(default=None, description="Freshness filter (e.g. 'day', 'week', 'month')")
    region: Optional[str] = Field(default=None, description="Region code (e.g. 'us', 'eu')")
    verify: Optional[bool] = Field(default=None, description="Enable Polaris trust scoring on results")


class PolarisWebSearchTool(BaseTool):
    name: str = "veroq_web_search"
    description: str = "Search the web with optional Polaris trust scoring. Returns web results with relevance and optional verification."
    args_schema: Type[BaseModel] = WebSearchInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, query: str, limit: int = None, freshness: str = None, region: str = None, verify: bool = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.web_search(query, limit=limit or 5, freshness=freshness, region=region, verify=verify or False)
        import json
        return json.dumps(result, indent=2, default=str)


class CrawlInput(BaseModel):
    url: str = Field(description="URL to crawl and extract content from")
    depth: Optional[int] = Field(default=None, description="Crawl depth (default 1)")
    max_pages: Optional[int] = Field(default=None, description="Max pages to crawl (default 5)")
    include_links: Optional[bool] = Field(default=None, description="Include extracted links in response")


class PolarisCrawlTool(BaseTool):
    name: str = "veroq_crawl"
    description: str = "Extract structured content from a URL with optional link following. Returns page content, metadata, and optionally discovered links."
    args_schema: Type[BaseModel] = CrawlInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, url: str, depth: int = None, max_pages: int = None, include_links: bool = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.crawl(url, depth=depth or 1, max_pages=max_pages or 5, include_links=include_links if include_links is not None else True)
        import json
        return json.dumps(result, indent=2, default=str)


class TrendingInput(BaseModel):
    limit: Optional[int] = Field(default=None, description="Max number of trending entities to return")


class PolarisTrendingTool(BaseTool):
    name: str = "veroq_trending"
    description: str = "Get trending entities across the intelligence network — the people, companies, and topics generating the most coverage right now."
    args_schema: Type[BaseModel] = TrendingInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, limit: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        entities = client.trending_entities(limit=limit)
        if not entities:
            return "No trending entities found."
        lines = ["Trending entities:"]
        for e in entities:
            lines.append("- {} ({}, {} mentions)".format(
                e.name, e.type or "N/A", e.mention_count or 0))
        return "\n".join(lines)


# ── Trading Tools ──


class TickerResolveInput(BaseModel):
    symbols: str = Field(description="Comma-separated ticker symbols to resolve (e.g. 'AAPL,MSFT,NVDA')")


class PolarisTickerResolveTool(BaseTool):
    name: str = "veroq_ticker_resolve"
    description: str = "Resolve ticker symbols to canonical entities. Returns matched tickers with entity names, exchanges, asset types, and sectors. Unresolved symbols are listed separately."
    args_schema: Type[BaseModel] = TickerResolveInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbols: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.ticker_resolve(symbols)
        resolved = result.get("resolved", [])
        unresolved = result.get("unresolved", [])
        lines = []
        if resolved:
            lines.append("Resolved tickers:")
            for r in resolved:
                lines.append("- {} → {} ({}, {}, sector: {})".format(
                    r.get("ticker", "?"),
                    r.get("entity_name", "?"),
                    r.get("exchange", "N/A"),
                    r.get("asset_type", "N/A"),
                    r.get("sector", "N/A"),
                ))
        if unresolved:
            lines.append("Unresolved: {}".format(", ".join(unresolved)))
        if not lines:
            return "No ticker symbols provided."
        return "\n".join(lines)


class TickerInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to look up (e.g. 'AAPL')")


class PolarisTickerTool(BaseTool):
    name: str = "veroq_ticker"
    description: str = "Look up a single ticker symbol. Returns entity name, exchange, sector, 24h brief count, sentiment score, and trending status."
    args_schema: Type[BaseModel] = TickerInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.ticker(symbol)
        if result.get("status") != "ok":
            return "Ticker '{}' not found.".format(symbol)
        lines = [
            "{} — {}".format(result.get("ticker", symbol), result.get("entity_name", "Unknown")),
            "Exchange: {} | Sector: {} | Type: {}".format(
                result.get("exchange", "N/A"),
                result.get("sector", "N/A"),
                result.get("asset_type", "N/A"),
            ),
            "Briefs (24h): {} | Sentiment: {} | Trending: {}".format(
                result.get("briefs_24h", 0),
                result.get("sentiment_score", "N/A"),
                result.get("trending", False),
            ),
        ]
        return "\n".join(lines)


class TickerScoreInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get composite trading signal for (e.g. 'NVDA')")


class PolarisTickerScoreTool(BaseTool):
    name: str = "veroq_ticker_score"
    description: str = "Get a composite trading signal score for a ticker. Combines sentiment (40%), momentum (25%), coverage volume (20%), and event proximity (15%) into a single score from -1 to +1 with a signal label (strong_bullish/bullish/neutral/bearish/strong_bearish)."
    args_schema: Type[BaseModel] = TickerScoreInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.ticker_score(symbol)
        if result.get("status") != "ok":
            return "Could not compute score for '{}'.".format(symbol)
        lines = [
            "{} — {} (score: {})".format(
                result.get("ticker", symbol),
                result.get("signal", "N/A"),
                result.get("composite_score", "N/A"),
            ),
            "Entity: {} | Sector: {}".format(
                result.get("entity_name", "N/A"),
                result.get("sector", "N/A"),
            ),
        ]
        components = result.get("components", {})
        sentiment = components.get("sentiment", {})
        lines.append("Sentiment: 24h={} / 7d avg={} (weight {})".format(
            sentiment.get("current_24h", "N/A"),
            sentiment.get("week_avg", "N/A"),
            sentiment.get("weight", 0.4),
        ))
        mom = components.get("momentum", {})
        lines.append("Momentum: {} ({}, weight {})".format(
            mom.get("value", "N/A"),
            mom.get("direction", "N/A"),
            mom.get("weight", 0.25),
        ))
        vol = components.get("volume", {})
        lines.append("Volume: {} briefs/day this week vs {} last week ({}% change, weight {})".format(
            vol.get("daily_avg_this_week", "N/A"),
            vol.get("daily_avg_last_week", "N/A"),
            vol.get("velocity_change_pct", "N/A"),
            vol.get("weight", 0.2),
        ))
        events = components.get("events", {})
        lines.append("Events: {} in 7d, latest type: {} (weight {})".format(
            events.get("count_7d", 0),
            events.get("latest_type", "none"),
            events.get("weight", 0.15),
        ))
        return "\n".join(lines)


class SectorsInput(BaseModel):
    days: Optional[int] = Field(default=None, description="Lookback period in days (1-90, default 7)")


class PolarisSectorsTool(BaseTool):
    name: str = "veroq_sectors"
    description: str = "Get a sector-level overview of market sentiment. Returns each sector's ticker count, brief count, average sentiment, top ticker, and bullish/bearish/neutral signal."
    args_schema: Type[BaseModel] = SectorsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, days: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.sectors(days=days or 7)
        sectors = result.get("sectors", [])
        if not sectors:
            return "No sector data available."
        lines = ["Sector overview ({} day lookback):".format(result.get("days", 7))]
        for s in sectors:
            lines.append("- {} [{}] sentiment={} | {} tickers, {} briefs | top: {}".format(
                s.get("sector", "?"),
                s.get("signal", "?"),
                s.get("avg_sentiment", "N/A"),
                s.get("ticker_count", 0),
                s.get("brief_count", 0),
                s.get("top_ticker", "N/A"),
            ))
        return "\n".join(lines)


class PortfolioFeedInput(BaseModel):
    holdings: str = Field(description="JSON array of holdings, e.g. '[{\"ticker\":\"NVDA\",\"weight\":0.3},{\"ticker\":\"AAPL\",\"weight\":0.2}]'")
    days: Optional[int] = Field(default=None, description="Lookback period in days (1-30, default 7)")
    limit: Optional[int] = Field(default=None, description="Max briefs to return (1-100, default 30)")


class PolarisPortfolioFeedTool(BaseTool):
    name: str = "veroq_portfolio_feed"
    description: str = "Get ranked intelligence for a portfolio of holdings. Pass ticker/weight pairs and receive briefs scored by portfolio relevance, plus a per-holding summary with brief counts and sentiment."
    args_schema: Type[BaseModel] = PortfolioFeedInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, holdings: str, days: int = None, limit: int = None) -> str:
        import json as _json
        try:
            holdings_list = _json.loads(holdings)
        except (_json.JSONDecodeError, TypeError):
            return "Invalid holdings JSON. Expected format: [{\"ticker\":\"NVDA\",\"weight\":0.3}, ...]"
        if not isinstance(holdings_list, list) or not holdings_list:
            return "Holdings must be a non-empty JSON array of {\"ticker\": ..., \"weight\": ...} objects."
        client = PolarisClient(api_key=self.api_key)
        result = client.portfolio_feed(holdings_list, days=days or 7, limit=limit or 30)
        lines = []
        # Portfolio summary
        summary = result.get("portfolio_summary", [])
        if summary:
            lines.append("Portfolio summary ({} holdings resolved):".format(result.get("holdings_resolved", 0)))
            for h in summary:
                lines.append("  {} (weight {}) — {} briefs, sentiment: {}".format(
                    h.get("ticker", "?"),
                    h.get("weight", "?"),
                    h.get("briefs_in_period", 0),
                    h.get("avg_sentiment", "N/A"),
                ))
        unresolved = result.get("holdings_unresolved", [])
        if unresolved:
            lines.append("Unresolved: {}".format(", ".join(unresolved)))
        # Top briefs
        briefs = result.get("briefs", [])
        if briefs:
            lines.append("Top briefs (by portfolio relevance):")
            for b in briefs[:10]:
                tickers = ", ".join(b.get("matching_tickers", []))
                lines.append("- [{}] {} (relevance: {}, tickers: {})".format(
                    b.get("category", "general"),
                    b.get("headline", "Untitled"),
                    b.get("portfolio_relevance", "N/A"),
                    tickers or "N/A",
                ))
        if not lines:
            return "No portfolio intelligence found."
        return "\n".join(lines)


class EventsCalendarInput(BaseModel):
    ticker: Optional[str] = Field(default=None, description="Ticker symbol to filter events for (e.g. 'AAPL')")
    type: Optional[str] = Field(default=None, description="Event type to filter by (e.g. 'earnings', 'product_launch')")
    days: Optional[int] = Field(default=None, description="Lookback period in days (1-90, default 30)")
    limit: Optional[int] = Field(default=None, description="Max events to return (1-200, default 50)")


class PolarisEventsCalendarTool(BaseTool):
    name: str = "veroq_events_calendar"
    description: str = "Get structured market events from intelligence briefs, filterable by ticker and event type. Returns events with brief context, market session, and a summary breakdown by event type."
    args_schema: Type[BaseModel] = EventsCalendarInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, ticker: str = None, type: str = None, days: int = None, limit: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.events_calendar(
            days=days or 30,
            ticker=ticker,
            type=type,
            limit=limit or 50,
        )
        events = result.get("events", [])
        event_types = result.get("event_types", [])
        total = result.get("total_events", 0)
        lines = ["Events calendar ({} total, {} day lookback{}{}):".format(
            total,
            result.get("days", 30),
            ", ticker={}".format(result.get("ticker")) if result.get("ticker") else "",
            ", type={}".format(result.get("event_type")) if result.get("event_type") else "",
        )]
        if event_types:
            lines.append("By type: {}".format(
                ", ".join("{} ({})".format(t.get("type", "?"), t.get("count", 0)) for t in event_types)
            ))
        if events:
            for ev in events[:20]:
                lines.append("- [{}] {} — {} (brief: {})".format(
                    ev.get("event_type", "?"),
                    ev.get("subject", "?"),
                    ev.get("description", ev.get("brief_headline", "N/A")),
                    ev.get("brief_id", "N/A"),
                ))
        elif total == 0:
            lines.append("No events found.")
        return "\n".join(lines)


# ── Market Data Tools ──


class CandlesInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL', 'NVDA')")
    interval: Optional[str] = Field(default=None, description="Candle interval: 1d, 1wk, or 1mo (default 1d)")
    range: Optional[str] = Field(default=None, description="Date range: 1mo, 3mo, 6mo, 1y, 2y, 5y (default 6mo)")


class PolarisCandlesTool(BaseTool):
    name: str = "veroq_candles"
    description: str = "Get OHLCV candlestick data for a ticker symbol. Returns date, open, high, low, close, and volume for each period."
    args_schema: Type[BaseModel] = CandlesInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str, interval: str = None, range: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.candles(symbol, interval=interval or '1d', range=range or '6mo')
        candles = result.get("candles", [])
        if not candles:
            return "No candle data found for '{}'.".format(symbol)
        lines = ["{} — {} candles ({}, {})".format(
            result.get("ticker", symbol),
            result.get("candle_count", len(candles)),
            result.get("interval", "1d"),
            result.get("range", "6mo"),
        )]
        for c in candles[-10:]:
            lines.append("  {} O={} H={} L={} C={} V={}".format(
                c.get("date", "?"),
                c.get("open", "?"),
                c.get("high", "?"),
                c.get("low", "?"),
                c.get("close", "?"),
                c.get("volume", "?"),
            ))
        if len(candles) > 10:
            lines.insert(1, "(showing last 10 of {})".format(len(candles)))
        return "\n".join(lines)


class TechnicalsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'NVDA')")
    range: Optional[str] = Field(default=None, description="Date range for indicator calculation: 1mo, 3mo, 6mo, 1y, 2y, 5y (default 6mo)")


class PolarisTechnicalsTool(BaseTool):
    name: str = "veroq_technicals"
    description: str = "Get all technical indicators and a signal summary for a ticker. Includes SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Stochastic, ADX, OBV, VWAP with an overall buy/sell/neutral verdict."
    args_schema: Type[BaseModel] = TechnicalsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str, range: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.technicals(symbol, range=range or '6mo')
        ticker = result.get("ticker", symbol)
        summary = result.get("summary", {})
        indicators = result.get("indicators", {})
        lines = ["{} — Technical Analysis".format(ticker)]
        if summary:
            lines.append("Signal: {} | Buy: {} | Sell: {} | Neutral: {}".format(
                summary.get("signal", "N/A"),
                summary.get("buy_count", 0),
                summary.get("sell_count", 0),
                summary.get("neutral_count", 0),
            ))
        price = result.get("price", {})
        if price:
            lines.append("Price: {} | Range: {}-{}".format(
                price.get("close", "N/A"),
                price.get("low", "N/A"),
                price.get("high", "N/A"),
            ))
        for name, data in indicators.items():
            if isinstance(data, dict):
                signal = data.get("signal", "")
                value = data.get("value", data.get("latest", ""))
                lines.append("  {}: {} [{}]".format(name.upper(), value, signal))
        return "\n".join(lines)


class MarketMoversInput(BaseModel):
    pass


class PolarisMarketMoversTool(BaseTool):
    name: str = "veroq_market_movers"
    description: str = "Get top market movers — gainers, losers, and most active stocks by volume. Useful for a quick snapshot of what is moving in the market right now."
    args_schema: Type[BaseModel] = MarketMoversInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.market_movers()
        lines = ["Market Movers"]
        for section, label in [("gainers", "Top Gainers"), ("losers", "Top Losers"), ("most_active", "Most Active")]:
            items = result.get(section, [])
            if items:
                lines.append("\n{}:".format(label))
                for item in items[:5]:
                    change = item.get("change_percent", item.get("changesPercentage", "N/A"))
                    lines.append("  {} — ${} ({}%)".format(
                        item.get("symbol", item.get("ticker", "?")),
                        item.get("price", "?"),
                        change,
                    ))
        return "\n".join(lines)


class EconomyInput(BaseModel):
    indicator: Optional[str] = Field(default=None, description="Indicator slug (e.g. gdp, cpi, unemployment, fed_funds). Omit for summary of all.")
    limit: Optional[int] = Field(default=None, description="Number of historical observations to return (default 30, max 100)")


class PolarisEconomyTool(BaseTool):
    name: str = "veroq_economy"
    description: str = "Get economic indicators from the FRED API. Without an indicator slug, returns a summary of all key indicators (GDP, CPI, unemployment, etc.). With a slug, returns that indicator's history."
    args_schema: Type[BaseModel] = EconomyInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, indicator: str = None, limit: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.economy(indicator=indicator, limit=limit)
        if indicator:
            lines = ["{} ({})".format(result.get("name", indicator), result.get("indicator", indicator))]
            latest = result.get("latest", {})
            if latest:
                lines.append("Latest: {} ({}) | Units: {} | Frequency: {}".format(
                    latest.get("value", "N/A"),
                    latest.get("date", "N/A"),
                    result.get("units", "N/A"),
                    result.get("frequency", "N/A"),
                ))
            observations = result.get("observations", [])
            if observations:
                lines.append("Recent observations:")
                for obs in observations[:10]:
                    lines.append("  {} = {}".format(obs.get("date", "?"), obs.get("value", "?")))
        else:
            indicators = result.get("indicators", [])
            if not indicators:
                return "No economic data available."
            lines = ["Economic Indicators Summary ({} indicators)".format(len(indicators))]
            for ind in indicators:
                lines.append("  {} ({}): {} ({})".format(
                    ind.get("name", "?"),
                    ind.get("slug", "?"),
                    ind.get("latest_value", "N/A"),
                    ind.get("latest_date", "N/A"),
                ))
        return "\n".join(lines)


class CryptoInput(BaseModel):
    symbol: Optional[str] = Field(default=None, description="Crypto symbol (e.g. BTC, ETH, SOL). Omit for market overview.")


class PolarisCryptoTool(BaseTool):
    name: str = "veroq_crypto"
    description: str = "Get crypto market data. Without a symbol, returns market overview (total market cap, BTC dominance). With a symbol, returns that token's price, volume, and metadata."
    args_schema: Type[BaseModel] = CryptoInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.crypto(symbol=symbol)
        if symbol:
            lines = ["{} — {}".format(
                result.get("symbol", symbol),
                result.get("name", "Unknown"),
            )]
            lines.append("Price: ${} | 24h Change: {}%".format(
                result.get("price", result.get("current_price", "N/A")),
                result.get("change_24h", result.get("price_change_percentage_24h", "N/A")),
            ))
            lines.append("Market Cap: ${} | 24h Volume: ${}".format(
                result.get("market_cap", "N/A"),
                result.get("volume_24h", result.get("total_volume", "N/A")),
            ))
            if result.get("ath"):
                lines.append("ATH: ${} | ATH Change: {}%".format(
                    result.get("ath", "N/A"),
                    result.get("ath_change_percentage", "N/A"),
                ))
        else:
            lines = ["Crypto Market Overview"]
            lines.append("Total Market Cap: ${}".format(result.get("total_market_cap", "N/A")))
            lines.append("BTC Dominance: {}%".format(result.get("btc_dominance", "N/A")))
            lines.append("24h Volume: ${}".format(result.get("total_volume_24h", "N/A")))
            top = result.get("top_coins", [])
            if top:
                lines.append("\nTop coins:")
                for coin in top[:10]:
                    lines.append("  {} — ${} ({}%)".format(
                        coin.get("symbol", "?"),
                        coin.get("price", coin.get("current_price", "?")),
                        coin.get("change_24h", coin.get("price_change_percentage_24h", "?")),
                    ))
        return "\n".join(lines)


class BacktestInput(BaseModel):
    strategy: str = Field(description='JSON strategy object with entry_filters and exit_filters, e.g. \'{"entry_filters":{"rsi_below":30},"exit_filters":{"rsi_above":50},"asset_type":"equity","sector":"Semiconductors"}\'')
    period: Optional[str] = Field(default=None, description="Backtest period (e.g. 1y, 6mo, 3mo). Default: 1y")


class PolarisBacktestTool(BaseTool):
    name: str = "veroq_backtest"
    description: str = "Backtest a news-driven trading strategy. Define entry/exit filters based on sentiment, RSI, and other signals, then see historical performance including return, drawdown, Sharpe ratio, and win rate."
    args_schema: Type[BaseModel] = BacktestInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, strategy: str, period: str = None) -> str:
        import json as _json
        try:
            strategy_obj = _json.loads(strategy)
        except (_json.JSONDecodeError, TypeError):
            return "Invalid strategy JSON. Expected format: {\"entry_filters\": {...}, \"exit_filters\": {...}}"
        client = PolarisClient(api_key=self.api_key)
        result = client.backtest(strategy_obj, period=period or '1y')
        perf = result.get("performance", {})
        lines = ["Backtest Results ({} period):".format(result.get("period", period or "1y"))]
        lines.append("Total Return: {}%".format(perf.get("total_return_pct", "N/A")))
        lines.append("Max Drawdown: {}%".format(perf.get("max_drawdown_pct", "N/A")))
        lines.append("Sharpe Ratio: {}".format(perf.get("sharpe_ratio", "N/A")))
        lines.append("Win Rate: {}%".format(perf.get("win_rate", "N/A")))
        lines.append("Total Trades: {}".format(perf.get("total_trades", "N/A")))
        return "\n".join(lines)


class CorrelationInput(BaseModel):
    tickers: str = Field(description="Comma-separated ticker symbols to correlate (e.g. 'NVDA,AMD,INTC')")
    days: Optional[int] = Field(default=None, description="Lookback period in days (default 30)")


class PolarisCorrelationTool(BaseTool):
    name: str = "veroq_correlation"
    description: str = "Get a news-sentiment correlation matrix for multiple tickers. Shows how closely related their coverage patterns and sentiment movements are over a given period."
    args_schema: Type[BaseModel] = CorrelationInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, tickers: str, days: int = None) -> str:
        ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
        if len(ticker_list) < 2:
            return "At least 2 tickers are required for correlation analysis."
        client = PolarisClient(api_key=self.api_key)
        result = client.correlation(ticker_list, days=days or 30)
        lines = ["Correlation Matrix ({} day lookback):".format(result.get("period_days", days or 30))]
        matrix = result.get("matrix", [])
        result_tickers = result.get("tickers", ticker_list)
        # Header row
        lines.append("       " + "  ".join("{:>6}".format(t) for t in result_tickers))
        for i, row in enumerate(matrix):
            label = "{:<6}".format(result_tickers[i] if i < len(result_tickers) else "?")
            vals = "  ".join("{:>6.2f}".format(v) if isinstance(v, (int, float)) else "{:>6}".format("N/A") for v in row)
            lines.append("{} {}".format(label, vals))
        return "\n".join(lines)


class ScreenerInput(BaseModel):
    query: str = Field(description="Natural language screening query (e.g. 'oversold tech stocks with upcoming earnings')")
    limit: Optional[int] = Field(default=None, description="Max results to return (default 20)")


class PolarisScreenerTool(BaseTool):
    name: str = "veroq_screener"
    description: str = "Screen stocks using natural language. Describe what you're looking for and get matching tickers with sentiment scores, technicals, and sector data."
    args_schema: Type[BaseModel] = ScreenerInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, query: str, limit: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.screener_natural(query, limit=limit)
        results = result.get("results", [])
        if not results:
            return "No stocks found matching '{}'.".format(query)
        lines = ["Screener results for '{}':".format(query)]
        for r in results[:20]:
            lines.append("- {} ({}) — sentiment: {}, sector: {}".format(
                r.get("ticker", "?"),
                r.get("name", "?"),
                r.get("sentiment_score", "N/A"),
                r.get("sector", "N/A"),
            ))
        return "\n".join(lines)


class NewsImpactInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to analyze news impact for (e.g. 'NVDA')")


class PolarisNewsImpactTool(BaseTool):
    name: str = "veroq_news_impact"
    description: str = "Analyze the impact of news coverage on a ticker's price and sentiment. Shows how recent news events correlated with price movements."
    args_schema: Type[BaseModel] = NewsImpactInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.news_impact(symbol)
        import json
        return json.dumps(result, indent=2, default=str)


class CompetitorsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get competitors for (e.g. 'NVDA')")


class PolarisCompetitorsTool(BaseTool):
    name: str = "veroq_competitors"
    description: str = "Get the competitive landscape for a ticker. Returns competitors with comparative sentiment, coverage volume, and sector positioning."
    args_schema: Type[BaseModel] = CompetitorsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.competitors(symbol)
        competitors = result.get("competitors", [])
        if not competitors:
            return "No competitor data found for '{}'.".format(symbol)
        lines = ["Competitors for {} ({}):".format(
            result.get("symbol", symbol),
            result.get("name", ""),
        )]
        for c in competitors:
            lines.append("- {} ({}) — sentiment: {}, briefs: {}".format(
                c.get("ticker", c.get("symbol", "?")),
                c.get("name", "?"),
                c.get("sentiment_score", "N/A"),
                c.get("brief_count", "N/A"),
            ))
        return "\n".join(lines)


class DefiInput(BaseModel):
    protocol: Optional[str] = Field(default=None, description="DeFi protocol slug (e.g. aave, uniswap, lido). Omit for overview.")


class PolarisDefiTool(BaseTool):
    name: str = "veroq_defi"
    description: str = "Get DeFi data. Without a protocol, returns TVL overview with top protocols and chain breakdown. With a protocol slug, returns that protocol's TVL history and details."
    args_schema: Type[BaseModel] = DefiInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, protocol: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.crypto_defi(protocol=protocol)
        if protocol:
            lines = ["{} — DeFi Protocol".format(result.get("name", protocol))]
            lines.append("TVL: ${} | Chain: {}".format(
                result.get("tvl", "N/A"),
                result.get("chain", result.get("chains", "N/A")),
            ))
            if result.get("category"):
                lines.append("Category: {}".format(result.get("category")))
            history = result.get("tvl_history", [])
            if history:
                lines.append("Recent TVL history:")
                for h in history[-5:]:
                    lines.append("  {} = ${}".format(h.get("date", "?"), h.get("tvl", "?")))
        else:
            lines = ["DeFi Overview"]
            lines.append("Total TVL: ${}".format(result.get("total_tvl", "N/A")))
            protocols = result.get("top_protocols", result.get("protocols", []))
            if protocols:
                lines.append("\nTop protocols:")
                for p in protocols[:10]:
                    lines.append("  {} — TVL: ${} ({})".format(
                        p.get("name", "?"),
                        p.get("tvl", "?"),
                        p.get("chain", p.get("chains", "N/A")),
                    ))
            chains = result.get("chains", [])
            if isinstance(chains, list) and chains:
                lines.append("\nChain TVL:")
                for ch in chains[:10]:
                    lines.append("  {} — ${}".format(ch.get("name", "?"), ch.get("tvl", "?")))
        return "\n".join(lines)


# ── New Tools (2026-03-25) ──


class AskInput(BaseModel):
    question: str = Field(description="Any financial question in natural language (e.g. 'What happened to NVDA today?', 'Compare AAPL and MSFT earnings')")


class PolarisAskTool(BaseTool):
    name: str = "veroq_ask"
    description: str = "Ask any financial question in natural language. Returns structured data + markdown summary."
    args_schema: Type[BaseModel] = AskInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, question: str) -> str:
        import requests
        resp = requests.post(
            "https://api.thepolarisreport.com/api/v1/ask",
            headers={"Authorization": "Bearer {}".format(self.api_key)},
            json={"question": question},
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        lines = []
        if data.get("summary"):
            lines.append(data["summary"])
        if data.get("data"):
            import json
            lines.append("\nStructured data:\n{}".format(json.dumps(data["data"], indent=2, default=str)))
        if data.get("sources"):
            lines.append("\nSources: {}".format(", ".join(str(s) for s in data["sources"][:5])))
        return "\n".join(lines) if lines else "No answer returned."


class FullInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL', 'NVDA', 'BTC')")


class PolarisFullTool(BaseTool):
    name: str = "veroq_full"
    description: str = "Get complete cross-reference for a ticker: price, technicals, earnings, sentiment, news, insider, filings, analysts, institutions — all in one call."
    args_schema: Type[BaseModel] = FullInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import requests
        import json
        resp = requests.get(
            "https://api.thepolarisreport.com/api/v1/ticker/{}/full".format(symbol),
            headers={"Authorization": "Bearer {}".format(self.api_key)},
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        lines = ["{} — Full Cross-Reference".format(symbol.upper())]
        # Price
        price = data.get("price", {})
        if price:
            lines.append("Price: ${} | Change: {}%".format(
                price.get("close", price.get("price", "N/A")),
                price.get("change_percent", "N/A"),
            ))
        # Technicals summary
        technicals = data.get("technicals", {})
        summary = technicals.get("summary", {})
        if summary:
            lines.append("Technicals: {} (buy: {}, sell: {}, neutral: {})".format(
                summary.get("signal", "N/A"),
                summary.get("buy_count", 0),
                summary.get("sell_count", 0),
                summary.get("neutral_count", 0),
            ))
        # Earnings
        earnings = data.get("earnings", {})
        if earnings:
            lines.append("Earnings: EPS={} Revenue={}".format(
                earnings.get("eps", "N/A"),
                earnings.get("revenue", "N/A"),
            ))
        # Sentiment
        sentiment = data.get("sentiment", {})
        if sentiment:
            lines.append("Sentiment: {}".format(sentiment.get("score", sentiment.get("overall", "N/A"))))
        # Analysts
        analysts = data.get("analysts", {})
        if analysts:
            lines.append("Analysts: {} target=${} (buy: {}, hold: {}, sell: {})".format(
                analysts.get("consensus", "N/A"),
                analysts.get("target_price", analysts.get("price_target", "N/A")),
                analysts.get("buy", 0),
                analysts.get("hold", 0),
                analysts.get("sell", 0),
            ))
        # Sections summary
        for section in ["insider", "filings", "institutions", "news"]:
            sec_data = data.get(section)
            if sec_data:
                if isinstance(sec_data, list):
                    lines.append("{}: {} items".format(section.capitalize(), len(sec_data)))
                elif isinstance(sec_data, dict):
                    count = sec_data.get("total", sec_data.get("count", len(sec_data)))
                    lines.append("{}: {} items".format(section.capitalize(), count))
        return "\n".join(lines)


class InsiderInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL')")


class PolarisInsiderTool(BaseTool):
    name: str = "veroq_insider"
    description: str = "Get insider transactions (Form 4) for a ticker."
    args_schema: Type[BaseModel] = InsiderInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import requests
        import json
        resp = requests.get(
            "https://api.thepolarisreport.com/api/v1/ticker/{}/insider".format(symbol),
            headers={"Authorization": "Bearer {}".format(self.api_key)},
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        transactions = data.get("transactions", data.get("data", []))
        if not transactions:
            return "No insider transactions found for '{}'.".format(symbol)
        lines = ["{} — Insider Transactions".format(symbol.upper())]
        for tx in transactions[:15]:
            lines.append("- {} {} {} shares @ ${} ({})".format(
                tx.get("insider_name", tx.get("name", "Unknown")),
                tx.get("transaction_type", tx.get("type", "?")),
                tx.get("shares", tx.get("amount", "?")),
                tx.get("price", "?"),
                tx.get("date", tx.get("filing_date", "?")),
            ))
        total = data.get("total", len(transactions))
        if total > 15:
            lines.append("... and {} more transactions".format(total - 15))
        return "\n".join(lines)


class FilingsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL')")


class PolarisFilingsTool(BaseTool):
    name: str = "veroq_filings"
    description: str = "Get SEC filings (10-K, 10-Q, 8-K) for a ticker."
    args_schema: Type[BaseModel] = FilingsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import requests
        resp = requests.get(
            "https://api.thepolarisreport.com/api/v1/ticker/{}/filings".format(symbol),
            headers={"Authorization": "Bearer {}".format(self.api_key)},
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        filings = data.get("filings", data.get("data", []))
        if not filings:
            return "No SEC filings found for '{}'.".format(symbol)
        lines = ["{} — SEC Filings".format(symbol.upper())]
        for f in filings[:15]:
            lines.append("- [{}] {} ({})".format(
                f.get("type", f.get("form_type", "?")),
                f.get("title", f.get("description", "N/A")),
                f.get("date", f.get("filed_date", "?")),
            ))
            if f.get("url"):
                lines.append("  {}".format(f["url"]))
        total = data.get("total", len(filings))
        if total > 15:
            lines.append("... and {} more filings".format(total - 15))
        return "\n".join(lines)


class AnalystsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL')")


class PolarisAnalystsTool(BaseTool):
    name: str = "veroq_analysts"
    description: str = "Get analyst ratings and price target consensus."
    args_schema: Type[BaseModel] = AnalystsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import requests
        resp = requests.get(
            "https://api.thepolarisreport.com/api/v1/ticker/{}/analysts".format(symbol),
            headers={"Authorization": "Bearer {}".format(self.api_key)},
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        lines = ["{} — Analyst Ratings".format(symbol.upper())]
        consensus = data.get("consensus", data.get("rating", "N/A"))
        target = data.get("target_price", data.get("price_target", "N/A"))
        lines.append("Consensus: {} | Price Target: ${}".format(consensus, target))
        if data.get("target_high") or data.get("target_low"):
            lines.append("Target Range: ${} — ${}".format(
                data.get("target_low", "N/A"),
                data.get("target_high", "N/A"),
            ))
        # Rating breakdown
        for key in ["strong_buy", "buy", "hold", "sell", "strong_sell"]:
            val = data.get(key)
            if val is not None:
                lines.append("  {}: {}".format(key.replace("_", " ").title(), val))
        # Recent ratings
        ratings = data.get("ratings", data.get("recent", []))
        if ratings:
            lines.append("\nRecent ratings:")
            for r in ratings[:10]:
                lines.append("- {} — {} (target: ${}) {}".format(
                    r.get("analyst", r.get("firm", "?")),
                    r.get("rating", r.get("action", "?")),
                    r.get("target_price", r.get("price_target", "?")),
                    r.get("date", ""),
                ))
        return "\n".join(lines)


class CongressInput(BaseModel):
    symbol: Optional[str] = Field(default=None, description="Ticker symbol to filter by (e.g. 'AAPL'). Omit for all trades.")
    chamber: Optional[str] = Field(default=None, description="Filter by chamber: 'senate' or 'house'")
    limit: Optional[int] = Field(default=None, description="Max results to return (default 20)")


class PolarisCongressTool(BaseTool):
    name: str = "veroq_congress"
    description: str = "Get congressional stock trades (STOCK Act disclosures)."
    args_schema: Type[BaseModel] = CongressInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str = None, chamber: str = None, limit: int = None) -> str:
        import requests
        params = {}
        if symbol:
            params["symbol"] = symbol
        if chamber:
            params["chamber"] = chamber
        if limit:
            params["limit"] = limit
        resp = requests.get(
            "https://api.thepolarisreport.com/api/v1/congress/trades",
            headers={"Authorization": "Bearer {}".format(self.api_key)},
            params=params,
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        trades = data.get("trades", data.get("data", []))
        if not trades:
            return "No congressional trades found."
        lines = ["Congressional Stock Trades"]
        for t in trades[:20]:
            lines.append("- {} ({}) {} {} — ${} ({})".format(
                t.get("representative", t.get("member", "?")),
                t.get("party", "?"),
                t.get("type", t.get("transaction_type", "?")),
                t.get("ticker", t.get("symbol", "?")),
                t.get("amount", t.get("value", "?")),
                t.get("date", t.get("transaction_date", "?")),
            ))
        total = data.get("total", len(trades))
        if total > 20:
            lines.append("... and {} more trades".format(total - 20))
        return "\n".join(lines)


class InstitutionsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL')")


class PolarisInstitutionsTool(BaseTool):
    name: str = "veroq_institutions"
    description: str = "Get institutional holders (13F) for a ticker."
    args_schema: Type[BaseModel] = InstitutionsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import requests
        resp = requests.get(
            "https://api.thepolarisreport.com/api/v1/ticker/{}/institutions".format(symbol),
            headers={"Authorization": "Bearer {}".format(self.api_key)},
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        holders = data.get("holders", data.get("institutions", data.get("data", [])))
        if not holders:
            return "No institutional holder data found for '{}'.".format(symbol)
        lines = ["{} — Institutional Holders (13F)".format(symbol.upper())]
        for h in holders[:15]:
            lines.append("- {} — {} shares ({}%) valued at ${}".format(
                h.get("holder", h.get("institution", h.get("name", "?"))),
                h.get("shares", h.get("position", "?")),
                h.get("weight", h.get("percent", "?")),
                h.get("value", "?"),
            ))
            if h.get("change"):
                lines.append("  Change: {} shares".format(h["change"]))
        total = data.get("total", len(holders))
        if total > 15:
            lines.append("... and {} more holders".format(total - 15))
        return "\n".join(lines)


class RunAgentInput(BaseModel):
    slug: str = Field(description="Agent slug identifier (e.g. 'sector-analyst', 'earnings-reviewer')")
    params: Optional[str] = Field(default=None, description="JSON object of agent parameters (e.g. '{\"ticker\": \"AAPL\", \"depth\": \"deep\"}')")


class PolarisRunAgentTool(BaseTool):
    name: str = "veroq_run_agent"
    description: str = "Run a marketplace agent and get formatted results."
    args_schema: Type[BaseModel] = RunAgentInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, slug: str, params: str = None) -> str:
        import requests
        import json as _json
        body = {}
        if params:
            try:
                body = _json.loads(params)
            except (_json.JSONDecodeError, TypeError):
                return "Invalid params JSON. Expected a JSON object."
        resp = requests.post(
            "https://api.thepolarisreport.com/api/v1/agents/run/{}".format(slug),
            headers={"Authorization": "Bearer {}".format(self.api_key)},
            json=body,
        )
        data = resp.json()
        if resp.status_code != 200:
            return "Error: {}".format(data.get("error", resp.status_code))
        lines = ["Agent '{}' Results".format(slug)]
        if data.get("output"):
            lines.append(str(data["output"])[:2000])
        elif data.get("result"):
            if isinstance(data["result"], str):
                lines.append(data["result"][:2000])
            else:
                lines.append(_json.dumps(data["result"], indent=2, default=str)[:2000])
        elif data.get("markdown"):
            lines.append(data["markdown"][:2000])
        else:
            lines.append(_json.dumps(data, indent=2, default=str)[:2000])
        if data.get("credits_used"):
            lines.append("\nCredits used: {}".format(data["credits_used"]))
        return "\n".join(lines)


# ── Veroq aliases (primary names for this package) ──

VeroqSearchTool = PolarisSearchTool
VeroqFeedTool = PolarisFeedTool
VeroqBriefTool = PolarisBriefTool
VeroqTimelineTool = PolarisTimelineTool
VeroqEntityTool = PolarisEntityTool
VeroqExtractTool = PolarisExtractTool
VeroqResearchTool = PolarisResearchTool
VeroqCompareTool = PolarisCompareTool
VeroqTrendingTool = PolarisTrendingTool
VeroqVerifyTool = PolarisVerifyTool
VeroqForecastTool = PolarisForecastTool
VeroqContradictionsTool = PolarisContradictionsTool
VeroqEventsTool = PolarisEventsTool
VeroqWebSearchTool = PolarisWebSearchTool
VeroqCrawlTool = PolarisCrawlTool
VeroqTickerResolveTool = PolarisTickerResolveTool
VeroqTickerTool = PolarisTickerTool
VeroqTickerScoreTool = PolarisTickerScoreTool
VeroqSectorsTool = PolarisSectorsTool
VeroqPortfolioFeedTool = PolarisPortfolioFeedTool
VeroqEventsCalendarTool = PolarisEventsCalendarTool
VeroqCandlesTool = PolarisCandlesTool
VeroqTechnicalsTool = PolarisTechnicalsTool
VeroqMarketMoversTool = PolarisMarketMoversTool
VeroqEconomyTool = PolarisEconomyTool
VeroqCryptoTool = PolarisCryptoTool
VeroqBacktestTool = PolarisBacktestTool
VeroqCorrelationTool = PolarisCorrelationTool
VeroqScreenerTool = PolarisScreenerTool
VeroqNewsImpactTool = PolarisNewsImpactTool
VeroqCompetitorsTool = PolarisCompetitorsTool
VeroqDefiTool = PolarisDefiTool
VeroqAskTool = PolarisAskTool
VeroqFullTool = PolarisFullTool
VeroqInsiderTool = PolarisInsiderTool
VeroqFilingsTool = PolarisFilingsTool
VeroqAnalystsTool = PolarisAnalystsTool
VeroqCongressTool = PolarisCongressTool
VeroqInstitutionsTool = PolarisInstitutionsTool
VeroqRunAgentTool = PolarisRunAgentTool
