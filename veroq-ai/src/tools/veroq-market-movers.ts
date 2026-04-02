import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqMarketMovers = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get top market movers — gainers, losers, and most active stocks by volume. Useful for a quick snapshot of what is moving in the market right now.",
    parameters: z.object({}),
    execute: async () => {
      return veroqGet(options, "/api/v1/market/movers");
    },
  });
