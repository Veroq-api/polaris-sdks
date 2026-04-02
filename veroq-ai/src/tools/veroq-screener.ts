import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqScreener = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Screen stocks using natural language. Describe what you're looking for (e.g. 'oversold tech stocks with upcoming earnings') and get matching tickers with scores.",
    parameters: z.object({
      query: z
        .string()
        .describe("Natural language screening query"),
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 20)"),
    }),
    execute: async ({ query, limit }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.screenerNatural(query, { limit });
    },
  });
