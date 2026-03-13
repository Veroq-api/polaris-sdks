import type { AgentFeedOptions, Brief, BriefOptions, ClustersOptions, ClustersResponse, ComparisonResponse, DataOptions, DataResponse, EntitiesOptions, EntitiesResponse, EntityBriefsOptions, FeedOptions, FeedResponse, PolarisClientOptions, SearchOptions, SearchResponse, SimilarOptions, StreamOptions, TrendingOptions } from "./types.js";
export declare class PolarisClient {
    private apiKey;
    private baseUrl;
    constructor(options?: PolarisClientOptions);
    private request;
    private throwError;
    feed(options?: FeedOptions): Promise<FeedResponse>;
    brief(id: string, options?: BriefOptions): Promise<Brief>;
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    generate(topic: string, category?: string): Promise<Brief>;
    entities(options?: EntitiesOptions): Promise<EntitiesResponse>;
    entityBriefs(name: string, options?: EntityBriefsOptions): Promise<Brief[]>;
    trendingEntities(limit?: number): Promise<EntitiesResponse>;
    similar(id: string, options?: SimilarOptions): Promise<Brief[]>;
    clusters(options?: ClustersOptions): Promise<ClustersResponse>;
    data(options?: DataOptions): Promise<DataResponse>;
    agentFeed(options?: AgentFeedOptions): Promise<FeedResponse>;
    compareSources(briefId: string): Promise<ComparisonResponse>;
    trending(options?: TrendingOptions): Promise<Brief[]>;
    stream(options?: StreamOptions): {
        start: (onBrief: (brief: Brief) => void, onError?: (error: Error) => void) => void;
        stop: () => void;
    };
}
//# sourceMappingURL=client.d.ts.map