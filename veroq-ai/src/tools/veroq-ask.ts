import { tool } from "ai";
import { z } from "zod";
import { veroqPost, type ToolOptions } from "./_fetch.js";

export const veroqAsk = (options: ToolOptions = {}) =>
  tool({
    description:
      "Ask any question about markets, companies, economics, or geopolitics and get an AI-generated answer grounded in verified intelligence briefs. The most versatile tool in the VEROQ toolkit.",
    parameters: z.object({
      question: z
        .string()
        .describe("The question to ask (e.g. 'What is driving NVIDIA stock price this week?')"),
    }),
    execute: async ({ question }) => {
      return veroqPost(options, "/api/v1/ask", { question });
    },
  });
