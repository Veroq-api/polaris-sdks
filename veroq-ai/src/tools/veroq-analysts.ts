import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqAnalysts = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get Wall Street analyst ratings and price targets for a ticker symbol — includes consensus rating, target prices, and recent upgrades/downgrades.",
    parameters: z.object({
      ticker: z
        .string()
        .describe("Ticker symbol to look up analyst ratings for (e.g. MSFT)"),
    }),
    execute: async ({ ticker }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(ticker.toUpperCase())}/analysts`;
      return veroqGet(options, path);
    },
  });
