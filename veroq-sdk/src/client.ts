import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
  APIError,
  AuthenticationError,
  NotFoundError,
  VeroqError,
  RateLimitError,
} from "./errors.js";

function readCredentials(): string | undefined {
  // Check VEROQ_API_KEY first, then fall back to POLARIS_API_KEY
  const envKey = process.env.VEROQ_API_KEY || process.env.POLARIS_API_KEY;
  if (envKey) return envKey;
  // Check ~/.veroq/credentials first, then fall back to ~/.polaris/credentials
  try {
    const key = readFileSync(join(homedir(), ".veroq", "credentials"), "utf-8").trim();
    if (key) return key;
  } catch { /* ignore */ }
  try {
    const key = readFileSync(join(homedir(), ".polaris", "credentials"), "utf-8").trim();
    return key || undefined;
  } catch {
    return undefined;
  }
}
import type {
  AgentFeedOptions,
  Brief,
  BriefOptions,
  CandleOptions,
  CandleResponse,
  ClustersOptions,
  ClustersResponse,
  CommoditiesResponse,
  CommodityCandleOptions,
  CommodityResponse,
  ComparisonResponse,
  CryptoChartOptions,
  CryptoChartResponse,
  CryptoResponse,
  CryptoTokenResponse,
  CryptoTopOptions,
  CryptoTopResponse,
  DataOptions,
  DataResponse,
  DefiProtocolResponse,
  DefiResponse,
  DepthMetadata,
  EarningsResponse,
  EconomyIndicatorOptions,
  EconomyIndicatorResponse,
  EconomyResponse,
  Entity,
  EntitiesOptions,
  EntitiesResponse,
  EntityBriefsOptions,
  EventsCalendarOptions,
  EventsCalendarResponse,
  ExtractResponse,
  ExtractResult,
  FeedOptions,
  FeedResponse,
  FinancialsResponse,
  ForexCandleOptions,
  ForexRateResponse,
  ForexResponse,
  IndicatorOptions,
  IndicatorResponse,
  MarketEarningsOptions,
  MarketEarningsResponse,
  MarketMoversResponse,
  MarketSummaryResponse,
  VeroqClientOptions,
  PortfolioFeedOptions,
  PortfolioFeedResponse,
  PortfolioHolding,
  Provenance,
  ResearchOptions,
  ResearchResponse,
  SearchOptions,
  SearchResponse,
  SectorTickersOptions,
  SectorTickersResponse,
  SectorsOptions,
  SectorsResponse,
  SimilarOptions,
  Source,
  SourceAnalysis,
  StreamOptions,
  TechnicalsOptions,
  TechnicalsResponse,
  TickerCorrelationsOptions,
  TickerCorrelationsResponse,
  TickerHistoryOptions,
  TickerHistoryResponse,
  TickerResolveResponse,
  TickerResponse,
  TickerScoreResponse,
  TickerSignalsOptions,
  TickerSignalsResponse,
  TrendingOptions,
  VerifyOptions,
  VerifyResponse,
  YieldCurveResponse,
  ScreenerFilters,
  ScreenerResponse,
  ScreenerNaturalOptions,
  ScreenerPresetsResponse,
  AlertOptions,
  AlertsResponse,
  TriggeredAlertsOptions,
  BacktestStrategy,
  BacktestOptions,
  BacktestResponse,
  CorrelationOptions,
  CorrelationResponse,
  NewsImpactResponse,
  CompetitorsResponse,
  TranscriptsOptions,
  TranscriptsResponse,
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

/* -- Parsers: snake_case API -> camelCase SDK -- */

function parseSource(raw: Record<string, unknown>): Source {
  return {
    name: (raw.name || "") as string,
    url: (raw.url || "") as string,
    trustLevel: raw.trust_level as string | undefined,
    verified: raw.verified as boolean | undefined,
  };
}

function parseEntity(raw: Record<string, unknown>): Entity {
  return {
    name: (raw.name || "") as string,
    type: raw.type as string | undefined,
    sentiment: raw.sentiment as string | undefined,
    mentionCount: (raw.mention_count ?? raw.mentions_24h) as number | undefined,
    ticker: raw.ticker as string | undefined,
    role: raw.role as string | undefined,
  };
}

function parseProvenance(raw: Record<string, unknown>): Provenance {
  return {
    reviewStatus: raw.review_status as string | undefined,
    aiContributionPct: raw.ai_contribution_pct as number | undefined,
    humanContributionPct: raw.human_contribution_pct as number | undefined,
    confidenceScore: raw.confidence_score as number | undefined,
    biasScore: raw.bias_score as number | undefined,
    agentsInvolved: raw.agents_involved as string[] | undefined,
  };
}

function parseBrief(raw: Record<string, unknown>): Brief {
  const prov = raw.provenance
    ? parseProvenance(raw.provenance as Record<string, unknown>)
    : undefined;

  return {
    id: raw.id as string | undefined,
    headline: (raw.headline || "") as string,
    summary: raw.summary as string | undefined,
    body: raw.body as string | undefined,
    confidence: (raw.confidence as number | undefined) ?? prov?.confidenceScore,
    biasScore: (raw.bias_score as number | undefined) ?? prov?.biasScore,
    sentiment: raw.sentiment as string | undefined,
    counterArgument: raw.counter_argument as string | undefined,
    category: raw.category as string | undefined,
    tags: raw.tags as string[] | undefined,
    sources: raw.sources
      ? (raw.sources as Record<string, unknown>[]).map(parseSource)
      : undefined,
    entitiesEnriched: raw.entities_enriched
      ? (raw.entities_enriched as Record<string, unknown>[]).map(parseEntity)
      : undefined,
    structuredData: raw.structured_data as Record<string, unknown> | undefined,
    publishedAt: raw.published_at as string | undefined,
    reviewStatus: raw.review_status as string | undefined,
    provenance: prov,
    briefType: raw.brief_type as string | undefined,
    trending: raw.trending as boolean | undefined,
    topics: raw.topics as string[] | undefined,
    entities: raw.entities as string[] | undefined,
    impactScore: raw.impact_score as number | undefined,
    readTimeSeconds: raw.read_time_seconds as number | undefined,
    sourceCount: raw.source_count as number | undefined,
    correctionsCount: raw.corrections_count as number | undefined,
    biasAnalysis: raw.bias_analysis as Record<string, unknown> | undefined,
    fullSources: raw.full_sources as Record<string, unknown>[] | undefined,
  };
}

function parseSourceAnalysis(raw: Record<string, unknown>): SourceAnalysis {
  return {
    outlet: raw.outlet as string | undefined,
    headline: raw.headline as string | undefined,
    framing: raw.framing as string | undefined,
    politicalLean: raw.political_lean as string | undefined,
    loadedLanguage: raw.loaded_language as string[] | undefined,
    emphasis: raw.emphasis as string[] | undefined,
    omissions: raw.omissions as string[] | undefined,
    sentiment: raw.sentiment as Record<string, string> | undefined,
    rawExcerpt: raw.raw_excerpt as string | undefined,
  };
}

export class VeroqClient {
  private apiKey: string | undefined;
  private baseUrl: string;
  private enterpriseConfig: Record<string, unknown> = {};
  private auditLog: Record<string, unknown>[] = [];

  constructor(options: VeroqClientOptions = {}) {
    this.apiKey = options.apiKey ?? readCredentials();
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

  // -- Hero Methods: Ask & Verify --

  /** Ask any financial question. Routes to 40+ endpoints automatically. */
  async ask(question: string, options: { context?: string } = {}): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('POST', '/api/v1/ask', undefined, { question, ...options });
  }

  /** Stream financial intelligence via SSE. Yields events as they arrive. */
  async *askStream(question: string): AsyncGenerator<{ type: string; data: any }> {
    const resp = await fetch(`${this.baseUrl}/api/v1/ask/stream?question=${encodeURIComponent(question)}`, {
      headers: {
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        'Accept': 'text/event-stream',
      },
    });
    if (!resp.ok) throw new Error(`Ask stream failed: ${resp.status}`);
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('event: ')) { currentEvent = line.slice(7); continue; }
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            yield { type: currentEvent || data.type || '', data };
            currentEvent = '';
          } catch { /* skip malformed JSON */ }
        }
      }
    } finally { reader.releaseLock(); }
  }

  /** Fact-check a claim against the intelligence corpus. Costs 3 API credits. */
  async verify(claim: string, options: VerifyOptions = {}): Promise<VerifyResponse> {
    const body: Record<string, unknown> = { claim };
    if (options.context !== undefined) body.context = options.context;
    const data = await this.request<Record<string, unknown>>("POST", "/api/v1/verify", undefined, body);
    const mapBrief = (b: Record<string, unknown>) => ({
      id: b.id as string,
      headline: b.headline as string,
      confidence: b.confidence as number,
      relevance: (b.relevance ?? null) as number | null,
    });
    return {
      claim: data.claim as string,
      verdict: data.verdict as VerifyResponse["verdict"],
      confidence: (data.confidence || 0) as number,
      summary: (data.summary || "") as string,
      supportingBriefs: ((data.supporting_briefs || []) as Record<string, unknown>[]).map(mapBrief),
      contradictingBriefs: ((data.contradicting_briefs || []) as Record<string, unknown>[]).map(mapBrief),
      nuances: (data.nuances ?? null) as string | null,
      sourcesAnalyzed: (data.sources_analyzed || 0) as number,
      briefsMatched: (data.briefs_matched || 0) as number,
      creditsUsed: (data.credits_used || 0) as number,
      cached: (data.cached || false) as boolean,
      processingTimeMs: (data.processing_time_ms || 0) as number,
      modelUsed: (data.model_used ?? null) as string | null,
    };
  }

  // -- Feed & Search --

  /**
   * Verify any LLM output — extracts claims and fact-checks each one.
   * The trust layer for all AI output.
   */
  // -- Agent Memory --

  /** Store a memory entry for a persistent agent */
  async memoryStore(agentId: string, key: string, value: any, options: {
    category?: string; queryText?: string; tickers?: string[]; confidence?: number;
  } = {}): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/memory/store", undefined, {
      agent_id: agentId, key, value,
      category: options.category, query_text: options.queryText,
      tickers: options.tickers, confidence: options.confidence,
    });
  }

  /** Recall relevant memories for a query */
  async memoryRecall(agentId: string, options: {
    q?: string; ticker?: string; category?: string; limit?: number;
  } = {}): Promise<Record<string, any>> {
    return this.request("GET", "/api/v1/memory/recall", {
      agent_id: agentId, ...options,
    } as any);
  }

  /** List all memories for an agent */
  async memoryList(agentId: string, options: { limit?: number; offset?: number } = {}): Promise<Record<string, any>> {
    return this.request("GET", "/api/v1/memory/list", {
      agent_id: agentId, ...options,
    } as any);
  }

  /** Consolidate old memories into a compact snapshot ("Dream Mode") */
  async memoryConsolidate(agentId: string, options: { maxAgeHours?: number; keepRecent?: number } = {}): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/memory/consolidate", undefined, {
      agent_id: agentId,
      max_age_hours: options.maxAgeHours ?? 24,
      keep_recent: options.keepRecent ?? 10,
    });
  }

  /** Watch tickers for real-time verification changes via SSE */
  watch(options: { tickers?: string[]; agentId?: string; interval?: number } = {}): {
    start: (onEvent: (event: { type: string; data: any }) => void, onError?: (error: Error) => void) => void;
    stop: () => void;
  } {
    let controller: AbortController | null = null;
    return {
      start: (onEvent, onError) => {
        controller = new AbortController();
        const params = new URLSearchParams();
        if (options.tickers?.length) params.set('tickers', options.tickers.join(','));
        if (options.agentId) params.set('agent_id', options.agentId);
        if (options.interval) params.set('interval', String(options.interval));
        const url = `${this.baseUrl}/api/v1/watch?${params}`;
        fetch(url, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          signal: controller.signal,
        }).then(async (res) => {
          const reader = res.body?.getReader();
          if (!reader) return;
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) currentEvent = line.slice(7);
              else if (line.startsWith('data: ') && currentEvent) {
                try { onEvent({ type: currentEvent, data: JSON.parse(line.slice(6)) }); } catch {}
                currentEvent = '';
              }
            }
          }
        }).catch((err) => { if (err.name !== 'AbortError') onError?.(err); });
      },
      stop: () => { controller?.abort(); },
    };
  }

  async verifyOutput(text: string, options: { source?: string; maxClaims?: number } = {}): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/verify/output", undefined, {
      text,
      source: options.source,
      max_claims: options.maxClaims,
    });
  }

  async feed(options: FeedOptions = {}): Promise<FeedResponse> {
    const params: Record<string, unknown> = { ...options };
    if (params.limit !== undefined) {
      params.perPage = params.limit;
      delete params.limit;
    }
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/feed", params);
    const meta = (data.meta || {}) as Record<string, unknown>;
    return {
      briefs: ((data.briefs || []) as Record<string, unknown>[]).map(parseBrief),
      total: (meta.total || data.total || 0) as number,
      page: (meta.page || data.page || 1) as number,
      perPage: (meta.per_page || data.per_page || 20) as number,
      generatedAt: data.generated_at as string | undefined,
      agentVersion: data.agent_version as string | undefined,
      sourcesScanned24h: (meta.sources_scanned_24h || data.sources_scanned_24h) as number | undefined,
    };
  }

  async brief(id: string, options: BriefOptions = {}): Promise<Brief> {
    const params: Record<string, unknown> = {};
    if (options.includeFullText !== undefined) {
      params.includeFullText = options.includeFullText;
    }
    const data = await this.request<Record<string, unknown>>("GET", `/api/v1/brief/${id}`, params);
    return parseBrief((data.brief || data) as Record<string, unknown>);
  }

  async timeline(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", `/api/v1/brief/${id}/timeline`);
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const params: Record<string, unknown> = { q: query, ...options };
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/search", params);
    const dm = data.depth_metadata as Record<string, unknown> | undefined;
    return {
      briefs: ((data.briefs || []) as Record<string, unknown>[]).map(parseBrief),
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

  /** Get search autocomplete suggestions. */
  async searchSuggest(q: string): Promise<any> {
    const params: Record<string, unknown> = { q };
    return this.request<any>("GET", "/api/v1/search/suggest", params);
  }

  async generate(topic: string, category?: string): Promise<Brief> {
    const body: Record<string, string> = { topic };
    if (category) body.category = category;
    const data = await this.request<Record<string, unknown>>("POST", "/api/v1/generate/brief", undefined, body);
    return parseBrief((data.brief || data) as Record<string, unknown>);
  }

  async entities(options: EntitiesOptions = {}): Promise<EntitiesResponse> {
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/entities", options as Record<string, unknown>);
    return {
      entities: ((data.entities || []) as Record<string, unknown>[]).map(parseEntity),
    };
  }

  async entityBriefs(name: string, options: EntityBriefsOptions = {}): Promise<Brief[]> {
    const data = await this.request<Record<string, unknown>>("GET", `/api/v1/entities/${encodeURIComponent(name)}/briefs`, options as Record<string, unknown>);
    return ((data.briefs || []) as Record<string, unknown>[]).map(parseBrief);
  }

  async trendingEntities(limit?: number): Promise<EntitiesResponse> {
    const params: Record<string, unknown> = {};
    if (limit !== undefined) params.limit = limit;
    const data = await this.request<Record<string, unknown>>("GET", "/api/v1/entities/trending", params);
    return {
      entities: ((data.entities || []) as Record<string, unknown>[]).map(parseEntity),
    };
  }

  async similar(id: string, options: SimilarOptions = {}): Promise<Brief[]> {
    const data = await this.request<Record<string, unknown>>("GET", `/api/v1/similar/${id}`, options as Record<string, unknown>);
    return ((data.briefs || []) as Record<string, unknown>[]).map(parseBrief);
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
      briefs: ((data.briefs || []) as Record<string, unknown>[]).map(parseBrief),
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
    const rawBrief = data.polaris_brief as Record<string, unknown> | undefined;
    const rawAnalyses = data.source_analyses as Record<string, unknown>[] | undefined;
    return {
      topic: data.topic as string | undefined,
      shareId: data.share_id as string | undefined,
      polarisBrief: rawBrief ? parseBrief(rawBrief) : undefined,
      sourceAnalyses: rawAnalyses ? rawAnalyses.map(parseSourceAnalysis) : undefined,
      polarisAnalysis: data.polaris_analysis as Record<string, unknown> | undefined,
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
    return ((data.briefs || []) as Record<string, unknown>[]).map(parseBrief);
  }

  async forecast(topic: string, options: { depth?: string; period?: string; timeframe?: string } = {}): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {
      topic,
      depth: options.depth ?? "standard",
      period: options.period ?? "30d",
      timeframe: options.timeframe ?? "30d",
    };
    return this.request<Record<string, unknown>>("POST", "/api/v1/forecast", undefined, body);
  }

  async diff(id: string, since?: number): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {};
    if (since !== undefined) params.since = since;
    return this.request<Record<string, unknown>>("GET", `/api/v1/brief/${id}/diff`, params);
  }

  async contradictions(options: { severity?: string; category?: string; limit?: number } = {}): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = { limit: options.limit ?? 20 };
    if (options.severity !== undefined) params.severity = options.severity;
    if (options.category !== undefined) params.category = options.category;
    return this.request<Record<string, unknown>>("GET", "/api/v1/contradictions", params);
  }

  async events(options: { type?: string; subject?: string; category?: string; period?: string; limit?: number } = {}): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {
      period: options.period ?? "30d",
      limit: options.limit ?? 30,
    };
    if (options.type !== undefined) params.type = options.type;
    if (options.subject !== undefined) params.subject = options.subject;
    if (options.category !== undefined) params.category = options.category;
    return this.request<Record<string, unknown>>("GET", "/api/v1/events", params);
  }

  async subscribeBrief(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("POST", `/api/v1/brief/${id}/subscribe`, undefined, {});
  }

  async unsubscribeBrief(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("DELETE", `/api/v1/brief/${id}/subscribe`);
  }

  async watchlists(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", "/api/v1/watchlists");
  }

  async createWatchlist(name: string, options: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { name, ...options };
    return this.request<Record<string, unknown>>("POST", "/api/v1/watchlists", undefined, body);
  }

  async addWatchItem(watchlistId: string, type: string, options: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { type, ...options };
    return this.request<Record<string, unknown>>("POST", `/api/v1/watchlists/${watchlistId}/items`, undefined, body);
  }

  /** Get matches for a watchlist. */
  async watchlistMatches(watchlistId: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/watchlists/${encodeURIComponent(watchlistId)}/matches`);
  }

  async createMonitor(options: { type: string; callback_url: string; [key: string]: unknown }): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("POST", "/api/v1/monitor", undefined, options);
  }

  async monitors(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", "/api/v1/monitors");
  }

  async createSession(name?: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { name: name ?? "default" };
    if (metadata !== undefined) body.metadata = metadata;
    return this.request<Record<string, unknown>>("POST", "/api/v1/agent/session", undefined, body);
  }

  async sessions(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", "/api/v1/agent/sessions");
  }

  async markRead(sessionName: string, briefIds: string[]): Promise<Record<string, unknown>> {
    const body = { brief_ids: briefIds };
    return this.request<Record<string, unknown>>("POST", `/api/v1/agent/session/${sessionName}/read`, undefined, body);
  }

  async agentFeedFiltered(options: { session?: string; limit?: number; category?: string } = {}): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = {
      session: options.session ?? "default",
      limit: options.limit ?? 20,
    };
    if (options.category !== undefined) params.category = options.category;
    return this.request<Record<string, unknown>>("GET", "/api/v1/agent/feed", params);
  }

  async webSearch(q: string, options?: { limit?: number; freshness?: string; region?: string; verify?: boolean }): Promise<Record<string, unknown>> {
    const params: Record<string, unknown> = { q, ...options };
    return this.request<Record<string, unknown>>("GET", "/api/v1/web-search", params);
  }

  async crawl(url: string, options?: { depth?: number; max_pages?: number; include_links?: boolean }): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { url, ...options };
    return this.request<Record<string, unknown>>("POST", "/api/v1/crawl", undefined, body);
  }

  // -- Trading --

  async tickerResolve(symbols: string[]): Promise<TickerResolveResponse> {
    const params: Record<string, unknown> = { q: symbols.join(",") };
    return this.request<TickerResolveResponse>("GET", "/api/v1/ticker/resolve", params);
  }

  async ticker(symbol: string): Promise<TickerResponse> {
    return this.request<TickerResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}`);
  }

  async tickerHistory(symbol: string, options: TickerHistoryOptions = {}): Promise<TickerHistoryResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<TickerHistoryResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/history`, params);
  }

  async tickerSignals(symbol: string, options: TickerSignalsOptions = {}): Promise<TickerSignalsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<TickerSignalsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/signals`, params);
  }

  async tickerCorrelations(symbol: string, options: TickerCorrelationsOptions = {}): Promise<TickerCorrelationsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<TickerCorrelationsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/correlations`, params);
  }

  async tickerScore(symbol: string): Promise<TickerScoreResponse> {
    return this.request<TickerScoreResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/score`);
  }

  /** Get live prices for one or more ticker symbols. */
  async tickerPrices(symbols: string[], paid?: boolean): Promise<any> {
    const params: Record<string, unknown> = { symbols: symbols.join(",") };
    if (paid !== undefined) params.paid = paid;
    return this.request<any>("GET", "/api/v1/ticker/prices", params);
  }

  /** Get sentiment analysis for a ticker symbol. */
  async tickerSentiment(symbol: string, period?: string): Promise<any> {
    const params: Record<string, unknown> = {};
    if (period !== undefined) params.period = period;
    return this.request<any>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/sentiment`, params);
  }

  /** Get full analysis for a ticker symbol. */
  async tickerAnalysis(symbol: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/analysis`);
  }

  /** Get recent news for a ticker symbol. */
  async tickerNews(symbol: string, limit?: number): Promise<any> {
    const params: Record<string, unknown> = {};
    if (limit !== undefined) params.limit = limit;
    return this.request<any>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/news`, params);
  }

  async sectors(options: SectorsOptions = {}): Promise<SectorsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<SectorsResponse>("GET", "/api/v1/sectors", params);
  }

  async sectorTickers(sector: string, options: SectorTickersOptions = {}): Promise<SectorTickersResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<SectorTickersResponse>("GET", `/api/v1/sectors/${encodeURIComponent(sector)}/tickers`, params);
  }

  async eventsCalendar(options: EventsCalendarOptions = {}): Promise<EventsCalendarResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<EventsCalendarResponse>("GET", "/api/v1/events/calendar", params);
  }

  /** Get IPO calendar, optionally filtered by status. */
  async ipoCalendar(status?: string): Promise<any> {
    const params: Record<string, unknown> = {};
    if (status !== undefined) params.status = status;
    return this.request<any>("GET", "/api/v1/ipo/calendar", params);
  }

  async portfolioFeed(holdings: PortfolioHolding[], options: PortfolioFeedOptions = {}): Promise<PortfolioFeedResponse> {
    const body: Record<string, unknown> = { holdings, ...options };
    return this.request<PortfolioFeedResponse>("POST", "/api/v1/portfolio/feed", undefined, body);
  }

  // -- AV Parity --

  async candles(symbol: string, options: CandleOptions = {}): Promise<CandleResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<CandleResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/candles`, params);
  }

  async financials(symbol: string): Promise<FinancialsResponse> {
    return this.request<FinancialsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/financials`);
  }

  async earnings(symbol: string): Promise<EarningsResponse> {
    return this.request<EarningsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/earnings`);
  }

  async indicators(symbol: string, type: string, options: IndicatorOptions = {}): Promise<IndicatorResponse> {
    const params: Record<string, unknown> = { type, ...options };
    return this.request<IndicatorResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/indicators`, params);
  }

  async technicals(symbol: string, options: TechnicalsOptions = {}): Promise<TechnicalsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<TechnicalsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/technicals`, params);
  }

  async marketMovers(): Promise<MarketMoversResponse> {
    return this.request<MarketMoversResponse>("GET", "/api/v1/market/movers");
  }

  async marketSummary(): Promise<MarketSummaryResponse> {
    return this.request<MarketSummaryResponse>("GET", "/api/v1/market/summary");
  }

  async marketEarnings(options: MarketEarningsOptions = {}): Promise<MarketEarningsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<MarketEarningsResponse>("GET", "/api/v1/market/earnings", params);
  }

  async forex(pair?: string): Promise<ForexResponse | ForexRateResponse> {
    if (pair) {
      return this.request<ForexRateResponse>("GET", `/api/v1/forex/${encodeURIComponent(pair)}`);
    }
    return this.request<ForexResponse>("GET", "/api/v1/forex");
  }

  async forexCandles(pair: string, options: ForexCandleOptions = {}): Promise<CandleResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<CandleResponse>("GET", `/api/v1/forex/${encodeURIComponent(pair)}/candles`, params);
  }

  async commodities(symbol?: string): Promise<CommoditiesResponse | CommodityResponse> {
    if (symbol) {
      return this.request<CommodityResponse>("GET", `/api/v1/commodities/${encodeURIComponent(symbol)}`);
    }
    return this.request<CommoditiesResponse>("GET", "/api/v1/commodities");
  }

  async commodityCandles(symbol: string, options: CommodityCandleOptions = {}): Promise<CandleResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<CandleResponse>("GET", `/api/v1/commodities/${encodeURIComponent(symbol)}/candles`, params);
  }

  async economy(indicator?: string, options: EconomyIndicatorOptions = {}): Promise<EconomyResponse | EconomyIndicatorResponse> {
    if (indicator) {
      const params: Record<string, unknown> = { ...options };
      return this.request<EconomyIndicatorResponse>("GET", `/api/v1/economy/${encodeURIComponent(indicator)}`, params);
    }
    return this.request<EconomyResponse>("GET", "/api/v1/economy");
  }

  async economyYields(): Promise<YieldCurveResponse> {
    return this.request<YieldCurveResponse>("GET", "/api/v1/economy/yields");
  }

  /** Get a specific economic indicator by name. */
  async economyIndicator(indicator: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/economy/${encodeURIComponent(indicator)}`);
  }

  // -- Crypto --

  async crypto(symbol?: string): Promise<CryptoResponse | CryptoTokenResponse> {
    if (symbol) {
      return this.request<CryptoTokenResponse>("GET", `/api/v1/crypto/${encodeURIComponent(symbol)}`);
    }
    return this.request<CryptoResponse>("GET", "/api/v1/crypto");
  }

  async cryptoTop(options: CryptoTopOptions = {}): Promise<CryptoTopResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<CryptoTopResponse>("GET", "/api/v1/crypto/top", params);
  }

  async cryptoChart(symbol: string, options: CryptoChartOptions = {}): Promise<CryptoChartResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<CryptoChartResponse>("GET", `/api/v1/crypto/${encodeURIComponent(symbol)}/chart`, params);
  }

  async cryptoDefi(protocol?: string): Promise<DefiResponse | DefiProtocolResponse> {
    if (protocol) {
      return this.request<DefiProtocolResponse>("GET", `/api/v1/crypto/defi/${encodeURIComponent(protocol)}`);
    }
    return this.request<DefiResponse>("GET", "/api/v1/crypto/defi");
  }

  /** Get details for a specific DeFi protocol. */
  async defiProtocol(protocol: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/crypto/defi/${encodeURIComponent(protocol)}`);
  }

  // -- Screener --

  async screener(filters: ScreenerFilters): Promise<ScreenerResponse> {
    return this.request<ScreenerResponse>("POST", "/api/v1/screener", undefined, filters);
  }

  async screenerNatural(query: string, options: ScreenerNaturalOptions = {}): Promise<ScreenerResponse> {
    const body: Record<string, unknown> = { query };
    if (options.limit !== undefined) body.limit = options.limit;
    return this.request<ScreenerResponse>("POST", "/api/v1/screener/natural", undefined, body);
  }

  async screenerPresets(): Promise<ScreenerPresetsResponse> {
    return this.request<ScreenerPresetsResponse>("GET", "/api/v1/screener/presets");
  }

  async screenerPreset(id: string, options: Record<string, unknown> = {}): Promise<ScreenerResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<ScreenerResponse>("GET", `/api/v1/screener/presets/${encodeURIComponent(id)}`, params);
  }

  // -- Alerts --

  async createAlert(ticker: string, alertType: string, threshold: number, options: AlertOptions = {}): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = { ticker, alert_type: alertType, threshold };
    if (options.callbackUrl !== undefined) body.callback_url = options.callbackUrl;
    return this.request<Record<string, unknown>>("POST", "/api/v1/alerts", undefined, body);
  }

  async listAlerts(status?: string): Promise<AlertsResponse> {
    const params: Record<string, unknown> = {};
    if (status !== undefined) params.status = status;
    return this.request<AlertsResponse>("GET", "/api/v1/alerts", params);
  }

  async deleteAlert(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("DELETE", `/api/v1/alerts/${encodeURIComponent(id)}`);
  }

  async triggeredAlerts(options: TriggeredAlertsOptions = {}): Promise<AlertsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<AlertsResponse>("GET", "/api/v1/alerts/triggered", params);
  }

  // -- Backtest --

  async backtest(strategy: BacktestStrategy, options: BacktestOptions = {}): Promise<BacktestResponse> {
    const body: Record<string, unknown> = { strategy, period: options.period ?? "1y", ...options };
    delete body.period;
    body.period = options.period ?? "1y";
    return this.request<BacktestResponse>("POST", "/api/v1/backtest", undefined, body);
  }

  // -- Correlation --

  async correlation(tickers: string[], options: CorrelationOptions = {}): Promise<CorrelationResponse> {
    const body: Record<string, unknown> = { tickers, days: options.days ?? 30 };
    return this.request<CorrelationResponse>("POST", "/api/v1/correlation", undefined, body);
  }

  // -- Ticker Intelligence --

  async newsImpact(symbol: string): Promise<NewsImpactResponse> {
    return this.request<NewsImpactResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/impact`);
  }

  async competitors(symbol: string): Promise<CompetitorsResponse> {
    return this.request<CompetitorsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/competitors`);
  }

  async transcripts(symbol: string, options: TranscriptsOptions = {}): Promise<TranscriptsResponse> {
    const params: Record<string, unknown> = { ...options };
    return this.request<TranscriptsResponse>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/transcripts`, params);
  }

  // -- Social --

  /** Get social media sentiment for a ticker symbol. */
  async socialSentiment(symbol: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/ticker/${encodeURIComponent(symbol)}/social`);
  }

  /** Get trending topics across social media. */
  async socialTrending(): Promise<any> {
    return this.request<any>("GET", "/api/v1/social/trending");
  }

  /** Get social sentiment for a named entity. */
  async socialEntity(entity: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/social/sentiment/${encodeURIComponent(entity)}`);
  }

  // -- Reports --

  /** Generate an AI report for a ticker. */
  async generateReport(ticker: string, tier?: string): Promise<any> {
    const body: Record<string, unknown> = { ticker, tier: tier || "quick" };
    return this.request<any>("POST", "/api/v1/reports/generate", undefined, body);
  }

  /** Get a previously generated report by ID. */
  async getReport(reportId: string): Promise<any> {
    return this.request<any>("GET", `/api/v1/reports/${encodeURIComponent(reportId)}`);
  }

  /** List recent reports. */
  async listReports(limit?: number): Promise<any> {
    const params: Record<string, unknown> = { limit: limit ?? 20 };
    return this.request<any>("GET", "/api/v1/reports", params);
  }

  /** Upload a CLI-generated report. */
  async uploadReport(ticker: string, markdown: string, tier?: string): Promise<any> {
    const body: Record<string, unknown> = { ticker, markdown, tier: tier || "cli" };
    return this.request<any>("POST", "/api/v1/reports/upload", undefined, body);
  }

  // -- Enterprise --

  /** Configure enterprise settings for decision lineage and escalation. */
  configureEnterprise(config: {
    enterpriseId: string;
    escalationThreshold?: number;
    escalationTools?: string[];
    escalationPauses?: boolean;
    sessionId?: string;
    deniedTools?: string[];
    reviewTools?: string[];
    highStakesThreshold?: number;
  }): void {
    this.enterpriseConfig = config;
  }

  /** Get decision lineage for a tool call — audit trail for enterprise governance. */
  getDecisionLineage(toolName: string, input: Record<string, unknown>, output?: Record<string, unknown>): Record<string, unknown> {
    const config = this.enterpriseConfig || {};
    const threshold = (config.escalationThreshold as number) || 80;
    const question = String(input.question || input.claim || '');
    const highStakes = /\bshould\s+(i|we)\s+(buy|sell|trade|invest)\b/i.test(question);
    const tradeScore = (output?.trade_signal as any)?.score || 0;
    const escalated = tradeScore > threshold;

    const entry: Record<string, unknown> = {
      toolName,
      input,
      decision: escalated ? 'escalate' : highStakes ? 'review' : 'allow',
      highStakes,
      escalated,
      enterpriseId: config.enterpriseId,
      timestamp: new Date().toISOString(),
      sessionId: config.sessionId,
    };

    this.auditLog.push(entry);
    return entry;
  }

  /** Retrieve the audit trail, optionally filtered by session ID. */
  getAuditTrail(sessionId?: string): Record<string, unknown>[] {
    return this.auditLog.filter(e => !sessionId || e.sessionId === sessionId);
  }

  // -- Verified Swarm --

  /**
   * Run a multi-agent verified financial analysis workflow.
   *
   * Coordinates agents (planner, researcher, verifier, critic, synthesizer)
   * with automatic verification, safety checks, and decision lineage at every step.
   *
   * @example
   * ```typescript
   * const result = await client.createVerifiedSwarm("Analyze NVDA for a long position", {
   *   roles: ["planner", "researcher", "verifier", "critic", "synthesizer"],
   *   escalationThreshold: 75,
   * });
   * console.log(result.synthesis.summary);
   * console.log(result.verificationSummary);
   * ```
   */
  async createVerifiedSwarm(query: string, options: {
    roles?: string[];
    enableAutoVerification?: boolean;
    escalationThreshold?: number;
    creditBudget?: number;
    enterpriseId?: string;
  } = {}): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/swarm/run", undefined, {
      query,
      roles: options.roles,
      enable_auto_verification: options.enableAutoVerification ?? true,
      escalation_threshold: options.escalationThreshold ?? 80,
      credit_budget: options.creditBudget ?? 50,
      enterprise_id: options.enterpriseId,
    });
  }

  /**
   * Create a domain-specific verified agent runtime and run a query.
   *
   * @example
   * ```typescript
   * const result = await client.createRuntime("Analyze NVDA", { vertical: "finance" });
   * const legalResult = await client.createRuntime("GDPR requirements", { vertical: "legal" });
   * ```
   */
  async createRuntime(query: string, options: {
    vertical?: "finance" | "legal" | "research" | "compliance" | "custom";
    costMode?: "balanced" | "cheap" | "premium";
    creditBudget?: number;
    escalationThreshold?: number;
    enableParallelSteps?: boolean;
    enterpriseId?: string;
  } = {}): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/runtime/run", undefined, {
      query,
      vertical: options.vertical ?? "finance",
      cost_mode: options.costMode,
      credit_budget: options.creditBudget,
      escalation_threshold: options.escalationThreshold,
      enable_parallel_steps: options.enableParallelSteps,
      enterprise_id: options.enterpriseId,
    });
  }

  /**
   * Call an external tool through VeroQ's secure proxy.
   *
   * External MCP servers must be pre-registered. Every call passes through
   * permission engine, rate limiting, escalation, and audit logging.
   */
  async callExternalTool(serverId: string, toolName: string, params: Record<string, any> = {}): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/external/call", undefined, {
      server_id: serverId,
      tool_name: toolName,
      params,
    });
  }

  /**
   * Submit feedback to the self-improvement loop.
   *
   * Use after a swarm run or any verified query to flag inaccuracies,
   * data gaps, or corrections. Feedback drives web search fallback
   * and pipeline enrichment.
   */
  async submitFeedback(feedback: {
    sessionId: string;
    query: string;
    reason: "low_confidence" | "contradicted" | "escalated" | "data_gap" | "verification_failed" | "user_submitted" | "manual";
    detail: string;
    claims?: string[];
    enterpriseId?: string;
  }): Promise<Record<string, any>> {
    return this.request("POST", "/api/v1/feedback", undefined, {
      session_id: feedback.sessionId,
      query: feedback.query,
      reason: feedback.reason,
      detail: feedback.detail,
      claims: feedback.claims,
      enterprise_id: feedback.enterpriseId,
    });
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
                      onBrief(parseBrief(data));
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

/** @deprecated Use VeroqClient instead */
export const PolarisClient = VeroqClient;
