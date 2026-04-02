import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqInsider = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get recent insider trading activity for a ticker symbol — shows buys, sells, and option exercises by company officers and directors.",
    parameters: z.object({
      ticker: z
        .string()
        .describe("Ticker symbol to look up insider trades for (e.g. AAPL)"),
    }),
    execute: async ({ ticker }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(ticker.toUpperCase())}/insider`;
      return veroqGet(options, path);
    },
  });
