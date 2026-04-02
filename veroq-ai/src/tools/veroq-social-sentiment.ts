import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqSocialSentiment = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get social media sentiment for a ticker symbol — tracks mentions, sentiment scores, and trending status across social platforms.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol to look up (e.g. AAPL)"),
    }),
    execute: async ({ symbol }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(symbol.toUpperCase())}/social`;
      return veroqGet(options, path);
    },
  });
