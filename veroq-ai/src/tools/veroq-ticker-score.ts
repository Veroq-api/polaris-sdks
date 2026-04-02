import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqTickerScore = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get a composite trading signal score for a ticker, combining sentiment, momentum, volume, and other intelligence signals into a single score.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol to score (e.g. AAPL)"),
    }),
    execute: async ({ symbol }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.tickerScore(symbol);
    },
  });
