import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

export const kolLeaderboardAction: Action = {
  name: "GET_KOL_LEADERBOARD",
  description:
    "Get KOL performance rankings from MadeOnSol — top Solana KOLs ranked by PnL, volume, and win rate.",
  similes: [
    "kol leaderboard",
    "best performing kols",
    "top kol traders",
    "kol rankings",
    "who is the best kol",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return /\b(kol|smart money)\b/.test(text) && /\b(leaderboard|ranking|top|best|perform|pnl|win rate)/i.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown>,
    callback?: HandlerCallback,
  ) => {
    const client = getClient(runtime);
    const text = (message.content?.text || "").toLowerCase();
    const period = text.includes("today") ? "today" : text.includes("30d") || text.includes("month") ? "30d" : "7d";

    const result = await client.getKolLeaderboard({ period, limit: "10" });

    if (result.error) {
      callback?.({ text: result.status === 402
        ? "x402 payment required but no wallet configured. Set SVM_PRIVATE_KEY to enable automatic USDC payments."
        : `Error: ${result.error}` });
      return;
    }

    const data = result.data as { leaderboard: Array<{ name: string; pnl_sol: number; buy_count: number; sell_count: number; win_rate: number | null }> };
    const lines = (data.leaderboard || []).map(
      (k, i) => `${i + 1}. ${k.name}: ${k.pnl_sol > 0 ? "+" : ""}${k.pnl_sol.toFixed(2)} SOL PnL (${k.buy_count}B/${k.sell_count}S${k.win_rate != null ? `, ${(k.win_rate * 100).toFixed(0)}% WR` : ""})`
    );

    callback?.({
      text: `KOL Leaderboard (${period}):\n${lines.join("\n") || "No data for this period."}`,
      content: data,
    });
  },

  examples: [
    [
      { user: "user1", content: { text: "Show me the top performing KOLs this week" } } as ActionExample,
      { user: "assistant", content: { text: "Here are the top KOLs by PnL..." } } as ActionExample,
    ],
  ],
};
