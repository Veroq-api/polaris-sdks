import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqTrending = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get trending entities across the news — the people, companies, and topics generating the most coverage right now.",
    parameters: z.object({
      limit: z
        .number()
        .optional()
        .describe("Max entities to return (default 10)"),
    }),
    execute: async ({ limit }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.trendingEntities(limit);
    },
  });
