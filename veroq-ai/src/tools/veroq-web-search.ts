import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqWebSearch = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Search the web with optional VEROQ trust scoring. Returns web results with relevance and optional verification.",
    parameters: z.object({
      query: z.string().describe("Web search query"),
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 5)"),
      freshness: z
        .string()
        .optional()
        .describe("Freshness filter (e.g. 'day', 'week', 'month')"),
      region: z
        .string()
        .optional()
        .describe("Region code (e.g. 'us', 'eu')"),
      verify: z
        .boolean()
        .optional()
        .describe("Enable VEROQ trust scoring on results"),
    }),
    execute: async ({ query, limit, freshness, region, verify }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.webSearch(query, { limit, freshness, region, verify });
    },
  });
