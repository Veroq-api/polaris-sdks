import { tool } from "ai";
import { z } from "zod";
import { veroqPost, type ToolOptions } from "./_fetch.js";

export const veroqRunAgent = (options: ToolOptions = {}) =>
  tool({
    description:
      "Run a VEROQ agent by its slug with custom inputs. Agents perform multi-step research, analysis, and reporting workflows.",
    parameters: z.object({
      slug: z
        .string()
        .describe("The agent slug to run (e.g. 'earnings-analyzer', 'sector-report')"),
      inputs: z
        .record(z.unknown())
        .describe("Key-value inputs to pass to the agent"),
    }),
    execute: async ({ slug, inputs }) => {
      const path = `/api/v1/agents/run/${encodeURIComponent(slug)}`;
      return veroqPost(options, path, inputs);
    },
  });
