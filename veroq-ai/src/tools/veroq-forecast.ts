import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqForecast = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Generate a forward-looking forecast for a topic based on current intelligence trends, momentum signals, and historical patterns.",
    parameters: z.object({
      topic: z.string().describe("Topic to forecast future developments for"),
      depth: z
        .enum(["fast", "standard", "deep"])
        .optional()
        .describe("Analysis depth"),
    }),
    execute: async ({ topic, depth }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.forecast(topic, { depth });
    },
  });
