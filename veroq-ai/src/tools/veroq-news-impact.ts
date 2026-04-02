import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqNewsImpact = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Analyze the impact of news coverage on a ticker's price and sentiment. Shows how recent news events correlated with price movements.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol to analyze (e.g. NVDA)"),
    }),
    execute: async ({ symbol }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.newsImpact(symbol);
    },
  });
