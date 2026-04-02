import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqForex = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get forex exchange rates. Without a pair, returns all major forex pairs. With a pair (e.g. EURUSD), returns that specific rate and change data.",
    parameters: z.object({
      pair: z
        .string()
        .optional()
        .describe("Forex pair (e.g. EURUSD, GBPUSD, USDJPY). Omit for all pairs."),
    }),
    execute: async ({ pair }) => {
      const path = pair
        ? `/api/v1/forex/${encodeURIComponent(pair.toUpperCase())}`
        : "/api/v1/forex";
      return veroqGet(options, path);
    },
  });
