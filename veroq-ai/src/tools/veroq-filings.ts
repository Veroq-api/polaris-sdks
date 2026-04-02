import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqFilings = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get recent SEC filings for a ticker symbol — includes 10-K, 10-Q, 8-K, and other regulatory filings with links and summaries.",
    parameters: z.object({
      ticker: z
        .string()
        .describe("Ticker symbol to look up filings for (e.g. TSLA)"),
    }),
    execute: async ({ ticker }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(ticker.toUpperCase())}/filings`;
      return veroqGet(options, path);
    },
  });
