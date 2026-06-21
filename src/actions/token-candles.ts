import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

const MINT_RE = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/;
const TF_RE = /\b(1m|5m|15m|1h|4h|1d)\b/i;

export const tokenCandlesAction: Action = {
  name: "GET_TOKEN_CANDLES",
  description:
    "Get historical OHLCV price candles for a Solana token from MadeOnSol (1m/5m/15m/1h/4h/1d). Each candle has t/open/high/low/close/volume_usd/trades/market_cap_usd. PRO=OHLCV 30d; ULTRA adds net flow, liquidity delta, and full history. PRO+.",
  similes: [
    "token candles",
    "ohlc",
    "ohlcv",
    "price chart",
    "candlestick",
    "price history",
    "candle data",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text || "";
    return /\b(candle|chart|ohlc|ohlcv|candlestick)\b/i.test(text) && MINT_RE.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ) => {
    const client = getClient(runtime);
    const text = message.content?.text || "";
    const mint = text.match(MINT_RE)?.[1];
    if (!mint) {
      callback?.({ text: "Please include a token mint address." });
      return undefined;
    }

    const tf = text.match(TF_RE)?.[1]?.toLowerCase();
    const result = await client.getTokenCandles(mint, tf ? { tf } : undefined);

    if (result.error) {
      callback?.({ text: result.status === 402
        ? "Authentication required. Set MADEONSOL_API_KEY — free at https://madeonsol.com/pricing — or SVM_PRIVATE_KEY."
        : `Error: ${result.error}` });
      return undefined;
    }

    const data = result.data as {
      timeframe: string;
      count: number;
      candles?: Array<{
        t: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume_usd: number;
      }>;
    };
    const candles = data.candles || [];
    const latest = candles.slice(-5);
    const lines = latest.map(
      (c) =>
        `• ${c.t} — O ${c.open} H ${c.high} L ${c.low} C ${c.close} (vol $${Math.round(c.volume_usd).toLocaleString()})`,
    );

    callback?.({
      text: `${data.timeframe} candles for ${mint.slice(0, 8)}… (${data.count} total)${lines.length ? `\nLatest:\n${lines.join("\n")}` : ""}`,
      content: data,
    });
    return undefined;
  },

  examples: [
    [
      { name: "user1", content: { text: "Show me the 1h candles for 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" } },
      { name: "assistant", content: { text: "Here's the OHLCV candle history for that token..." } },
    ],
  ] as Action["examples"],
};
