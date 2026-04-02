import { tool } from "ai";
import { z } from "zod";
import { PolarisClient } from "polaris-news-api";

export const veroqCrawl = (options: { apiKey?: string } = {}) =>
  tool({
    description:
      "Extract structured content from a URL with optional link following. Returns page content, metadata, and optionally discovered links.",
    parameters: z.object({
      url: z.string().url().describe("URL to crawl and extract content from"),
      depth: z
        .number()
        .optional()
        .describe("Crawl depth (default 1)"),
      max_pages: z
        .number()
        .optional()
        .describe("Max pages to crawl (default 5)"),
      include_links: z
        .boolean()
        .optional()
        .describe("Include extracted links in response"),
    }),
    execute: async ({ url, depth, max_pages, include_links }) => {
      const client = new PolarisClient({ apiKey: options.apiKey });
      return client.crawl(url, { depth, max_pages, include_links });
    },
  });
