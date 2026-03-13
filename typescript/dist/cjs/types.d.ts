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
export interface SearchResponse {
    briefs: Brief[];
    total: number;
    facets?: Record<string, unknown>;
    relatedQueries?: string[];
    didYouMean?: string;
    tookMs?: number;
    meta?: Record<string, unknown>;
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
}
export interface TrendingOptions {
    period?: string;
    limit?: number;
}
export interface StreamOptions {
    categories?: string;
}
export interface PolarisClientOptions {
    apiKey?: string;
    baseUrl?: string;
}
//# sourceMappingURL=types.d.ts.map