import { kolFeedAction } from "./actions/kol-feed.js";
import { kolCoordinationAction } from "./actions/kol-coordination.js";
import { kolLeaderboardAction } from "./actions/kol-leaderboard.js";
import { deployerAlertsAction } from "./actions/deployer-alerts.js";
import { MadeOnSolClient } from "./client.js";
/** Key used to store the initialized client on the runtime */
export const MADEONSOL_CLIENT_KEY = "madeonsol:client";
export const madeOnSolPlugin = {
    name: "madeonsol",
    description: "Query Solana KOL trading intelligence and deployer analytics from MadeOnSol via x402 micropayments. Tracks 946 KOL wallets and 4000+ Pump.fun deployers.",
    actions: [
        kolFeedAction,
        kolCoordinationAction,
        kolLeaderboardAction,
        deployerAlertsAction,
    ],
    /**
     * Initialize the x402 payment-enabled client.
     * Requires SVM_PRIVATE_KEY in the runtime settings for automatic payments.
     * Without it, the plugin still works but requests will return 402 payment info.
     */
    init: async (_config, runtime) => {
        const baseUrl = String(runtime.getSetting?.("MADEONSOL_API_URL") || "https://madeonsol.com");
        const privateKey = runtime.getSetting?.("SVM_PRIVATE_KEY");
        let fetchFn;
        if (privateKey) {
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
            }
            catch (err) {
                console.warn("[madeonsol] x402 payment setup failed, running in read-only mode:", err);
            }
        }
        else {
            console.log("[madeonsol] No SVM_PRIVATE_KEY — running in read-only mode (402 info only)");
        }
        const madeOnSolClient = new MadeOnSolClient({ baseUrl, fetchFn });
        runtime[MADEONSOL_CLIENT_KEY] = madeOnSolClient;
    },
};
export default madeOnSolPlugin;
export { MadeOnSolClient } from "./client.js";
export { kolFeedAction, kolCoordinationAction, kolLeaderboardAction, deployerAlertsAction };
