import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqTicker = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Look up a single ticker symbol to get its brief count, sentiment, sector, and last mention timestamp.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol to look up (e.g. AAPL)"),
    }),
    execute: async ({ symbol }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.ticker(symbol);
    },
  });
