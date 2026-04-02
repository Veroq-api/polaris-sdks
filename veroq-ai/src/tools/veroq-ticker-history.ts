import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqTickerHistory = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get daily sentiment timeseries for a ticker symbol — tracks how news sentiment has changed over time.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol (e.g. AAPL)"),
      days: z
        .number()
        .optional()
        .describe("Number of days of history to return (default 30)"),
    }),
    execute: async ({ symbol, days }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.tickerHistory(symbol, { days });
    },
  });
