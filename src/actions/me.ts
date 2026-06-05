import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";

function getClient(runtime: IAgentRuntime): MadeOnSolClient {
  return ((runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] as MadeOnSolClient) ?? new MadeOnSolClient();
}

/**
 * Returns the authenticated caller's MadeOnSol account: tier, daily/burst
 * quota usage, and feature slot counts (webhooks, copy-trade rules, coord rules).
 */
export const meAction: Action = {
  name: "GET_MADEONSOL_ACCOUNT",
  description:
    "Get your MadeOnSol account info — current tier, daily request quota, burst limit, and how many webhook / copy-trade / coordination rule slots you have used.",
  similes: [
    "my account",
    "my quota",
    "how many requests",
    "api usage",
    "my tier",
    "requests remaining",
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return /\b(my account|my quota|how many requests|api usage|tier|remaining)\b/.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ) => {
    const client = getClient(runtime);
    const result = await client.getMe();

    if (result.error) {
      callback?.({ text: result.status === 401 || result.status === 402
        ? "Authentication required. Set MADEONSOL_API_KEY — free at https://madeonsol.com/pricing — or SVM_PRIVATE_KEY."
        : `Error: ${result.error}` });
      return undefined;
    }

    const data = result.data as {
      tier?: string;
      quota?: {
        daily?: { used?: number; limit?: number; remaining?: number };
        burst?: { used?: number; limit?: number };
      };
      slots?: {
        webhooks?: { used?: number; limit?: number };
        copy_trade_wallets?: { used?: number; limit?: number };
        coordination_rules?: { used?: number; limit?: number };
      };
    };

    const tier = (data.tier || "unknown").toUpperCase();
    const dUsed = data.quota?.daily?.used ?? 0;
    const dLimit = data.quota?.daily?.limit ?? 0;
    const dRem = data.quota?.daily?.remaining ?? Math.max(0, dLimit - dUsed);
    const bUsed = data.quota?.burst?.used ?? 0;
    const bLimit = data.quota?.burst?.limit ?? 0;
    const whUsed = data.slots?.webhooks?.used ?? 0;
    const whLimit = data.slots?.webhooks?.limit ?? 0;
    const ctUsed = data.slots?.copy_trade_wallets?.used ?? 0;
    const ctLimit = data.slots?.copy_trade_wallets?.limit ?? 0;
    const crUsed = data.slots?.coordination_rules?.used ?? 0;
    const crLimit = data.slots?.coordination_rules?.limit ?? 0;

    callback?.({
      text: `Your MadeOnSol account: ${tier} tier. Daily quota: ${dUsed}/${dLimit} (${dRem} left). Burst: ${bUsed}/${bLimit} per minute. Webhooks: ${whUsed}/${whLimit}, Copy-trade wallets: ${ctUsed}/${ctLimit}, Coord rules: ${crUsed}/${crLimit}.`,
      content: data,
    });
    return undefined;
  },

  examples: [
    [
      { name: "user1", content: { text: "What is my MadeOnSol tier and how many requests do I have remaining?" } },
      { name: "assistant", content: { text: "Here is your MadeOnSol account info..." } },
    ],
  ] as Action["examples"],
};
