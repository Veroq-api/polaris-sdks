import {
  APIError,
  AuthenticationError,
  NotFoundError,
  PolarisError,
  RateLimitError,
} from "./errors.js";
import type {
  AgentFeedOptions,
  Brief,
  BriefOptions,
  ClustersOptions,
  ClustersResponse,
  ComparisonResponse,
  DataOptions,
  DataResponse,
  DepthMetadata,
  EntitiesOptions,
  EntitiesResponse,
  EntityBriefsOptions,
  ExtractResponse,
  ExtractResult,
  FeedOptions,
  FeedResponse,
  PolarisClientOptions,
  ResearchOptions,
  ResearchResponse,
  SearchOptions,
  SearchResponse,
  SimilarOptions,
  StreamOptions,
  TrendingOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.thepolarisreport.com";

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toSnakeParams(params: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      result[toSnakeCase(key)] = String(value);
    }
  }
  return result;
}

export class PolarisClient {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor(options: PolarisClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private async request<T>(method: string, path: string, params?: Record<string, unknown>, body?: unknown): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const snaked = toSnakeParams(params);
      const qs = new URLSearchParams(snaked).toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const resp = await fetch(url, init);
    if (!resp.ok) {
      await this.throwError(resp);
    }
    return resp.json() as Promise<T>;
  }

  private async throwError(resp: Response): Promise<never> {
    let body: unknown;
    try {
      body = await resp.json();
    } catch {
      body = await resp.text();
    }

    const msg = (body && typeof body === "object" && "error" in body)
      ? String((body as Record<string, unknown>).error)
      : String(body);

    if (resp.status === 401) {
      throw new AuthenticationError(msg, body);
    }
    if (resp.status === 404) {
      throw new NotFoundError(msg, body);
    }
    if (resp.status === 429) {
      const retryAfter = resp.headers.get("Retry-After") || resp.headers.get("RateLimit-Reset");
      const parsed = retryAfter ? (isNaN(Number(retryAfter)) ? retryAfter : Number(retryAfter)) : null;
      throw new RateLimitError(msg, body, parsed);
    }
    throw new APIError(msg, resp.status, body);
  }

  async feed(options: FeedOptions = {}): Promise<FeedResponse> {
    const params: Record<string, unknown> = { ...options };
    if (params.limit !== undefined) {
      params.perPage = params.limit;
      delete params.limit;
    }
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/feed", params);
    return {
      briefs: (data.briefs || []) as Brief[],
      total: (data.total || 0) as number,
      page: (data.page || 1) as number,
      perPage: (data.per_page || 20) as number,
      generatedAt: data.generated_at as string | undefined,
      agentVersion: data.agent_version as string | undefined,
      sourcesScanned24h: data.sources_scanned_24h as number | undefined,
    };
  }

  async brief(id: string, options: BriefOptions = {}): Promise<Brief> {
    const params: Record<string, unknown> = {};
    if (options.includeFullText !== undefined) {
      params.includeFullText = options.includeFullText;
    }
    const data = await this.request<Record<string, unknown>>("GET", `/api/v1/brief/${id}`, params);
    return (data.brief || data) as Brief;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const params: Record<string, unknown> = { q: query, ...options };
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/search", params);
    const dm = data.depth_metadata as Record<string, unknown> | undefined;
    return {
      briefs: (data.briefs || []) as Brief[],
      total: (data.total || 0) as number,
      facets: data.facets as Record<string, unknown> | null | undefined,
      relatedQueries: data.related_queries as string[] | null | undefined,
      didYouMean: data.did_you_mean as string | undefined,
      tookMs: data.took_ms as number | undefined,
      meta: data.meta as Record<string, unknown> | undefined,
      depthMetadata: dm ? {
        depth: dm.depth as string | undefined,
        searchMs: dm.search_ms as number | undefined,
        crossRefMs: dm.cross_ref_ms as number | undefined,
        verificationMs: dm.verification_ms as number | undefined,
        totalMs: dm.total_ms as number | undefined,
      } : undefined,
    };
  }

  async generate(topic: string, category?: string): Promise<Brief> {
    const body: Record<string, string> = { topic };
    if (category) body.category = category;
    const data = await this.request<Record<string, unknown>>("POST", "/api/v1/generate/brief", undefined, body);
    return (data.brief || data) as Brief;
  }

