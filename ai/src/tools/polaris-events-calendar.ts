import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const polarisEventsCalendar = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get structured market events (earnings, launches, regulatory deadlines, etc.) filterable by ticker and event type.",
    parameters: z.object({
      ticker: z
        .string()
        .optional()
        .describe("Filter events for a specific ticker symbol"),
      type: z
        .string()
        .optional()
        .describe("Filter by event type (e.g. earnings, launch, regulatory)"),
      days: z
        .number()
        .optional()
        .describe("Lookback/lookahead window in days (default 30)"),
      limit: z
        .number()
        .optional()
        .describe("Max events to return (default 30)"),
    }),
    execute: async ({ ticker, type, days, limit }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.eventsCalendar({ ticker, type, days, limit });
    },
  });
