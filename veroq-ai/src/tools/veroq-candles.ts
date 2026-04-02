import { tool } from "ai";
import { z } from "zod";
import { veroqGet, type ToolOptions } from "./_fetch.js";

export const veroqCandles = (options: ToolOptions = {}) =>
  tool({
    description:
      "Get OHLCV candlestick data for a ticker symbol. Returns date, open, high, low, close, and volume for each period.",
    parameters: z.object({
      symbol: z
        .string()
        .describe("Ticker symbol (e.g. AAPL, MSFT)"),
      interval: z
        .enum(["1d", "1wk", "1mo"])
        .optional()
        .describe("Candle interval (default 1d)"),
      range: z
        .enum(["1mo", "3mo", "6mo", "1y", "2y", "5y"])
        .optional()
        .describe("Date range (default 6mo)"),
    }),
    execute: async ({ symbol, interval, range }) => {
      return veroqGet(options, `/api/v1/ticker/${encodeURIComponent(symbol)}/candles`, {
        interval,
        range,
      });
    },
  });
