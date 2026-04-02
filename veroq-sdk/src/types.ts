export interface Source {
  name: string;
  url: string;
  trustLevel?: string;
  verified?: boolean;
}

export interface Entity {
  name: string;
  type?: string;
  sentiment?: string;
  mentionCount?: number;
  ticker?: string;
  role?: string;
}

export interface Provenance {
  reviewStatus?: string;
  aiContributionPct?: number;
  humanContributionPct?: number;
  confidenceScore?: number;
  biasScore?: number;
  agentsInvolved?: string[];
}

export interface Brief {
  id?: string;
  headline: string;
  summary?: string;
  body?: string;
  confidence?: number;
  biasScore?: number;
  sentiment?: string;
  counterArgument?: string;
  category?: string;
  tags?: string[];
  sources?: Source[];
  entitiesEnriched?: Entity[];
  structuredData?: Record<string, unknown>;
  publishedAt?: string;
  reviewStatus?: string;
  provenance?: Provenance;
  briefType?: string;
  trending?: boolean;
  topics?: string[];
  entities?: string[];
  impactScore?: number;
  readTimeSeconds?: number;
  sourceCount?: number;
  correctionsCount?: number;
  biasAnalysis?: Record<string, unknown>;
  fullSources?: Record<string, unknown>[];
}

export interface FeedResponse {
  briefs: Brief[];
  total: number;
  page: number;
  perPage: number;
  generatedAt?: string;
  agentVersion?: string;
  sourcesScanned24h?: number;
}

export interface DepthMetadata {
  depth?: string;
  searchMs?: number;
  crossRefMs?: number;
  verificationMs?: number;
  totalMs?: number;
}

export interface EntityCrossRef {
  briefId?: string;
  headline?: string;
  publishedAt?: string;
}

export interface SourceVerification {
  checked: number;
  accessible: number;
  inaccessible: number;
}

export interface SearchResponse {
  briefs: Brief[];
  total: number;
  facets?: Record<string, unknown> | null;
  relatedQueries?: string[] | null;
  didYouMean?: string;
  tookMs?: number;
  meta?: Record<string, unknown>;
  depthMetadata?: DepthMetadata;
}

export interface ExtractResult {
  url: string;
  title?: string;
  text?: string;
  wordCount?: number;
  language?: string;
  publishedDate?: string;
  domain?: string;
  success: boolean;
  error?: string;
}

export interface ExtractResponse {
  results: ExtractResult[];
  creditsUsed: number;
}

export interface Cluster {
  clusterId?: string;
  topic: string;
  briefCount: number;
  categories?: string[];
  briefs?: Brief[];
  latest?: string;
}

export interface ClustersResponse {
  clusters: Cluster[];
  period?: string;
}

export interface DataPointValue {
  type?: string;
  value?: unknown;
  context?: string;
  entity?: string;
}

export interface DataPoint {
  briefId?: string;
  headline?: string;
  dataPoint?: DataPointValue;
  publishedAt?: string;
}

export interface DataResponse {
  data: DataPoint[];
}

export interface EntitiesResponse {
  entities: Entity[];
}

export interface SourceAnalysis {
  outlet?: string;
  headline?: string;
  framing?: string;
  politicalLean?: string;
  loadedLanguage?: string[];
  emphasis?: string[];
  omissions?: string[];
  sentiment?: Record<string, string>;
  rawExcerpt?: string;
}

export interface ComparisonResponse {
  topic?: string;
  shareId?: string;
  polarisBrief?: Brief;
  sourceAnalyses?: SourceAnalysis[];
  polarisAnalysis?: Record<string, unknown>;
  generatedAt?: string;
}

export interface FeedOptions {
  category?: string;
  limit?: number;
  page?: number;
  perPage?: number;
  minConfidence?: number;
  includeSources?: string;
  excludeSources?: string;
}

export interface BriefOptions {
  includeFullText?: boolean;
}

export interface SearchOptions {
  category?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  minConfidence?: number;
  from?: string;
  to?: string;
  entity?: string;
  sentiment?: string;
  depth?: string;
  includeSources?: string;
  excludeSources?: string;
}

export interface EntitiesOptions {
  q?: string;
  type?: string;
  limit?: number;
}

export interface EntityBriefsOptions {
  role?: string;
  limit?: number;
  offset?: number;
}