  async entities(options: EntitiesOptions = {}): Promise<EntitiesResponse> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/entities", options as Record<string, unknown>);
    return { entities: (data.entities || []) as Brief[] } as unknown as EntitiesResponse;
  }

  async entityBriefs(name: string, options: EntityBriefsOptions = {}): Promise<Brief[]> {
    const data = await this.request<Record<string, unknown>>("GET", `/api/v1/entities/${encodeURIComponent(name)}/briefs`, options as Record<string, unknown>);
    return (data.briefs || []) as Brief[];
  }

  async trendingEntities(limit?: number): Promise<EntitiesResponse> {
    const params: Record<string, unknown> = {};
    if (limit !== undefined) params.limit = limit;
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/entities/trending", params);
    return { entities: (data.entities || []) as Brief[] } as unknown as EntitiesResponse;
  }

  async similar(id: string, options: SimilarOptions = {}): Promise<Brief[]> {
    const data = await this.request<Record<string, unknown>>("GET", `/api/v1/similar/${id}`, options as Record<string, unknown>);
    return (data.briefs || []) as Brief[];
  }

  async clusters(options: ClustersOptions = {}): Promise<ClustersResponse> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/clusters", options as Record<string, unknown>);
    return {
      clusters: (data.clusters || []) as ClustersResponse["clusters"],
      period: data.period as string | undefined,
    };
  }

  async data(options: DataOptions = {}): Promise<DataResponse> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/data", options as Record<string, unknown>);
    return { data: (data.data || []) as DataResponse["data"] };
  }

  async agentFeed(options: AgentFeedOptions = {}): Promise<FeedResponse> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/agent-feed", options as Record<string, unknown>);
    return {
      briefs: (data.briefs || []) as Brief[],
      total: (data.total || 0) as number,
      page: (data.page || 1) as number,
      perPage: (data.per_page || 20) as number,
      generatedAt: data.generated_at as string | undefined,
      agentVersion: data.agent_version as string | undefined,
      sourcesScanned24h: data.sources_scanned_24h as number | undefined,
    };
  }

  async compareSources(briefId: string): Promise<ComparisonResponse> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/compare/sources", { briefId });
    return {
      topic: data.topic as string | undefined,
      shareId: data.share_id as string | undefined,
      polarisBrief: data.polaris_brief as Brief | undefined,
      sourceAnalyses: data.source_analyses as ComparisonResponse["sourceAnalyses"],
      polarisAnalysis: data.polaris_analysis as string | undefined,
      generatedAt: data.generated_at as string | undefined,
    };
  }

  async research(query: string, options: ResearchOptions = {}): Promise<ResearchResponse> {
    const body: Record<string, unknown> = { query };
    if (options.maxSources !== undefined) body.max_sources = options.maxSources;
    if (options.depth !== undefined) body.depth = options.depth;
    if (options.category !== undefined) body.category = options.category;
    if (options.includeSources !== undefined) body.include_sources = options.includeSources;
    if (options.excludeSources !== undefined) body.exclude_sources = options.excludeSources;
    if (options.outputSchema !== undefined) body.output_schema = options.outputSchema;
    const data = await this.request<Record<string, unknown>>("POST", "/api/v1/research", undefined, body);
    const sourcesUsed = (data.sources_used as Record<string, unknown>[] || []).map((s) => ({
      briefId: s.brief_id as string | undefined,
      headline: s.headline as string | undefined,
      confidence: s.confidence as number | undefined,
      category: s.category as string | undefined,
    }));
    const entityMap = (data.entity_map as Record<string, unknown>[] || []).map((e) => ({
      name: e.name as string | undefined,
      type: e.type as string | undefined,
      mentions: e.mentions as number | undefined,
      coOccursWith: (e.co_occurs_with as Record<string, unknown>[] || []).map((c) => ({
        entity: c.entity as string | undefined,
        count: c.count as number | undefined,
      })),
    }));
    const meta = data.metadata as Record<string, unknown> | undefined;
    return {
      query: data.query as string,
      report: data.report as Record<string, unknown> | undefined,
      sourcesUsed,
      entityMap,
      subQueries: data.sub_queries as string[] | undefined,
      metadata: meta ? {
        briefsAnalyzed: (meta.briefs_analyzed || 0) as number,
        uniqueSources: (meta.unique_sources || 0) as number,
        processingTimeMs: meta.processing_time_ms as number | undefined,
        modelsUsed: meta.models_used as string[] | undefined,
      } : undefined,
      structuredOutput: data.structured_output,
      structuredOutputError: data.structured_output_error as string | undefined,
    };
  }

  async extract(urls: string[], includeMetadata?: boolean): Promise<ExtractResponse> {
    const body: Record<string, unknown> = { urls };
    if (includeMetadata !== undefined) body.include_metadata = includeMetadata;
    const data = await this.request<Record<string, unknown>>("POST", "/api/v1/extract", undefined, body);
    return {
      results: ((data.results || []) as Record<string, unknown>[]).map((r) => ({
        url: r.url as string,
        title: r.title as string | undefined,
        text: r.text as string | undefined,
        wordCount: r.word_count as number | undefined,
        language: r.language as string | undefined,
        publishedDate: r.published_date as string | undefined,
        domain: r.domain as string | undefined,
        success: r.success as boolean,
        error: r.error as string | undefined,
      })),
      creditsUsed: (data.credits_used || 0) as number,
    };
  }

  async trending(options: TrendingOptions = {}): Promise<Brief[]> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/trending", options as Record<string, unknown>);
    return (data.briefs || []) as Brief[];
  }

  stream(options: StreamOptions = {}): { start: (onBrief: (brief: Brief) => void, onError?: (error: Error) => void) => void; stop: () => void } {
    let controller: AbortController | null = null;

    return {
      start: (onBrief, onError) => {
        controller = new AbortController();
        const params: Record<string, unknown> = {};
        if (options.categories) params.categories = options.categories;

        let url = `${this.baseUrl}/api/v1/stream`;
        const snaked = toSnakeParams(params);
        const qs = new URLSearchParams(snaked).toString();
        if (qs) url += `?${qs}`;

        const headers: Record<string, string> = { Accept: "text/event-stream" };
        if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

        fetch(url, { headers, signal: controller.signal })
          .then(async (resp) => {
            if (!resp.ok) {
              await this.throwError(resp);
            }
            const reader = resp.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data:")) {
                  const payload = line.slice(5).trim();
                  if (payload && payload !== "[DONE]") {
                    try {
                      const data = JSON.parse(payload);
                      onBrief(data as Brief);
                    } catch {
                      // skip malformed JSON
                    }
                  }
                }
              }
            }
          })
          .catch((err: Error) => {
            if (err.name !== "AbortError") {
              onError?.(err);
            }
          });
      },
      stop: () => {
        controller?.abort();
        controller = null;
      },
    };
  }
}
