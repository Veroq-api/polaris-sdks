import os
from typing import Optional, Type

import requests
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from polaris_news import PolarisClient

BASE_URL = "https://api.thepolarisreport.com"


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


class ForexInput(BaseModel):
    pair: Optional[str] = Field(default=None, description="Forex pair (e.g. EURUSD, GBPJPY). Omit for all major pairs.")


class PolarisForexTool(BaseTool):
    name: str = "veroq_forex"
    description: str = "Get forex rates. Without a pair, returns all major currency pairs with current rates. With a pair, returns that pair's rate, change, and session data."
    args_schema: Type[BaseModel] = ForexInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, pair: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.forex(pair=pair)
        if pair:
            lines = ["{} — Forex".format(result.get("pair", pair))]
            lines.append("Rate: {} | Change: {}%".format(
                result.get("rate", result.get("price", "N/A")),
                result.get("change_percent", result.get("changesPercentage", "N/A")),
            ))
            if result.get("high"):
                lines.append("High: {} | Low: {} | Open: {}".format(
                    result.get("high", "N/A"),
                    result.get("low", "N/A"),
                    result.get("open", "N/A"),
                ))
        else:
            pairs = result.get("pairs", result.get("rates", []))
            if not pairs:
                return "No forex data available."
            lines = ["Forex Rates ({} pairs)".format(len(pairs))]
            for p in pairs:
                lines.append("  {} = {} ({}%)".format(
                    p.get("pair", p.get("symbol", "?")),
                    p.get("rate", p.get("price", "?")),
                    p.get("change_percent", p.get("changesPercentage", "N/A")),
                ))
        return "\n".join(lines)


class CommoditiesInput(BaseModel):
    symbol: Optional[str] = Field(default=None, description="Commodity symbol (e.g. GC for gold, CL for crude oil). Omit for all commodities.")


class PolarisCommoditiesTool(BaseTool):
    name: str = "veroq_commodities"
    description: str = "Get commodity prices. Without a symbol, returns all tracked commodities with current prices. With a symbol, returns that commodity's price, change, and details."
    args_schema: Type[BaseModel] = CommoditiesInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.commodities(symbol=symbol)
        if symbol:
            lines = ["{} — {}".format(
                result.get("symbol", symbol),
                result.get("name", "Commodity"),
            )]
            lines.append("Price: ${} | Change: {}%".format(
                result.get("price", "N/A"),
                result.get("change_percent", result.get("changesPercentage", "N/A")),
            ))
            if result.get("high"):
                lines.append("High: ${} | Low: ${} | Open: ${}".format(
                    result.get("high", "N/A"),
                    result.get("low", "N/A"),
                    result.get("open", "N/A"),
                ))
        else:
            commodities = result.get("commodities", result.get("data", []))
            if not commodities:
                return "No commodity data available."
            lines = ["Commodities ({} tracked)".format(len(commodities))]
            for c in commodities:
                lines.append("  {} ({}) — ${} ({}%)".format(
                    c.get("symbol", "?"),
                    c.get("name", "?"),
                    c.get("price", "?"),
                    c.get("change_percent", c.get("changesPercentage", "N/A")),
                ))
        return "\n".join(lines)


# ── Crypto Tools ──


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


# ── Social Tools ──


class SocialSentimentInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get social sentiment for (e.g. 'NVDA')")


class PolarisSocialSentimentTool(BaseTool):
    name: str = "veroq_social_sentiment"
    description: str = "Get social media sentiment for a ticker symbol. Returns sentiment scores, volume, and trending metrics from social platforms."
    args_schema: Type[BaseModel] = SocialSentimentInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.social_sentiment(symbol)
        import json
        return json.dumps(result, indent=2, default=str)


class SocialTrendingInput(BaseModel):
    pass


class PolarisSocialTrendingTool(BaseTool):
    name: str = "veroq_social_trending"
    description: str = "Get trending tickers on social media. Returns the most discussed and fastest-rising tickers across social platforms."
    args_schema: Type[BaseModel] = SocialTrendingInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.social_trending()
        import json
        return json.dumps(result, indent=2, default=str)


# ── IPO Calendar Tool ──


