import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const polarisSearch = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Search verified intelligence briefs with confidence scores and bias ratings across 18 verticals.",
    parameters: z.object({
      query: z.string().describe("The search query"),
      category: z
        .string()
        .optional()
        .describe("Category slug (e.g. ai_ml, markets, crypto)"),
      depth: z
        .enum(["fast", "standard", "deep"])
        .optional()
        .describe("Speed tier: fast skips extras, deep adds entity cross-refs"),
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 10)"),
    }),
    execute: async ({ query, category, depth, limit }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.search(query, { category, depth, perPage: limit });
    },
  });