export interface SimilarOptions {
  limit?: number;
}

export interface ClustersOptions {
  period?: string;
  limit?: number;
}

export interface DataOptions {
  entity?: string;
  type?: string;
  limit?: number;
}

export interface AgentFeedOptions {
  category?: string;
  tags?: string;
  limit?: number;
  minConfidence?: number;
  includeSources?: string;
  excludeSources?: string;
}

export interface TrendingOptions {
  period?: string;
  limit?: number;
}

export interface StreamOptions {
  categories?: string;
}

export interface ResearchOptions {
  maxSources?: number;
  depth?: string;
  category?: string;
  includeSources?: string;
  excludeSources?: string;
  outputSchema?: Record<string, unknown>;
}

export interface ResearchSourceUsed {
  briefId?: string;
  headline?: string;
  confidence?: number;
  category?: string;
}

export interface ResearchEntityCooccurrence {
  entity?: string;
  count?: number;
}

export interface ResearchEntity {
  name?: string;
  type?: string;
  mentions?: number;
  coOccursWith?: ResearchEntityCooccurrence[];
}

export interface ResearchMetadata {
  briefsAnalyzed: number;
  uniqueSources: number;
  processingTimeMs?: number;
  modelsUsed?: string[];
}

export interface ResearchResponse {
  query: string;
  report?: Record<string, unknown>;
  sourcesUsed?: ResearchSourceUsed[];
  entityMap?: ResearchEntity[];
  subQueries?: string[];
  metadata?: ResearchMetadata;
  structuredOutput?: unknown;
  structuredOutputError?: string;
}

export interface VerifyOptions {
  context?: string;
}

export interface VerifyBrief {
  id: string;
  headline: string;
  confidence: number;
  relevance: number | null;
}

export interface VerifyResponse {
  claim: string;
  verdict: "supported" | "contradicted" | "partially_supported" | "unverifiable";
  confidence: number;
  summary: string;
  supportingBriefs: VerifyBrief[];
  contradictingBriefs: VerifyBrief[];
  nuances: string | null;
  sourcesAnalyzed: number;
  briefsMatched: number;
  creditsUsed: number;
  cached: boolean;
  processingTimeMs: number;
  modelUsed: string | null;
}

/** @deprecated Use VeroqClientOptions instead */
export type PolarisClientOptions = VeroqClientOptions;

export interface VeroqClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

// -- Trading --

export interface TickerResolveResult {
  symbol: string;
  name?: string;
  sector?: string;
  found: boolean;
}

export interface TickerResolveResponse {
  tickers: TickerResolveResult[];
}

export interface TickerResponse {
  symbol: string;
  name?: string;
  sector?: string;
  sentiment?: string;
  sentimentScore?: number;
  briefCount?: number;
  lastMentioned?: string;
}

export interface TickerHistoryPoint {
  date: string;
  sentimentScore?: number;
  briefCount?: number;
  volume?: number;
}

export interface TickerHistoryOptions {
  days?: number;
}

export interface TickerHistoryResponse {
  symbol: string;
  history: TickerHistoryPoint[];
}

export interface TickerSignal {
  date: string;
  type?: string;
  direction?: string;
  strength?: number;
  description?: string;
}

export interface TickerSignalsOptions {
  days?: number;
  threshold?: number;
}

export interface TickerSignalsResponse {
  symbol: string;
  signals: TickerSignal[];
}

export interface TickerCorrelation {
  symbol: string;
  name?: string;
  correlation?: number;
  sharedBriefs?: number;
}

export interface TickerCorrelationsOptions {
  days?: number;
  limit?: number;
}

export interface TickerCorrelationsResponse {
  symbol: string;
  correlations: TickerCorrelation[];
}

export interface TickerScoreResponse {
  symbol: string;
  score?: number;
  components?: Record<string, unknown>;
  updatedAt?: string;
}

export interface SectorsOptions {
  days?: number;
}

export interface SectorSummary {
  sector: string;
  sentiment?: string;
  sentimentScore?: number;
  briefCount?: number;
  topTickers?: string[];
}

export interface SectorsResponse {
  sectors: SectorSummary[];
}

export interface SectorTickersOptions {
  days?: number;
  sort?: "sentiment" | "briefs";
}

