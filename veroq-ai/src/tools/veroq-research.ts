import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqResearch = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Deep research across verified intelligence briefs. Synthesizes a comprehensive report with key findings and information gaps. Costs 5 API credits.",
    parameters: z.object({
      query: z.string().describe("Research query to investigate"),
      category: z
        .string()
        .optional()
        .describe("Category slug to focus research (e.g. ai_ml, policy)"),
      maxSources: z
        .number()
        .optional()
        .describe("Maximum briefs to analyze (1-50, default 20)"),
    }),
    execute: async ({ query, category, maxSources }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.research(query, { category, maxSources });
    },
  });
