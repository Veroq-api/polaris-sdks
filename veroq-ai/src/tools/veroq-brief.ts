import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqBrief = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get a specific verified news brief by ID with full analysis, sources, and counter-arguments.",
    parameters: z.object({
      id: z.string().describe("The brief ID to retrieve"),
    }),
    execute: async ({ id }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.brief(id);
    },
  });
