import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

const ADDR_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

export const kolCompareAction: Action = {
  name: "GET_KOL_COMPARE",
  description:
    "Compare 2-5 Solana KOL wallets side-by-side on MadeOnSol — strategy, winrates, ROI, percentile. PRO+ adds overlap tokens (bought by 2+ in last 30d).",
  similes: [
    "compare kols",
    "compare wallets",
    "kol comparison",
    "side by side kols",
    "who is better kol",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text || "";
    const matches = text.match(ADDR_RE) ?? [];
    return /\bcompare\b/i.test(text) && matches.length >= 2;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ) => {
    const client = getClient(runtime);
    const wallets = ((message.content?.text || "").match(ADDR_RE) ?? []).slice(0, 5);
    if (wallets.length < 2) {
      callback?.({ text: "Please include at least 2 wallet addresses to compare." });
      return undefined;
    }

    const result = await client.getKolCompare(wallets);

    if (result.error) {
      callback?.({ text: result.status === 402
        ? "Authentication required. Set MADEONSOL_API_KEY — free at https://madeonsol.com/pricing — or SVM_PRIVATE_KEY."
        : `Error: ${result.error}` });
      return undefined;
    }

    const data = result.data as {
      profiles: Array<{ wallet_address: string; name: string | null; strategy_tag: string | null; winrate_7d: number | null; pnl_30d: number | null }>;
      overlap?: Array<{ token_symbol: string | null; wallets: string[] }>;
    };
    const lines = (data.profiles || []).map((p) => {
      const who = p.name || `${p.wallet_address.slice(0, 4)}…${p.wallet_address.slice(-4)}`;
      const wr = p.winrate_7d != null ? `${p.winrate_7d.toFixed(1)}%` : "—";
      const pnl = p.pnl_30d != null ? `${p.pnl_30d > 0 ? "+" : ""}${p.pnl_30d.toFixed(1)} SOL` : "—";
      return `${who} [${p.strategy_tag || "mixed"}] winrate 7d: ${wr}, PnL 30d: ${pnl}`;
    });
    const overlap = (data.overlap || []).slice(0, 5).map((o) => `${o.token_symbol || "?"} (${o.wallets.length} wallets)`);

    callback?.({
      text:
        `KOL comparison:\n${lines.join("\n")}` +
        (overlap.length ? `\n\nOverlap (30d): ${overlap.join(", ")}` : ""),
      content: data,
    });
    return undefined;
  },

  examples: [
    [
      { name: "user1", content: { text: "Compare these two KOLs: ABC...123 and DEF...456" } },
      { name: "assistant", content: { text: "Here's the side-by-side comparison..." } },
    ],
  ] as Action["examples"],
};
