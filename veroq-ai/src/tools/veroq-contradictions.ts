import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqContradictions = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Find contradictions across the intelligence brief network — stories where sources disagree on facts, framing, or conclusions.",
    parameters: z.object({
      severity: z
        .string()
        .optional()
        .describe("Filter by severity level (e.g. high, medium, low)"),
    }),
    execute: async ({ severity }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.contradictions({ severity });
    },
  });
