import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";
function getClient(runtime) {
    return runtime[MADEONSOL_CLIENT_KEY] ?? new MadeOnSolClient();
}
export const kolCoordinationAction = {
    name: "GET_KOL_COORDINATION",
    description: "Get KOL convergence signals from MadeOnSol — tokens being accumulated by multiple KOLs simultaneously. Shows which tokens smart money is converging on.",
    similes: [
        "kol convergence",
        "what tokens are kols accumulating",
        "kol coordination",
        "smart money convergence",
        "multiple kols buying",
    ],
    validate: async (_runtime, message) => {
        const text = (message.content?.text || "").toLowerCase();
        return /\b(kol|smart money)\b/.test(text) && /\b(converg|coordinat|accumul|same token|multiple)/i.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const client = getClient(runtime);
        const text = (message.content?.text || "").toLowerCase();
        const period = text.includes("1h") ? "1h" : text.includes("7d") ? "7d" : text.includes("6h") ? "6h" : "24h";
        const result = await client.getKolCoordination({ period, limit: "10" });
        if (result.error) {
            callback?.({ text: result.status === 402
                    ? "x402 payment required but no wallet configured. Set SVM_PRIVATE_KEY to enable automatic USDC payments."
                    : `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        const lines = (data.coordination || []).map((t) => `${t.token_symbol}: ${t.kol_count} KOLs ${t.signal} (${t.net_sol_flow > 0 ? "+" : ""}${t.net_sol_flow.toFixed(2)} SOL net)`);
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
    ],
};
