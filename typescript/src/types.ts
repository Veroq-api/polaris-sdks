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
  source?: string;
  url?: string;
  summary?: string;
  bias?: string;
  trustLevel?: string;
}

export interface ComparisonResponse {
  topic?: string;
  shareId?: string;
  polarisBrief?: Brief;
  sourceAnalyses?: SourceAnalysis[];
  polarisAnalysis?: string;
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

export interface PolarisClientOptions {
  apiKey?: string;
  baseUrl?: string;
}
