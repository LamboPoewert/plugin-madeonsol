import type { Plugin, IAgentRuntime } from "@elizaos/core";
import { kolFeedAction } from "./actions/kol-feed.js";
import { kolCoordinationAction } from "./actions/kol-coordination.js";
import { kolLeaderboardAction } from "./actions/kol-leaderboard.js";
import { deployerAlertsAction } from "./actions/deployer-alerts.js";
import { MadeOnSolClient } from "./client.js";

/** Key used to store the initialized client on the runtime */
export const MADEONSOL_CLIENT_KEY = "madeonsol:client";

export const madeOnSolPlugin: Plugin = {
  name: "madeonsol",
  description:
    "Query Solana KOL trading intelligence and deployer analytics from MadeOnSol. Tracks 946 KOL wallets and 4000+ Pump.fun deployers.",
  actions: [
    kolFeedAction,
    kolCoordinationAction,
    kolLeaderboardAction,
    deployerAlertsAction,
  ],

  /**
   * Initialize the MadeOnSol client.
   * Auth priority: MADEONSOL_API_KEY > RAPIDAPI_KEY > SVM_PRIVATE_KEY (x402).
   * Get a free API key at madeonsol.com/developer — no wallet needed.
   */
  init: async (_config: Record<string, string>, runtime: IAgentRuntime) => {
    const baseUrl = String(runtime.getSetting?.("MADEONSOL_API_URL") || "https://madeonsol.com");
    const apiKey = runtime.getSetting?.("MADEONSOL_API_KEY") as string | undefined;
    const rapidApiKey = runtime.getSetting?.("RAPIDAPI_KEY") as string | undefined;
    const privateKey = runtime.getSetting?.("SVM_PRIVATE_KEY") as string | undefined;

    let fetchFn: typeof fetch | undefined;

    if (apiKey) {
      console.log("[madeonsol] Using MadeOnSol API key (Bearer auth)");
    } else if (rapidApiKey) {
      console.log("[madeonsol] Using RapidAPI key");
    } else if (privateKey) {
      try {
        const { wrapFetchWithPayment } = await import("@x402/fetch");
        const { x402Client } = await import("@x402/core/client");
        const { ExactSvmScheme } = await import("@x402/svm/exact/client");
        const { createKeyPairSignerFromBytes } = await import("@solana/kit");
        const { base58 } = await import("@scure/base");

        const signer = await createKeyPairSignerFromBytes(base58.decode(privateKey));
        const client = new x402Client();
        client.register("solana:*", new ExactSvmScheme(signer));
        fetchFn = wrapFetchWithPayment(fetch, client);

        console.log(`[madeonsol] x402 payments enabled, wallet: ${signer.address}`);
      } catch (err) {
        console.warn("[madeonsol] x402 payment setup failed:", err);
      }
    } else {
      console.log("[madeonsol] No auth configured. Set MADEONSOL_API_KEY (free at madeonsol.com/developer), RAPIDAPI_KEY, or SVM_PRIVATE_KEY.");
    }

    const madeOnSolClient = new MadeOnSolClient({ baseUrl, apiKey, rapidApiKey, fetchFn });
    (runtime as unknown as Record<string, unknown>)[MADEONSOL_CLIENT_KEY] = madeOnSolClient;
  },
};

export default madeOnSolPlugin;
export { MadeOnSolClient } from "./client.js";
export { kolFeedAction, kolCoordinationAction, kolLeaderboardAction, deployerAlertsAction };
