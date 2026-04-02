import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqGenerateReport = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Generate an AI-powered research report for a given ticker symbol. Returns a comprehensive analysis including fundamentals, technicals, and news sentiment.",
    parameters: z.object({
      ticker: z.string().describe("The ticker symbol to generate a report for (e.g. AAPL, BTC)"),
      tier: z
        .string()
        .optional()
        .describe("Report tier — 'quick' for a fast summary or 'deep' for full analysis (default 'quick')"),
    }),
    execute: async ({ ticker, tier }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.generateReport(ticker, tier);
    },
  });
