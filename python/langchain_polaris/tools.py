from typing import List, Optional, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from polaris_news import PolarisClient


class SearchInput(BaseModel):
    query: str = Field(description="Search query for verified intelligence")
    category: Optional[str] = Field(default=None, description="Category slug (e.g. ai_ml, markets, crypto)")
    depth: Optional[str] = Field(default=None, description="Speed tier: fast, standard, or deep")


class PolarisSearchTool(BaseTool):
    name: str = "polaris_search"
    description: str = "Search verified intelligence across 18 verticals. Returns briefs with confidence scores and bias ratings."
    args_schema: Type[BaseModel] = SearchInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_feed"
    description: str = "Get latest verified intelligence briefs, optionally filtered by category or source domain."
    args_schema: Type[BaseModel] = FeedInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_entities"
    description: str = "Look up entities (companies, people, technologies) mentioned in verified intelligence coverage."
    args_schema: Type[BaseModel] = EntityInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_brief"
    description: str = "Get a specific verified intelligence brief by ID with full analysis, sources, and counter-arguments."
    args_schema: Type[BaseModel] = BriefInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_timeline"
    description: str = "Get the story evolution timeline for a living brief, showing how it developed over time with versioned updates."
    args_schema: Type[BaseModel] = TimelineInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_extract"
    description: str = "Extract clean article content from URLs. Returns structured text with metadata."
    args_schema: Type[BaseModel] = ExtractInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_research"
    description: str = "Deep research across verified intelligence briefs. Expands a query into sub-queries, searches in parallel, aggregates entities, and synthesizes a comprehensive report with key findings and information gaps. Requires Growth plan. Costs 5 API credits."
    args_schema: Type[BaseModel] = ResearchInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_verify"
    description: str = "Fact-check a claim against the Polaris brief corpus. Returns a verdict (supported/contradicted/partially_supported/unverifiable) with confidence, evidence, and nuances. Costs 3 API credits."
    args_schema: Type[BaseModel] = VerifyInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_compare"
    description: str = "Compare how different outlets covered the same story. Shows framing, bias, and what each side emphasizes or omits."
    args_schema: Type[BaseModel] = CompareInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_forecast"
    description: str = "Generate a forward-looking forecast for a topic based on current intelligence trends, momentum signals, and historical patterns."
    args_schema: Type[BaseModel] = ForecastInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

    def _run(self, topic: str, depth: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.forecast(topic, depth=depth)
        import json
        return json.dumps(result, indent=2, default=str)


class ContradictionsInput(BaseModel):
    severity: Optional[str] = Field(default=None, description="Filter by severity level (e.g. high, medium, low)")


class PolarisContradictionsTool(BaseTool):
    name: str = "polaris_contradictions"
    description: str = "Find contradictions across the intelligence brief network — stories where sources disagree on facts, framing, or conclusions."
    args_schema: Type[BaseModel] = ContradictionsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

    def _run(self, severity: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.contradictions(severity=severity)
        import json
        return json.dumps(result, indent=2, default=str)


class EventsInput(BaseModel):
    type: Optional[str] = Field(default=None, description="Event type to filter by")
    subject: Optional[str] = Field(default=None, description="Subject or entity to filter events for")


class PolarisEventsTool(BaseTool):
    name: str = "polaris_events"
    description: str = "Get notable events detected across intelligence briefs — significant developments, announcements, and inflection points."
    args_schema: Type[BaseModel] = EventsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_web_search"
    description: str = "Search the web with optional Polaris trust scoring. Returns web results with relevance and optional verification."
    args_schema: Type[BaseModel] = WebSearchInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_crawl"
    description: str = "Extract structured content from a URL with optional link following. Returns page content, metadata, and optionally discovered links."
    args_schema: Type[BaseModel] = CrawlInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

    def _run(self, url: str, depth: int = None, max_pages: int = None, include_links: bool = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.crawl(url, depth=depth or 1, max_pages=max_pages or 5, include_links=include_links if include_links is not None else True)
        import json
        return json.dumps(result, indent=2, default=str)


class TrendingInput(BaseModel):
    limit: Optional[int] = Field(default=None, description="Max number of trending entities to return")


class PolarisTrendingTool(BaseTool):
    name: str = "polaris_trending"
    description: str = "Get trending entities across the intelligence network — the people, companies, and topics generating the most coverage right now."
    args_schema: Type[BaseModel] = TrendingInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_ticker_resolve"
    description: str = "Resolve ticker symbols to canonical entities. Returns matched tickers with entity names, exchanges, asset types, and sectors. Unresolved symbols are listed separately."
    args_schema: Type[BaseModel] = TickerResolveInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_ticker"
    description: str = "Look up a single ticker symbol. Returns entity name, exchange, sector, 24h brief count, sentiment score, and trending status."
    args_schema: Type[BaseModel] = TickerInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_ticker_score"
    description: str = "Get a composite trading signal score for a ticker. Combines sentiment (40%), momentum (25%), coverage volume (20%), and event proximity (15%) into a single score from -1 to +1 with a signal label (strong_bullish/bullish/neutral/bearish/strong_bearish)."
    args_schema: Type[BaseModel] = TickerScoreInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_sectors"
    description: str = "Get a sector-level overview of market sentiment. Returns each sector's ticker count, brief count, average sentiment, top ticker, and bullish/bearish/neutral signal."
    args_schema: Type[BaseModel] = SectorsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_portfolio_feed"
    description: str = "Get ranked intelligence for a portfolio of holdings. Pass ticker/weight pairs and receive briefs scored by portfolio relevance, plus a per-holding summary with brief counts and sentiment."
    args_schema: Type[BaseModel] = PortfolioFeedInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
    name: str = "polaris_events_calendar"
    description: str = "Get structured market events from intelligence briefs, filterable by ticker and event type. Returns events with brief context, market session, and a summary breakdown by event type."
    args_schema: Type[BaseModel] = EventsCalendarInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=api_key, **kwargs)

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
