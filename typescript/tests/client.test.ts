import { describe, it, expect, vi, beforeEach } from "vitest";
import { PolarisClient } from "../src/client.js";
import { AuthenticationError, NotFoundError, RateLimitError, APIError } from "../src/errors.js";

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(headers),
  });
}

describe("PolarisClient", () => {
  let client: PolarisClient;

  beforeEach(() => {
    client = new PolarisClient({ apiKey: "test-key", baseUrl: "https://api.test.com" });
  });

  it("feed() returns parsed response", async () => {
    const body = {
      briefs: [{ id: "1", headline: "Test Brief", category: "tech" }],
      total: 1,
      page: 1,
      per_page: 20,
      generated_at: "2026-01-01T00:00:00Z",
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.feed({ category: "tech", limit: 5 });

    expect(result.briefs).toHaveLength(1);
    expect(result.briefs[0].headline).toBe("Test Brief");
    expect(result.total).toBe(1);

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain("/api/v1/feed");
    expect(callUrl).toContain("category=tech");
    expect(callUrl).toContain("per_page=5");
  });

  it("brief() returns single brief", async () => {
    const body = {
      brief: { id: "abc", headline: "Deep Dive", confidence: 0.95 },
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.brief("abc", { includeFullText: true });

    expect(result.headline).toBe("Deep Dive");
    expect(result.confidence).toBe(0.95);

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain("/api/v1/brief/abc");
    expect(callUrl).toContain("include_full_text=true");
  });

  it("search() returns search response", async () => {
    const body = {
      briefs: [{ id: "s1", headline: "Search Result" }],
      total: 42,
      took_ms: 15,
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.search("AI regulation", { category: "policy", perPage: 10 });

    expect(result.total).toBe(42);
    expect(result.tookMs).toBe(15);
    expect(result.briefs[0].headline).toBe("Search Result");

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain("q=AI+regulation");
    expect(callUrl).toContain("category=policy");
  });

  it("generate() sends POST and returns brief", async () => {
    const body = {
      brief: { id: "gen1", headline: "Generated Brief", category: "tech" },
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.generate("quantum computing", "tech");

    expect(result.headline).toBe("Generated Brief");

    const [callUrl, callInit] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callUrl).toContain("/api/v1/generate/brief");
    expect(callInit.method).toBe("POST");
    expect(JSON.parse(callInit.body)).toEqual({ topic: "quantum computing", category: "tech" });
  });

  it("entities() returns entities list", async () => {
    const body = {
      entities: [{ name: "OpenAI", type: "organization", mention_count: 150 }],
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.entities({ q: "open", limit: 5 });

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].name).toBe("OpenAI");
  });

  it("clusters() returns clusters", async () => {
    const body = {
      clusters: [{ cluster_id: "c1", topic: "AI", brief_count: 5 }],
      period: "24h",
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.clusters({ period: "24h" });

    expect(result.clusters).toHaveLength(1);
    expect(result.period).toBe("24h");
  });

  it("trending() returns briefs list", async () => {
    const body = {
      briefs: [{ id: "t1", headline: "Trending Story" }],
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.trending({ period: "24h", limit: 5 });

    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe("Trending Story");
  });

  it("extract() returns parsed results", async () => {
    const body = {
      results: [
        { url: "https://example.com/article", title: "Test", text: "Content here", word_count: 2, success: true, domain: "example.com" },
      ],
      credits_used: 1,
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.extract(["https://example.com/article"]);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(true);
    expect(result.results[0].wordCount).toBe(2);
    expect(result.creditsUsed).toBe(1);

    const [callUrl, callInit] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callUrl).toContain("/api/v1/extract");
    expect(callInit.method).toBe("POST");
    expect(JSON.parse(callInit.body).urls).toEqual(["https://example.com/article"]);
  });

  it("feed() passes includeSources param", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { briefs: [], total: 0 }));

    await client.feed({ includeSources: "reuters.com" });

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain("include_sources=reuters.com");
  });

  it("search() with depth=deep returns depthMetadata", async () => {
    const body = {
      briefs: [{ id: "1", headline: "Deep" }],
      total: 1,
      took_ms: 500,
      depth_metadata: { depth: "deep", search_ms: 45, cross_ref_ms: 120, verification_ms: 350, total_ms: 515 },
    };
    vi.stubGlobal("fetch", mockFetch(200, body));

    const result = await client.search("AI", { depth: "deep" });

    expect(result.depthMetadata).toBeDefined();
    expect(result.depthMetadata!.depth).toBe("deep");
    expect(result.depthMetadata!.totalMs).toBe(515);

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain("depth=deep");
  });

  it("agentFeed() passes excludeSources param", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { briefs: [], total: 0 }));

    await client.agentFeed({ excludeSources: "foxnews.com" });

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain("exclude_sources=foxnews.com");
  });

  it("throws AuthenticationError on 401", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { error: "Unauthorized" }));

    await expect(client.feed()).rejects.toThrow(AuthenticationError);
    try {
      await client.feed();
    } catch (e) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect((e as AuthenticationError).statusCode).toBe(401);
    }
  });

  it("throws NotFoundError on 404", async () => {
    vi.stubGlobal("fetch", mockFetch(404, { error: "Not found" }));

    await expect(client.brief("nonexistent")).rejects.toThrow(NotFoundError);
  });

  it("throws RateLimitError on 429 with retry-after", async () => {
    vi.stubGlobal("fetch", mockFetch(429, { error: "Too many requests" }, { "Retry-After": "30" }));

    try {
      await client.feed();
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).statusCode).toBe(429);
      expect((e as RateLimitError).retryAfter).toBe(30);
    }
  });

  it("throws APIError on other errors", async () => {
    vi.stubGlobal("fetch", mockFetch(500, { error: "Internal server error" }));

    await expect(client.feed()).rejects.toThrow(APIError);
  });

  it("sets Authorization header when apiKey provided", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { briefs: [], total: 0 }));

    await client.feed();

    const callInit = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(callInit.headers["Authorization"]).toBe("Bearer test-key");
  });

  it("omits Authorization header when no apiKey", async () => {
    const noAuthClient = new PolarisClient({ baseUrl: "https://api.test.com" });
    vi.stubGlobal("fetch", mockFetch(200, { briefs: [], total: 0 }));

    await noAuthClient.feed();

    const callInit = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(callInit.headers["Authorization"]).toBeUndefined();
  });
});
