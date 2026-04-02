import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqVerify = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Fact-check a claim against the VEROQ brief corpus. Returns a verdict (supported/contradicted/partially_supported/unverifiable) with confidence, sources, and nuances.",
    parameters: z.object({
      claim: z
        .string()
        .min(10)
        .max(1000)
        .describe("The claim to fact-check"),
      context: z
        .string()
        .optional()
        .describe("Category to narrow the search (e.g. 'tech', 'policy')"),
    }),
    execute: async ({ claim, context }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.verify(claim, { context });
    },
  });
