import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqExtract = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Extract clean article content from URLs. Returns structured text with metadata.",
    parameters: z.object({
      urls: z
        .array(z.string())
        .min(1)
        .max(5)
        .describe("URLs to extract article content from (1-5)"),
    }),
    execute: async ({ urls }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.extract(urls);
    },
  });
