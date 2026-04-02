import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";
function getClient(runtime) {
    return runtime[MADEONSOL_CLIENT_KEY] ?? new MadeOnSolClient();
}
export const kolFeedAction = {
    name: "GET_KOL_FEED",
    description: "Get the real-time Solana KOL trade feed from MadeOnSol. Shows latest buys and sells from 946 tracked KOL wallets with deployer enrichment.",
    similes: [
        "kol trades",
        "what are kols buying",
        "solana kol feed",
        "kol activity",
        "smart money trades",
        "what did kols trade",
    ],
    validate: async (_runtime, message) => {
        const text = (message.content?.text || "").toLowerCase();
        return /\b(kol|smart money)\b/.test(text) && /\b(feed|trade|buy|sell|activit)/i.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const client = getClient(runtime);
        const text = (message.content?.text || "").toLowerCase();
        const action = text.includes("buy") ? "buy" : text.includes("sell") ? "sell" : undefined;
        const result = await client.getKolFeed({ limit: "10", ...(action ? { action } : {}) });
        if (result.error) {
            callback?.({ text: result.status === 402
                    ? "x402 payment required but no wallet configured. Set SVM_PRIVATE_KEY to enable automatic USDC payments."
                    : `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        const lines = (data.trades || []).slice(0, 10).map((t) => `${t.kol_name || "Unknown"} ${t.action === "buy" ? "bought" : "sold"} ${t.token_symbol || "?"} for ${Number(t.sol_amount).toFixed(2)} SOL`);
        callback?.({
            text: `Latest KOL trades:\n${lines.join("\n")}`,
            content: data,
        });
        return undefined;
    },
    examples: [
        [
            { name: "user1", content: { text: "What are the latest KOL trades on Solana?" } },
            { name: "assistant", content: { text: "Here are the latest KOL trades from MadeOnSol..." } },
        ],
    ],
};
