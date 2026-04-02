import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqTickerResolve = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Resolve ticker symbols to company names and sectors. Pass one or more comma-separated symbols to validate them against the VEROQ knowledge base.",
    parameters: z.object({
      q: z
        .string()
        .describe(
          "Comma-separated ticker symbols to resolve (e.g. AAPL,MSFT,TSLA)"
        ),
    }),
    execute: async ({ q }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      const symbols = q.split(",").map((s) => s.trim());
      return client.tickerResolve(symbols);
    },
  });
