import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqEntities = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Look up news coverage for a specific entity (company, person, technology).",
    parameters: z.object({
      name: z
        .string()
        .describe(
          "Entity name to look up (e.g. OpenAI, Elon Musk, quantum computing)"
        ),
    }),
    execute: async ({ name }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.entityBriefs(name);
    },
  });
