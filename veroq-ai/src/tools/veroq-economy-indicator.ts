import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqEconomyIndicator = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get data for a specific economic indicator — returns historical observations, current value, and trend for indicators like GDP, CPI, unemployment, and fed funds rate.",
    parameters: z.object({
      indicator: z
        .string()
        .describe("Economic indicator slug (e.g. gdp, cpi, unemployment, fed_funds)"),
      limit: z
        .number()
        .optional()
        .describe("Number of historical observations to return (default 30, max 100)"),
    }),
    execute: async ({ indicator, limit }) => {
      const path = `/api/v1/economy/${encodeURIComponent(indicator)}`;
      return veroqGet(options, path, {
        limit: limit !== undefined ? String(limit) : undefined,
      });
    },
  });
