import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

export const kolCoordinationAction: Action = {
  name: "GET_KOL_COORDINATION",
  description:
    "Get KOL convergence signals from MadeOnSol — tokens being accumulated by multiple KOLs simultaneously. Shows which tokens smart money is converging on.",
  similes: [
    "kol convergence",
    "what tokens are kols accumulating",
    "kol coordination",
    "smart money convergence",
    "multiple kols buying",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return /\b(kol|smart money)\b/.test(text) && /\b(converg|coordinat|accumul|same token|multiple)/i.test(text);
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
    const period = text.includes("1h") ? "1h" : text.includes("7d") ? "7d" : text.includes("6h") ? "6h" : "24h";

    const result = await client.getKolCoordination({ period, limit: "10" });

    if (result.error) {
      callback?.({ text: result.status === 402
        ? "Authentication required. Set MADEONSOL_API_KEY (free at madeonsol.com/developer), RAPIDAPI_KEY, or SVM_PRIVATE_KEY."
        : `Error: ${result.error}` });
      return undefined;
    }

    const data = result.data as { coordination: Array<{ token_symbol: string; kol_count: number; signal: string; net_sol_flow: number }> };
    const lines = (data.coordination || []).map(
      (t) => `${t.token_symbol}: ${t.kol_count} KOLs ${t.signal} (${t.net_sol_flow > 0 ? "+" : ""}${t.net_sol_flow.toFixed(2)} SOL net)`
    );

    callback?.({
      text: `KOL convergence signals (${period}):\n${lines.join("\n") || "No coordination signals found."}`,
      content: data,
    });
    return undefined;
  },

  examples: [
    [
      { name: "user1", content: { text: "What tokens are multiple KOLs accumulating?" } },
      { name: "assistant", content: { text: "Here are the KOL convergence signals..." } },
    ],
  ] as Action["examples"],
};
