import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqFull = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get a comprehensive full profile for a ticker symbol — combines price, fundamentals, technicals, sentiment, news, and analyst data in a single call.",
    parameters: z.object({
      ticker: z
        .string()
        .describe("Ticker symbol to look up (e.g. AAPL, BTC, ETH)"),
    }),
    execute: async ({ ticker }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(ticker.toUpperCase())}/full`;
      return veroqGet(options, path);
    },
  });
