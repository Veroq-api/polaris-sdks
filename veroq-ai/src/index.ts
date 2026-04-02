// --- Primary tools ---
export { veroqAsk } from "./tools/veroq-ask.js";
export { veroqVerify } from "./tools/veroq-verify.js";

// --- Search & Discovery ---
export { veroqSearch } from "./tools/veroq-search.js";
export { veroqFeed } from "./tools/veroq-feed.js";
export { veroqBrief } from "./tools/veroq-brief.js";
export { veroqExtract } from "./tools/veroq-extract.js";
export { veroqEntities } from "./tools/veroq-entities.js";
export { veroqTrending } from "./tools/veroq-trending.js";
export { veroqCompare } from "./tools/veroq-compare.js";
export { veroqResearch } from "./tools/veroq-research.js";
export { veroqTimeline } from "./tools/veroq-timeline.js";
export { veroqForecast } from "./tools/veroq-forecast.js";
export { veroqContradictions } from "./tools/veroq-contradictions.js";
export { veroqEvents } from "./tools/veroq-events.js";
export { veroqWebSearch } from "./tools/veroq-web-search.js";
export { veroqCrawl } from "./tools/veroq-crawl.js";

// --- Market Data ---
export { veroqTickerResolve } from "./tools/veroq-ticker-resolve.js";
export { veroqTicker } from "./tools/veroq-ticker.js";
export { veroqTickerHistory } from "./tools/veroq-ticker-history.js";
export { veroqTickerScore } from "./tools/veroq-ticker-score.js";
export { veroqFull } from "./tools/veroq-full.js";
export { veroqSectors } from "./tools/veroq-sectors.js";
export { veroqPortfolioFeed } from "./tools/veroq-portfolio-feed.js";
export { veroqEventsCalendar } from "./tools/veroq-events-calendar.js";
export { veroqCandles } from "./tools/veroq-candles.js";
export { veroqTechnicals } from "./tools/veroq-technicals.js";
export { veroqMarketMovers } from "./tools/veroq-market-movers.js";
export { veroqEconomy } from "./tools/veroq-economy.js";
export { veroqForex } from "./tools/veroq-forex.js";
export { veroqCommodities } from "./tools/veroq-commodities.js";
export { veroqCrypto } from "./tools/veroq-crypto.js";
export { veroqCryptoDefi } from "./tools/veroq-crypto-defi.js";
export { veroqBacktest } from "./tools/veroq-backtest.js";
export { veroqCorrelation } from "./tools/veroq-correlation.js";
export { veroqScreener } from "./tools/veroq-screener.js";
export { veroqNewsImpact } from "./tools/veroq-news-impact.js";
export { veroqCompetitors } from "./tools/veroq-competitors.js";

// --- Social & Sentiment ---
export { veroqSocialSentiment } from "./tools/veroq-social-sentiment.js";
export { veroqSocialTrending } from "./tools/veroq-social-trending.js";

// --- Other ---
export { veroqIpoCalendar } from "./tools/veroq-ipo-calendar.js";
export { veroqTickerNews } from "./tools/veroq-ticker-news.js";
export { veroqTickerAnalysis } from "./tools/veroq-ticker-analysis.js";
export { veroqSearchSuggest } from "./tools/veroq-search-suggest.js";
export { veroqDefiProtocol } from "./tools/veroq-defi-protocol.js";
export { veroqEconomyIndicator } from "./tools/veroq-economy-indicator.js";
export { veroqGenerateReport } from "./tools/veroq-generate-report.js";
export { veroqGetReport } from "./tools/veroq-get-report.js";
export { veroqInsider } from "./tools/veroq-insider.js";
export { veroqFilings } from "./tools/veroq-filings.js";
export { veroqAnalysts } from "./tools/veroq-analysts.js";
export { veroqCongress } from "./tools/veroq-congress.js";
export { veroqInstitutions } from "./tools/veroq-institutions.js";
export { veroqRunAgent } from "./tools/veroq-run-agent.js";

