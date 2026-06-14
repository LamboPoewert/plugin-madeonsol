import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";
function getClient(runtime) {
    return runtime[MADEONSOL_CLIENT_KEY] ?? new MadeOnSolClient();
}
const MINT_RE = /\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/;
export const kolTokenEntryOrderAction = {
    name: "GET_KOL_TOKEN_ENTRY_ORDER",
    description: "Get the ranked order of KOL first-buyers for a specific Solana token from MadeOnSol. Shows who entered first and how quickly others followed.",
    similes: [
        "who bought first",
        "first kol buyers",
        "kol entry order",
        "token entry ranking",
        "who entered first",
    ],
    validate: async (_runtime, message) => {
        const text = message.content?.text || "";
        return /\b(first|entry|entered|order)\b/i.test(text) && MINT_RE.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const client = getClient(runtime);
        const mint = (message.content?.text || "").match(MINT_RE)?.[1];
        if (!mint) {
            callback?.({ text: "Please include a token mint address." });
            return undefined;
        }
        const result = await client.getKolTokenEntryOrder(mint, { limit: "20" });
        if (result.error) {
            callback?.({ text: result.status === 402
                    ? "Authentication required. Set MADEONSOL_API_KEY — free at https://madeonsol.com/pricing — or SVM_PRIVATE_KEY."
                    : `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        const lines = (data.entries || []).slice(0, 10).map((e) => {
            const who = e.kol_name || `${e.wallet_address.slice(0, 4)}…${e.wallet_address.slice(-4)}`;
            const when = e.seconds_after_first === 0 ? "first" : `+${e.seconds_after_first}s`;
            return `#${e.rank} ${who} — ${e.sol_amount.toFixed(2)} SOL (${when})`;
        });
        callback?.({
            text: `KOL entry order for ${mint.slice(0, 8)}…:\n${lines.join("\n") || "No KOL buys recorded."}`,
            content: data,
        });
        return undefined;
    },
    examples: [
        [
            { name: "user1", content: { text: "Who were the first KOLs to buy 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?" } },
            { name: "assistant", content: { text: "Here's the KOL entry order for that token..." } },
        ],
    ],
};
