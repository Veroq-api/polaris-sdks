import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqBacktest = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Backtest a news-driven trading strategy. Define entry/exit filters based on sentiment, RSI, and other signals, then see historical performance including return, drawdown, Sharpe ratio, and win rate.",
    parameters: z.object({
      strategy: z.object({
        entry_filters: z.record(z.unknown()).describe("Entry signal filters (e.g. { rsi_below: 30, sentiment_above: 0.3 })"),
        exit_filters: z.record(z.unknown()).describe("Exit signal filters (e.g. { rsi_above: 50 })"),
        asset_type: z.string().optional().describe("Asset type filter (e.g. equity, crypto)"),
        sector: z.string().optional().describe("Sector filter (e.g. Semiconductors, Technology)"),
      }).describe("Strategy definition with entry/exit filters"),
      period: z
        .string()
        .optional()
        .describe("Backtest period (e.g. 1y, 6mo, 3mo). Default: 1y"),
    }),
    execute: async ({ strategy, period }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.backtest(strategy as any, { period: period ?? "1y" });
    },
  });