export interface SectorTicker {
  symbol: string;
  name?: string;
  sentiment?: string;
  sentimentScore?: number;
  briefCount?: number;
}

export interface SectorTickersResponse {
  sector: string;
  tickers: SectorTicker[];
}

export interface EventsCalendarOptions {
  days?: number;
  ticker?: string;
  type?: string;
  limit?: number;
}

export interface CalendarEvent {
  date: string;
  type?: string;
  title?: string;
  ticker?: string;
  description?: string;
  impact?: string;
}

export interface EventsCalendarResponse {
  events: CalendarEvent[];
}

export interface PortfolioHolding {
  ticker: string;
  weight: number;
}

export interface PortfolioFeedOptions {
  days?: number;
  limit?: number;
}

export interface PortfolioFeedResponse {
  briefs: Brief[];
  holdings: PortfolioHolding[];
}

// -- AV Parity: Candles, Financials, Earnings, Indicators, Technicals --

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleOptions {
  interval?: string;
  range?: string;
}

export interface CandleResponse {
  status: string;
  symbol: string;
  name?: string;
  interval: string;
  range: string;
  candle_count: number;
  candles: Candle[];
}

export interface FinancialsResponse {
  status: string;
  ticker?: string;
  company_name?: string;
  entity_name?: string;
  exchange?: string;
  sector?: string;
  [key: string]: unknown;
}

export interface EarningsResponse {
  status: string;
  ticker: string;
  entity_name?: string;
  exchange?: string;
  sector?: string;
  earnings_date?: string;
  eps_estimate?: number;
  revenue_estimate?: number;
  fiscal_quarter?: string;
  fetched_at?: string;
}

export interface IndicatorOptions {
  period?: number;
  range?: string;
  fast?: number;
  slow?: number;
  signal?: number;
  kPeriod?: number;
  dPeriod?: number;
  stdDev?: number;
}

export interface IndicatorResponse {
  status: string;
  symbol: string;
  indicator: string;
  [key: string]: unknown;
}

export interface TechnicalsOptions {
  range?: string;
}

export interface TechnicalsResponse {
  status: string;
  symbol: string;
  [key: string]: unknown;
}

// -- Market --

export interface MarketMover {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  change_percent?: number;
  volume?: number;
}

export interface MarketMoversResponse {
  status: string;
  gainers: MarketMover[];
  losers: MarketMover[];
  most_active: MarketMover[];
  fetched_at?: string;
}

export interface MarketIndex {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  change_percent?: number;
}

export interface MarketSummaryResponse {
  status: string;
  indices: MarketIndex[];
  fetched_at?: string;
}

export interface MarketEarningsOptions {
  days?: number;
  sector?: string;
  limit?: number;
}

export interface MarketEarningsResponse {
  status: string;
  [key: string]: unknown;
}

// -- Forex --

export interface ForexPair {
  pair: string;
  rate?: number;
  change?: number;
  change_percent?: number;
}

export interface ForexResponse {
  status: string;
  pairs: ForexPair[];
  available?: Array<{ pair: string; label: string }>;
  fetched_at?: string;
}

export interface ForexRateResponse {
  status: string;
  pair?: string;
  rate?: number;
  change?: number;
  change_percent?: number;
  [key: string]: unknown;
}

export interface ForexCandleOptions {
  interval?: string;
  range?: string;
}

// -- Commodities --

export interface CommodityInfo {
  slug?: string;
  name?: string;
  price?: number;
  change?: number;
  change_percent?: number;
}

export interface CommoditiesResponse {
  status: string;
  commodities: CommodityInfo[];
  available?: Array<{ slug: string; name: string }>;
  fetched_at?: string;
}

export interface CommodityResponse {
  status: string;
  slug?: string;
  name?: string;
  price?: number;
  change?: number;
  change_percent?: number;
  [key: string]: unknown;
}

export interface CommodityCandleOptions {
  interval?: string;
  range?: string;
}

// -- Economy --

export interface EconomyIndicatorSummary {
  slug?: string;
  name?: string;
  latest_value?: number | null;
  units?: string;
}

export interface EconomyResponse {
  status: string;
  indicator_count?: number;
  indicators: EconomyIndicatorSummary[];
  fetched_at?: string;
}

