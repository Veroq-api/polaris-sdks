"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolarisClient = void 0;
const errors_js_1 = require("./errors.js");
const DEFAULT_BASE_URL = "https://api.thepolarisreport.com";
function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function toSnakeParams(params) {
    const result = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            result[toSnakeCase(key)] = String(value);
        }
    }
    return result;
}
class PolarisClient {
    constructor(options = {}) {
        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    }
    async request(method, path, params, body) {
        let url = `${this.baseUrl}${path}`;
        if (params) {
            const snaked = toSnakeParams(params);
            const qs = new URLSearchParams(snaked).toString();
            if (qs)
                url += `?${qs}`;
        }
        const headers = { "Content-Type": "application/json" };
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }
        const init = { method, headers };
        if (body !== undefined) {
            init.body = JSON.stringify(body);
        }
        const resp = await fetch(url, init);
        if (!resp.ok) {
            await this.throwError(resp);
        }
        return resp.json();
    }
    async throwError(resp) {
        let body;
        try {
            body = await resp.json();
        }
        catch {
            body = await resp.text();
        }
        const msg = (body && typeof body === "object" && "error" in body)
            ? String(body.error)
            : String(body);
        if (resp.status === 401) {
            throw new errors_js_1.AuthenticationError(msg, body);
        }
        if (resp.status === 404) {
            throw new errors_js_1.NotFoundError(msg, body);
        }
        if (resp.status === 429) {
            const retryAfter = resp.headers.get("Retry-After") || resp.headers.get("RateLimit-Reset");
            const parsed = retryAfter ? (isNaN(Number(retryAfter)) ? retryAfter : Number(retryAfter)) : null;
            throw new errors_js_1.RateLimitError(msg, body, parsed);
        }
        throw new errors_js_1.APIError(msg, resp.status, body);
    }
    async feed(options = {}) {
        const params = { ...options };
        if (params.limit !== undefined) {
            params.perPage = params.limit;
            delete params.limit;
        }
        const data = await this.request("GET", "/api/v1/feed", params);
        return {
            briefs: (data.briefs || []),
            total: (data.total || 0),
            page: (data.page || 1),
            perPage: (data.per_page || 20),
            generatedAt: data.generated_at,
            agentVersion: data.agent_version,
            sourcesScanned24h: data.sources_scanned_24h,
        };
    }
    async brief(id, options = {}) {
        const params = {};
        if (options.includeFullText !== undefined) {
            params.includeFullText = options.includeFullText;
        }
        const data = await this.request("GET", `/api/v1/brief/${id}`, params);
        return (data.brief || data);
    }
    async search(query, options = {}) {
        const params = { q: query, ...options };
        const data = await this.request("GET", "/api/v1/search", params);
        return {
            briefs: (data.briefs || []),
            total: (data.total || 0),
            facets: data.facets,
            relatedQueries: data.related_queries,
            didYouMean: data.did_you_mean,
            tookMs: data.took_ms,
            meta: data.meta,
        };
    }
    async generate(topic, category) {
        const body = { topic };
        if (category)
            body.category = category;
        const data = await this.request("POST", "/api/v1/generate/brief", undefined, body);
        return (data.brief || data);
    }
    async entities(options = {}) {
        const data = await this.request("GET", "/api/v1/entities", options);
        return { entities: (data.entities || []) };
    }
    async entityBriefs(name, options = {}) {
        const data = await this.request("GET", `/api/v1/entities/${encodeURIComponent(name)}/briefs`, options);
        return (data.briefs || []);
    }
    async trendingEntities(limit) {
        const params = {};
        if (limit !== undefined)
            params.limit = limit;
        const data = await this.request("GET", "/api/v1/entities/trending", params);
        return { entities: (data.entities || []) };
    }
    async similar(id, options = {}) {
        const data = await this.request("GET", `/api/v1/similar/${id}`, options);
        return (data.briefs || []);
    }
    async clusters(options = {}) {
        const data = await this.request("GET", "/api/v1/clusters", options);
        return {
            clusters: (data.clusters || []),
            period: data.period,
        };
    }
    async data(options = {}) {
        const data = await this.request("GET", "/api/v1/data", options);
        return { data: (data.data || []) };
    }
    async agentFeed(options = {}) {
        const data = await this.request("GET", "/api/v1/agent-feed", options);
        return {
            briefs: (data.briefs || []),
            total: (data.total || 0),
            page: (data.page || 1),
            perPage: (data.per_page || 20),
            generatedAt: data.generated_at,
            agentVersion: data.agent_version,
            sourcesScanned24h: data.sources_scanned_24h,
        };
    }
    async compareSources(briefId) {
        const data = await this.request("GET", "/api/v1/compare/sources", { briefId });
        return {
            topic: data.topic,
            shareId: data.share_id,
            polarisBrief: data.polaris_brief,
            sourceAnalyses: data.source_analyses,
            polarisAnalysis: data.polaris_analysis,
            generatedAt: data.generated_at,
        };
    }
    async trending(options = {}) {
        const data = await this.request("GET", "/api/v1/trending", options);
        return (data.briefs || []);
    }
    stream(options = {}) {
        let controller = null;
        return {
            start: (onBrief, onError) => {
                controller = new AbortController();
                const params = {};
                if (options.categories)
                    params.categories = options.categories;
                let url = `${this.baseUrl}/api/v1/stream`;
                const snaked = toSnakeParams(params);
                const qs = new URLSearchParams(snaked).toString();
                if (qs)
                    url += `?${qs}`;
                const headers = { Accept: "text/event-stream" };
                if (this.apiKey)
                    headers["Authorization"] = `Bearer ${this.apiKey}`;
                fetch(url, { headers, signal: controller.signal })
                    .then(async (resp) => {
                    if (!resp.ok) {
                        await this.throwError(resp);
                    }
                    const reader = resp.body?.getReader();
                    if (!reader)
                        return;
                    const decoder = new TextDecoder();
                    let buffer = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";
                        for (const line of lines) {
                            if (line.startsWith("data:")) {
                                const payload = line.slice(5).trim();
                                if (payload && payload !== "[DONE]") {
                                    try {
                                        const data = JSON.parse(payload);
                                        onBrief(data);
                                    }
                                    catch {
                                        // skip malformed JSON
                                    }
                                }
                            }
                        }
                    }
                })
                    .catch((err) => {
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
exports.PolarisClient = PolarisClient;
//# sourceMappingURL=client.js.map