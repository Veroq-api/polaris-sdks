import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqCryptoDefi = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get DeFi (decentralized finance) data. Without a protocol, returns TVL overview with top protocols and chain breakdown. With a protocol slug (e.g. aave, uniswap), returns that protocol's TVL history and details.",
    parameters: z.object({
      protocol: z
        .string()
        .optional()
        .describe("DeFi protocol slug (e.g. aave, uniswap, lido). Omit for overview."),
    }),
    execute: async ({ protocol }) => {
      const path = protocol
        ? `/api/v1/crypto/defi/${encodeURIComponent(protocol.toLowerCase())}`
        : "/api/v1/crypto/defi";
      return veroqGet(options, path);
    },
  });
