import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqTickerNews = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get recent news articles for a specific ticker symbol — returns headlines, sources, timestamps, and sentiment for each article.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol to get news for (e.g. AAPL)"),
      limit: z
        .number()
        .optional()
        .describe("Max articles to return (default 20)"),
    }),
    execute: async ({ symbol, limit }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(symbol.toUpperCase())}/news`;
      return veroqGet(options, path, {
        limit: limit !== undefined ? String(limit) : undefined,
      });
    },
  });
