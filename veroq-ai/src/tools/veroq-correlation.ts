import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqCorrelation = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get a news-sentiment correlation matrix for multiple tickers. Shows how closely related their coverage patterns and sentiment movements are over a given period.",
    parameters: z.object({
      tickers: z
        .array(z.string())
        .min(2)
        .describe("Array of ticker symbols to correlate (e.g. ['NVDA', 'AMD', 'INTC'])"),
      days: z
        .number()
        .optional()
        .describe("Lookback period in days (default 30)"),
    }),
    execute: async ({ tickers, days }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.correlation(tickers, { days: days ?? 30 });
    },
  });
