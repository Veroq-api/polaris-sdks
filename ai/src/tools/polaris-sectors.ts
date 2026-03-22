import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const polarisSectors = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get all market sectors with sentiment overview — shows which sectors are trending positive or negative based on intelligence coverage.",
    parameters: z.object({
      days: z
        .number()
        .optional()
        .describe("Lookback window in days (default 7)"),
    }),
    execute: async ({ days }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.sectors({ days });
    },
  });