export interface EconomyIndicatorOptions {
  limit?: number;
}

export interface EconomyIndicatorResponse {
  status: string;
  indicator: string;
  name?: string;
  series_id?: string;
  frequency?: string;
  units?: string;
  latest?: unknown;
  observation_count?: number;
  observations?: Array<{ date: string; value: number | null }>;
  fetched_at?: string;
}

export interface YieldCurveYield {
  maturity: string;
  rate?: number;
}

export interface YieldCurveResponse {
  status: string;
  yields: YieldCurveYield[];
  spread_10y_2y?: number;
  inverted?: boolean;
  fetched_at?: string;
}

// -- Crypto --

export interface CryptoResponse {
  status: string;
  total_market_cap?: number;
  btc_dominance?: number;
  [key: string]: unknown;
}

export interface CryptoTokenResponse {
  status: string;
  symbol?: string;
  name?: string;
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  change_24h?: number;
  [key: string]: unknown;
}

export interface CryptoTopOptions {
  limit?: number;
}

export interface CryptoTopResponse {
  status: string;
  count: number;
  tokens: Array<Record<string, unknown>>;
  fetched_at?: string;
}

export interface CryptoChartOptions {
  days?: number;
}

export interface CryptoChartPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface CryptoChartResponse {
  status: string;
  symbol: string;
  coin_id?: string;
  days: number;
  data_points: number;
  chart: CryptoChartPoint[];
}

export interface DefiResponse {
  status: string;
  total_tvl?: number;
  [key: string]: unknown;
}

export interface DefiProtocolResponse {
  status: string;
  name?: string;
  slug?: string;
  tvl?: number;
  [key: string]: unknown;
}

// -- Screener --

export interface ScreenerFilters {
  sentiment_above?: number;
  sentiment_below?: number;
  sector?: string;
  rsi_below?: number;
  rsi_above?: number;
  market_cap_min?: number;
  market_cap_max?: number;
  volume_min?: number;
  earnings_within_days?: number;
  asset_type?: string;
  sort?: string;
  limit?: number;
  [key: string]: unknown;
}

export interface ScreenerResult {
  ticker: string;
  name?: string;
  sector?: string;
  sentiment_score?: number;
  rsi?: number;
  price?: number;
  market_cap?: number;
  [key: string]: unknown;
}

export interface ScreenerResponse {
  status: string;
  results: ScreenerResult[];
  total?: number;
  filters_applied?: Record<string, unknown>;
}

export interface ScreenerNaturalOptions {
  limit?: number;
}

export interface ScreenerPreset {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, unknown>;
}

export interface ScreenerPresetsResponse {
  status: string;
  presets: ScreenerPreset[];
}

// -- Alerts --

export interface AlertOptions {
  callbackUrl?: string;
}

export interface Alert {
  id: string;
  ticker: string;
  alertType: string;
  threshold: number;
  status?: string;
  callbackUrl?: string;
  createdAt?: string;
  triggeredAt?: string;
}

export interface AlertsResponse {
  status: string;
  alerts: Alert[];
}

export interface TriggeredAlertsOptions {
  since?: string;
  limit?: number;
}

// -- Backtest --

export interface BacktestStrategy {
  entry_filters: Record<string, unknown>;
  exit_filters: Record<string, unknown>;
  asset_type?: string;
  sector?: string;
  [key: string]: unknown;
}

export interface BacktestOptions {
  period?: string;
  [key: string]: unknown;
}

export interface BacktestResponse {
  status: string;
  performance: {
    total_return_pct: number;
    max_drawdown_pct?: number;
    sharpe_ratio?: number;
    win_rate?: number;
    total_trades?: number;
    [key: string]: unknown;
  };
  trades?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

// -- Correlation --

export interface CorrelationOptions {
  days?: number;
}

export interface CorrelationResponse {
  status: string;
  tickers: string[];
  matrix: number[][];
  period_days?: number;
  [key: string]: unknown;
}

// -- Ticker Intelligence --

export interface NewsImpactResponse {
  status: string;
  symbol: string;
  impacts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface CompetitorsResponse {
  status: string;
  symbol: string;
  competitors?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface TranscriptsOptions {
  days?: number;
}

export interface TranscriptsResponse {
  status: string;
  symbol: string;
  transcripts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}
