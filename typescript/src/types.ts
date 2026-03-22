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

export interface PolarisClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

// ── Trading ──

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
