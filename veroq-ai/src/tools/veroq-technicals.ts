import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqTechnicals = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get all technical indicators and a signal summary for a ticker. Includes SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Stochastic, ADX, OBV, and VWAP with an overall buy/sell/neutral verdict.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol (e.g. NVDA)"),
      range: z
        .enum(["1mo", "3mo", "6mo", "1y", "2y", "5y"])
        .optional()
        .describe("Date range for indicator calculation (default 6mo)"),
    }),
    execute: async ({ symbol, range }) => {
      return veroqGet(options, `/api/v1/ticker/${encodeURIComponent(symbol)}/technicals`, {
        range,
      });
    },
  });
