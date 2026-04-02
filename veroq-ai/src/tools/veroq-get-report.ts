import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqGetReport = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Retrieve a previously generated report by its ID. Returns the full report content including all analysis sections.",
    parameters: z.object({
      reportId: z.string().describe("The report ID to retrieve"),
    }),
    execute: async ({ reportId }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.getReport(reportId);
    },
  });
