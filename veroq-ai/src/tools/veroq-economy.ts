import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqEconomy = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get economic indicators from the FRED API. Without an indicator slug, returns a summary of all key indicators (GDP, CPI, unemployment, etc.). With a slug, returns that indicator's history.",
    parameters: z.object({
      indicator: z
        .string()
        .optional()
        .describe("Indicator slug (e.g. gdp, cpi, unemployment, fed_funds). Omit for summary of all."),
      limit: z
        .number()
        .optional()
        .describe("Number of historical observations to return (default 30, max 100)"),
    }),
    execute: async ({ indicator, limit }) => {
      const path = indicator
        ? `/api/v1/economy/${encodeURIComponent(indicator)}`
        : "/api/v1/economy";
      return veroqGet(options, path, {
        limit: limit !== undefined ? String(limit) : undefined,
      });
    },
  });
