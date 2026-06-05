import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

function fmtMc(mc?: number | null): string {
  if (mc == null || !isFinite(mc) || mc <= 0) return "?";
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`;
  return `$${mc.toFixed(0)}`;
}

/**
 * Scan the MadeOnSol token universe with MC, liquidity, momentum, and DEX filters.
 * Heuristics pulled from the user prompt: "high liquidity" → min_liq=10000,
 * "momentum"/"pumping" → mc_change_1h_min_pct=10, "pumpfun" → primary_dex=pumpfun.
 */
export const tokensListAction: Action = {
  name: "LIST_MADEONSOL_TOKENS",
  description:
    "Scan MadeOnSol's Solana token universe by MC, liquidity, 1h MC momentum, primary DEX, or age. Returns the top matching tokens with mint, symbol, market cap, liquidity, and 1h MC change.",
  similes: [
    "top tokens",
    "trending tokens",
    "hot tokens",
    "scan tokens",
    "tokens by mc",
    "liquid tokens",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return /\b(top tokens|trending tokens|hot tokens|scan tokens|tokens by mc|liquid tokens)\b/.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ) => {
    const client = getClient(runtime);
    const text = (message.content?.text || "").toLowerCase();

    const params: {
      limit?: string;
      primary_dex?: string;
      min_liq?: string;
      mc_change_1h_min_pct?: string;
    } = { limit: "10" };

    if (/high liquidity/.test(text)) params.min_liq = "10000";
    if (/momentum|pumping/.test(text)) params.mc_change_1h_min_pct = "10";
    if (/pumpfun|pump\.fun/.test(text)) params.primary_dex = "pumpfun";

    const result = await client.getTokensList(params);

    if (result.error) {
      callback?.({ text: result.status === 402
        ? "Authentication required. Set MADEONSOL_API_KEY — free at https://madeonsol.com/pricing — or SVM_PRIVATE_KEY."
        : `Error: ${result.error}` });
      return undefined;
    }

    const data = result.data as {
      tokens?: Array<{
        mint: string;
        symbol?: string | null;
        name?: string | null;
        mc_usd?: number | null;
        liquidity_usd?: number | null;
        mc_change_1h_pct?: number | null;
      }>;
    };

    const tokens = (data.tokens || []).slice(0, 10);
    const lines = tokens.map((t, i) => {
      const label = t.symbol || t.name || "?";
      const change = t.mc_change_1h_pct != null && isFinite(t.mc_change_1h_pct)
        ? ` (${t.mc_change_1h_pct >= 0 ? "+" : ""}${t.mc_change_1h_pct.toFixed(1)}% 1h)`
        : "";
      return `${i + 1}. ${label} ${t.mint.slice(0, 8)}… — MC ${fmtMc(t.mc_usd)}, Liq ${fmtMc(t.liquidity_usd)}${change}`;
    });

    callback?.({
      text: tokens.length
        ? `Top tokens:\n${lines.join("\n")}`
        : "No tokens matched those filters.",
      content: data,
    });
    return undefined;
  },

  examples: [
    [
      { name: "user1", content: { text: "Show me the top trending tokens on Solana with high liquidity" } },
      { name: "assistant", content: { text: "Here are the top trending tokens..." } },
    ],
  ] as Action["examples"],
};
