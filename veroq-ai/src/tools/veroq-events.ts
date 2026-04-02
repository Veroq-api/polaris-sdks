import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqEvents = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Get notable events detected across intelligence briefs — significant developments, announcements, and inflection points.",
    parameters: z.object({
      type: z
        .string()
        .optional()
        .describe("Event type to filter by"),
      subject: z
        .string()
        .optional()
        .describe("Subject or entity to filter events for"),
    }),
    execute: async ({ type, subject }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.events({ type, subject });
    },
  });