class IPOCalendarInput(BaseModel):
    status: Optional[str] = Field(default=None, description="Filter by IPO status (e.g. upcoming, filed, priced)")


class PolarisIPOCalendarTool(BaseTool):
    name: str = "veroq_ipo_calendar"
    description: str = "Get upcoming IPOs. Returns the IPO calendar with company names, expected dates, price ranges, and status. Optionally filter by status."
    args_schema: Type[BaseModel] = IPOCalendarInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, status: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.ipo_calendar(status=status)
        import json
        return json.dumps(result, indent=2, default=str)


# ── Ticker News & Analysis Tools ──


class TickerNewsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get news for (e.g. 'AAPL')")
    limit: Optional[int] = Field(default=None, description="Max number of news briefs to return (default 10)")


class PolarisTickerNewsTool(BaseTool):
    name: str = "veroq_ticker_news"
    description: str = "Get recent news briefs for a specific ticker symbol. Returns headlines, summaries, sentiment, and publication dates."
    args_schema: Type[BaseModel] = TickerNewsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str, limit: int = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.ticker_news(symbol, limit=limit or 10)
        import json
        return json.dumps(result, indent=2, default=str)


class TickerAnalysisInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get analysis for (e.g. 'TSLA')")


class PolarisTickerAnalysisTool(BaseTool):
    name: str = "veroq_ticker_analysis"
    description: str = "Get full analysis for a ticker symbol. Returns comprehensive coverage including sentiment, price data, technicals, and news summary."
    args_schema: Type[BaseModel] = TickerAnalysisInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.ticker_analysis(symbol)
        import json
        return json.dumps(result, indent=2, default=str)


# ── Search Suggest Tool ──


class SearchSuggestInput(BaseModel):
    q: str = Field(description="Partial query string for autocomplete suggestions")


class PolarisSearchSuggestTool(BaseTool):
    name: str = "veroq_search_suggest"
    description: str = "Get search autocomplete suggestions. Returns matching topics, entities, and tickers as the user types a query."
    args_schema: Type[BaseModel] = SearchSuggestInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, q: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.search_suggest(q)
        import json
        return json.dumps(result, indent=2, default=str)


# ── DeFi Protocol Tool ──


class DefiProtocolInput(BaseModel):
    protocol: str = Field(description="DeFi protocol slug (e.g. aave, uniswap, lido)")


class PolarisDefiProtocolTool(BaseTool):
    name: str = "veroq_defi_protocol"
    description: str = "Get detailed data for a specific DeFi protocol. Returns TVL, chain, category, and historical TVL data."
    args_schema: Type[BaseModel] = DefiProtocolInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, protocol: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.defi_protocol(protocol)
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
        return "\n".join(lines)


# ── Economy Indicator Tool ──


class EconomyIndicatorInput(BaseModel):
    indicator: str = Field(description="Economic indicator slug (e.g. gdp, cpi, unemployment, fed_funds)")


class PolarisEconomyIndicatorTool(BaseTool):
    name: str = "veroq_economy_indicator"
    description: str = "Get data for a specific economic indicator. Returns the indicator name, latest value, units, frequency, and historical observations."
    args_schema: Type[BaseModel] = EconomyIndicatorInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, indicator: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.economy_indicator(indicator)
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
        return "\n".join(lines)


# ── Report Tools ──


class GenerateReportInput(BaseModel):
    ticker: str = Field(description="Ticker symbol to generate a report for (e.g. 'AAPL', 'BTC')")
    tier: Optional[str] = Field(default=None, description="Report tier — 'quick' for a fast summary or 'deep' for full analysis (default 'quick')")


class PolarisGenerateReportTool(BaseTool):
    name: str = "veroq_generate_report"
    description: str = "Generate an AI-powered research report for a ticker symbol. Returns a comprehensive analysis including fundamentals, technicals, and news sentiment."
    args_schema: Type[BaseModel] = GenerateReportInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, ticker: str, tier: str = None) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.generate_report(ticker, tier=tier or 'quick')
        import json
        return json.dumps(result, indent=2, default=str)


class GetReportInput(BaseModel):
    report_id: str = Field(description="The report ID to retrieve")


