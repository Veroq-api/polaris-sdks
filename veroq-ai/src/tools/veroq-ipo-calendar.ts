import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqIpoCalendar = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get upcoming IPOs — lists companies preparing to go public with expected dates, price ranges, and exchange listings.",
    parameters: z.object({
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 20)"),
    }),
    execute: async ({ limit }) => {
      return veroqGet(options, "/api/v1/ipo/calendar", {
        limit: limit !== undefined ? String(limit) : undefined,
      });
    },
  });
