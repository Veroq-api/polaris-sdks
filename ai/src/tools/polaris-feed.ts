import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const polarisFeed = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get the latest verified intelligence briefs from the Polaris knowledge feed, optionally filtered by category.",
    parameters: z.object({
      category: z
        .string()
        .optional()
        .describe("Category slug to filter by (e.g. technology, markets)"),
      limit: z
        .number()
        .optional()
        .describe("Max briefs to return (default 20)"),
    }),
    execute: async ({ category, limit }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.agentFeed({ category, limit });
    },
  });
