import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqCommodities = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get commodity prices. Without a symbol, returns all tracked commodities (gold, oil, silver, etc.). With a symbol, returns that commodity's current price and change data.",
    parameters: z.object({
      symbol: z
        .string()
        .optional()
        .describe("Commodity slug (e.g. gold, oil, silver, natural_gas). Omit for all."),
    }),
    execute: async ({ symbol }) => {
      const path = symbol
        ? `/api/v1/commodities/${encodeURIComponent(symbol.toLowerCase())}`
        : "/api/v1/commodities";
      return veroqGet(options, path);
    },
  });
