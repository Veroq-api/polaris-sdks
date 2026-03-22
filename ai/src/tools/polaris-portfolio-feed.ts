import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const polarisPortfolioFeed = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Pass portfolio holdings (tickers + weights) and get ranked intelligence briefs relevant to your positions.",
    parameters: z.object({
      holdings: z
        .array(
          z.object({
            ticker: z.string().describe("Ticker symbol (e.g. AAPL)"),
            weight: z.number().describe("Portfolio weight as a decimal (e.g. 0.25 for 25%)"),
          })
        )
        .min(1)
        .describe("Array of portfolio holdings with ticker and weight"),
      days: z
        .number()
        .optional()
        .describe("Lookback window in days (default 7)"),
      limit: z
        .number()
        .optional()
        .describe("Max briefs to return (default 20)"),
    }),
    execute: async ({ holdings, days, limit }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.portfolioFeed(holdings, { days, limit });
    },
  });
