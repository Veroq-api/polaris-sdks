import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqInstitutions = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get institutional ownership data for a ticker symbol — shows top holders, recent position changes, and ownership concentration.",
    parameters: z.object({
      ticker: z
        .string()
        .describe("Ticker symbol to look up institutional ownership for (e.g. GOOG)"),
    }),
    execute: async ({ ticker }) => {
      const path = `/api/v1/ticker/${encodeURIComponent(ticker.toUpperCase())}/institutions`;
      return veroqGet(options, path);
    },
  });