// --- Convenience: all tools in one object ---
import { veroqAsk as _ask } from "./tools/veroq-ask.js";
import { veroqVerify as _verify } from "./tools/veroq-verify.js";
import { veroqSearch as _search } from "./tools/veroq-search.js";
import { veroqFeed as _feed } from "./tools/veroq-feed.js";
import { veroqBrief as _brief } from "./tools/veroq-brief.js";
import { veroqExtract as _extract } from "./tools/veroq-extract.js";
import { veroqEntities as _entities } from "./tools/veroq-entities.js";
import { veroqTrending as _trending } from "./tools/veroq-trending.js";
import { veroqCompare as _compare } from "./tools/veroq-compare.js";
import { veroqResearch as _research } from "./tools/veroq-research.js";
import { veroqTimeline as _timeline } from "./tools/veroq-timeline.js";
import { veroqForecast as _forecast } from "./tools/veroq-forecast.js";
import { veroqContradictions as _contradictions } from "./tools/veroq-contradictions.js";
import { veroqEvents as _events } from "./tools/veroq-events.js";
import { veroqWebSearch as _webSearch } from "./tools/veroq-web-search.js";
import { veroqCrawl as _crawl } from "./tools/veroq-crawl.js";
import { veroqTickerResolve as _tickerResolve } from "./tools/veroq-ticker-resolve.js";
import { veroqTicker as _ticker } from "./tools/veroq-ticker.js";
import { veroqTickerHistory as _tickerHistory } from "./tools/veroq-ticker-history.js";
import { veroqTickerScore as _tickerScore } from "./tools/veroq-ticker-score.js";
import { veroqFull as _full } from "./tools/veroq-full.js";
import { veroqSectors as _sectors } from "./tools/veroq-sectors.js";
import { veroqPortfolioFeed as _portfolioFeed } from "./tools/veroq-portfolio-feed.js";
import { veroqEventsCalendar as _eventsCalendar } from "./tools/veroq-events-calendar.js";
import { veroqCandles as _candles } from "./tools/veroq-candles.js";
import { veroqTechnicals as _technicals } from "./tools/veroq-technicals.js";
import { veroqMarketMovers as _marketMovers } from "./tools/veroq-market-movers.js";
import { veroqEconomy as _economy } from "./tools/veroq-economy.js";
import { veroqForex as _forex } from "./tools/veroq-forex.js";
import { veroqCommodities as _commodities } from "./tools/veroq-commodities.js";
import { veroqCrypto as _crypto } from "./tools/veroq-crypto.js";
import { veroqCryptoDefi as _cryptoDefi } from "./tools/veroq-crypto-defi.js";
import { veroqBacktest as _backtest } from "./tools/veroq-backtest.js";
import { veroqCorrelation as _correlation } from "./tools/veroq-correlation.js";
import { veroqScreener as _screener } from "./tools/veroq-screener.js";
import { veroqNewsImpact as _newsImpact } from "./tools/veroq-news-impact.js";
import { veroqCompetitors as _competitors } from "./tools/veroq-competitors.js";
import { veroqSocialSentiment as _socialSentiment } from "./tools/veroq-social-sentiment.js";
import { veroqSocialTrending as _socialTrending } from "./tools/veroq-social-trending.js";
import { veroqIpoCalendar as _ipoCalendar } from "./tools/veroq-ipo-calendar.js";
import { veroqTickerNews as _tickerNews } from "./tools/veroq-ticker-news.js";
import { veroqTickerAnalysis as _tickerAnalysis } from "./tools/veroq-ticker-analysis.js";
import { veroqSearchSuggest as _searchSuggest } from "./tools/veroq-search-suggest.js";
import { veroqDefiProtocol as _defiProtocol } from "./tools/veroq-defi-protocol.js";
import { veroqEconomyIndicator as _economyIndicator } from "./tools/veroq-economy-indicator.js";
import { veroqGenerateReport as _generateReport } from "./tools/veroq-generate-report.js";
import { veroqGetReport as _getReport } from "./tools/veroq-get-report.js";
import { veroqInsider as _insider } from "./tools/veroq-insider.js";
import { veroqFilings as _filings } from "./tools/veroq-filings.js";
import { veroqAnalysts as _analysts } from "./tools/veroq-analysts.js";
import { veroqCongress as _congress } from "./tools/veroq-congress.js";
import { veroqInstitutions as _institutions } from "./tools/veroq-institutions.js";
import { veroqRunAgent as _runAgent } from "./tools/veroq-run-agent.js";

/**
 * Returns all VEROQ tools in a single object, ready to pass to `generateText({ tools })`.
 * Optionally pass `{ apiKey }` to authenticate — otherwise uses POLARIS_API_KEY env var.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function veroqTools(options: { apiKey?: string } = {}): Record<string, any> {
  return {
    ask: _ask(options),
    verify: _verify(options),
    search: _search(options),
    feed: _feed(options),
    brief: _brief(options),
    extract: _extract(options),
    entities: _entities(options),
    trending: _trending(options),
    compare: _compare(options),
    research: _research(options),
    timeline: _timeline(options),
    forecast: _forecast(options),
    contradictions: _contradictions(options),
    events: _events(options),
    webSearch: _webSearch(options),
    crawl: _crawl(options),
    tickerResolve: _tickerResolve(options),
    ticker: _ticker(options),
    tickerHistory: _tickerHistory(options),
    tickerScore: _tickerScore(options),
    full: _full(options),
    sectors: _sectors(options),
    portfolioFeed: _portfolioFeed(options),
    eventsCalendar: _eventsCalendar(options),
    candles: _candles(options),
    technicals: _technicals(options),
    marketMovers: _marketMovers(options),
    economy: _economy(options),
    forex: _forex(options),
    commodities: _commodities(options),
    crypto: _crypto(options),
    cryptoDefi: _cryptoDefi(options),
    backtest: _backtest(options),
    correlation: _correlation(options),
    screener: _screener(options),
    newsImpact: _newsImpact(options),
    competitors: _competitors(options),
    socialSentiment: _socialSentiment(options),
    socialTrending: _socialTrending(options),
    ipoCalendar: _ipoCalendar(options),
    tickerNews: _tickerNews(options),
    tickerAnalysis: _tickerAnalysis(options),
    searchSuggest: _searchSuggest(options),
    defiProtocol: _defiProtocol(options),
    economyIndicator: _economyIndicator(options),
    generateReport: _generateReport(options),
    getReport: _getReport(options),
    insider: _insider(options),
    filings: _filings(options),
    analysts: _analysts(options),
    congress: _congress(options),
    institutions: _institutions(options),
    runAgent: _runAgent(options),
  };
}