class PolarisGetReportTool(BaseTool):
    name: str = "veroq_get_report"
    description: str = "Retrieve a previously generated report by its ID. Returns the full report content including all analysis sections."
    args_schema: Type[BaseModel] = GetReportInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, report_id: str) -> str:
        client = PolarisClient(api_key=self.api_key)
        result = client.get_report(report_id)
        import json
        return json.dumps(result, indent=2, default=str)


# ── Ask Tool ──


class AskInput(BaseModel):
    question: str = Field(description="Natural language question about markets, finance, or any topic covered by Polaris intelligence")
    context: Optional[str] = Field(default=None, description="Optional context or ticker symbol to focus the answer")


class PolarisAskTool(BaseTool):
    name: str = "veroq_ask"
    description: str = "Ask any natural language question and get an AI-powered answer grounded in verified intelligence. The most versatile tool — handles market questions, ticker lookups, comparisons, and general research."
    args_schema: Type[BaseModel] = AskInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, question: str, context: str = None) -> str:
        import json
        payload = {"question": question}
        if context:
            payload["context"] = context
        resp = requests.post(
            "{}/api/v1/ask".format(BASE_URL),
            json=payload,
            headers={"X-API-Key": self.api_key},
            timeout=60,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Full Ticker Profile Tool ──


class FullInput(BaseModel):
    symbol: str = Field(description="Ticker symbol (e.g. 'AAPL', 'BTC', 'GC')")


class PolarisFullTool(BaseTool):
    name: str = "veroq_full"
    description: str = "Get a complete ticker profile — price, fundamentals, technicals, news sentiment, and metadata in a single call."
    args_schema: Type[BaseModel] = FullInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import json
        resp = requests.get(
            "{}/api/v1/ticker/{}/full".format(BASE_URL, symbol.upper()),
            headers={"X-API-Key": self.api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Insider Trades Tool ──


class InsiderInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get insider trades for (e.g. 'AAPL')")


class PolarisInsiderTool(BaseTool):
    name: str = "veroq_insider"
    description: str = "Get recent insider trading activity for a ticker. Returns buy/sell transactions by company officers and directors with dates, amounts, and ownership changes."
    args_schema: Type[BaseModel] = InsiderInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import json
        resp = requests.get(
            "{}/api/v1/ticker/{}/insider".format(BASE_URL, symbol.upper()),
            headers={"X-API-Key": self.api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── SEC Filings Tool ──


class FilingsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get SEC filings for (e.g. 'TSLA')")


class PolarisFilingsTool(BaseTool):
    name: str = "veroq_filings"
    description: str = "Get recent SEC filings for a ticker. Returns 10-K, 10-Q, 8-K, and other filings with dates, types, and links."
    args_schema: Type[BaseModel] = FilingsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import json
        resp = requests.get(
            "{}/api/v1/ticker/{}/filings".format(BASE_URL, symbol.upper()),
            headers={"X-API-Key": self.api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Analyst Ratings Tool ──


class AnalystsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get analyst ratings for (e.g. 'NVDA')")


class PolarisAnalystsTool(BaseTool):
    name: str = "veroq_analysts"
    description: str = "Get analyst ratings and price targets for a ticker. Returns consensus rating, target prices, and individual analyst recommendations."
    args_schema: Type[BaseModel] = AnalystsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import json
        resp = requests.get(
            "{}/api/v1/ticker/{}/analysts".format(BASE_URL, symbol.upper()),
            headers={"X-API-Key": self.api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Congress Trades Tool ──


class CongressInput(BaseModel):
    symbol: Optional[str] = Field(default=None, description="Filter by ticker symbol (e.g. 'AAPL'). Omit for all recent trades.")
    chamber: Optional[str] = Field(default=None, description="Filter by chamber: 'senate' or 'house'. Omit for both.")


class PolarisCongressTool(BaseTool):
    name: str = "veroq_congress"
    description: str = "Get recent stock trades by members of the US Congress. Returns transaction details including member name, ticker, trade type, amount, and disclosure date."
    args_schema: Type[BaseModel] = CongressInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str = None, chamber: str = None) -> str:
        import json
        params = {}
        if symbol:
            params["symbol"] = symbol.upper()
        if chamber:
            params["chamber"] = chamber
        resp = requests.get(
            "{}/api/v1/congress/trades".format(BASE_URL),
            params=params,
            headers={"X-API-Key": self.api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Institutional Ownership Tool ──


class InstitutionsInput(BaseModel):
    symbol: str = Field(description="Ticker symbol to get institutional ownership for (e.g. 'MSFT')")


class PolarisInstitutionsTool(BaseTool):
    name: str = "veroq_institutions"
    description: str = "Get institutional ownership data for a ticker. Returns top institutional holders, shares held, percentage of outstanding shares, and recent changes."
    args_schema: Type[BaseModel] = InstitutionsInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, symbol: str) -> str:
        import json
        resp = requests.get(
            "{}/api/v1/ticker/{}/institutions".format(BASE_URL, symbol.upper()),
            headers={"X-API-Key": self.api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Run Agent Tool ──


class RunAgentInput(BaseModel):
    slug: str = Field(description="Agent slug identifier (e.g. 'market-analyst', 'risk-assessor')")
    input: str = Field(description="Input prompt or question for the agent to process")


class PolarisRunAgentTool(BaseTool):
    name: str = "veroq_run_agent"
    description: str = "Run a VEROQ AI agent by slug. Agents are specialized workflows for tasks like market analysis, risk assessment, and research synthesis. Returns the agent's structured output."
    args_schema: Type[BaseModel] = RunAgentInput
    api_key: str = ""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key=_resolve_api_key(api_key), **kwargs)

    def _run(self, slug: str, input: str) -> str:
        import json
        resp = requests.post(
            "{}/api/v1/agents/run/{}".format(BASE_URL, slug),
            json={"input": input},
            headers={"X-API-Key": self.api_key},
            timeout=120,
        )
        resp.raise_for_status()
        return json.dumps(resp.json(), indent=2, default=str)


# ── Veroq aliases (primary names for this package) ──

VeroqSearchTool = PolarisSearchTool
VeroqFeedTool = PolarisFeedTool
VeroqBriefTool = PolarisBriefTool
VeroqEntityTool = PolarisEntityTool
VeroqExtractTool = PolarisExtractTool
VeroqResearchTool = PolarisResearchTool
VeroqVerifyTool = PolarisVerifyTool
VeroqCompareTool = PolarisCompareTool
VeroqTrendingTool = PolarisTrendingTool
VeroqCandlesTool = PolarisCandlesTool
VeroqTechnicalsTool = PolarisTechnicalsTool
VeroqMarketMoversTool = PolarisMarketMoversTool
VeroqEconomyTool = PolarisEconomyTool
VeroqForexTool = PolarisForexTool
VeroqCommoditiesTool = PolarisCommoditiesTool
VeroqCryptoTool = PolarisCryptoTool
VeroqBacktestTool = PolarisBacktestTool
VeroqCorrelationTool = PolarisCorrelationTool
VeroqScreenerTool = PolarisScreenerTool
VeroqNewsImpactTool = PolarisNewsImpactTool
VeroqCompetitorsTool = PolarisCompetitorsTool
VeroqDefiTool = PolarisDefiTool
VeroqSocialSentimentTool = PolarisSocialSentimentTool
VeroqSocialTrendingTool = PolarisSocialTrendingTool
VeroqIPOCalendarTool = PolarisIPOCalendarTool
VeroqTickerNewsTool = PolarisTickerNewsTool
VeroqTickerAnalysisTool = PolarisTickerAnalysisTool
VeroqSearchSuggestTool = PolarisSearchSuggestTool
VeroqDefiProtocolTool = PolarisDefiProtocolTool
VeroqEconomyIndicatorTool = PolarisEconomyIndicatorTool
VeroqGenerateReportTool = PolarisGenerateReportTool
VeroqGetReportTool = PolarisGetReportTool
VeroqAskTool = PolarisAskTool
VeroqFullTool = PolarisFullTool
VeroqInsiderTool = PolarisInsiderTool
VeroqFilingsTool = PolarisFilingsTool
VeroqAnalystsTool = PolarisAnalystsTool
VeroqCongressTool = PolarisCongressTool
VeroqInstitutionsTool = PolarisInstitutionsTool
VeroqRunAgentTool = PolarisRunAgentTool
