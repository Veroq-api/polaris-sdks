import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqSocialTrending = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get trending tickers on social media — shows which stocks and crypto are generating the most buzz across social platforms right now.",
    parameters: z.object({
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 20)"),
    }),
    execute: async ({ limit }) => {
      return veroqGet(options, "/api/v1/social/trending", {
        limit: limit !== undefined ? String(limit) : undefined,
      });
    },
  });
