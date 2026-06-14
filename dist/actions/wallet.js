import { MadeOnSolClient } from "../client.js";
import { MADEONSOL_CLIENT_KEY } from "../index.js";
function getClient(runtime) {
    return runtime[MADEONSOL_CLIENT_KEY] ?? new MadeOnSolClient();
}
// Base58 wallet matcher — pulls a 32-44 char base58 string out of natural language.
const WALLET_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
function extractWallet(text) {
    const m = text.match(WALLET_RE);
    return m ? m[0] : null;
}
export const walletStatsAction = {
    name: "WALLET_STATS",
    description: "Get aggregate stats + cross-product flags (is_kol, is_alpha_tracked with bot_confidence, is_deployer) for any Solana wallet over the last 90 days. Works on any wallet — not just curated KOLs.",
    similes: [
        "wallet stats",
        "wallet info",
        "wallet profile",
        "check wallet",
        "is this wallet a kol",
        "is this wallet a deployer",
        "how many trades has this wallet made",
    ],
    validate: async (_runtime, message) => {
        const text = message.content?.text || "";
        if (!extractWallet(text))
            return false;
        return /\b(wallet|address)\b/i.test(text) && /\b(stat|info|profile|check|details|about)\b/i.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const wallet = extractWallet(message.content?.text || "");
        if (!wallet) {
            callback?.({ text: "Couldn't find a Solana wallet address in your message." });
            return undefined;
        }
        const client = getClient(runtime);
        const result = await client.getWalletStats(wallet);
        if (result.error) {
            callback?.({ text: `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        const flagSummary = [];
        if (data.flags.is_kol)
            flagSummary.push(`KOL${data.flags.kol_name ? ` (${data.flags.kol_name})` : ""}`);
        if (data.flags.is_alpha_tracked && data.flags.alpha_win_rate != null) {
            flagSummary.push(`alpha (${(data.flags.alpha_win_rate * 100).toFixed(0)}% wr)`);
        }
        if (data.flags.bot_confidence != null && data.flags.bot_confidence > 0.5) {
            flagSummary.push(`likely bot (${(data.flags.bot_confidence * 100).toFixed(0)}% conf)`);
        }
        if (data.flags.is_deployer)
            flagSummary.push("deployer");
        const tradeSummary = data.stats
            ? `${data.stats.total_trades} trades across ${data.stats.unique_tokens} tokens · ${data.stats.bought_sol.toFixed(1)} SOL in / ${data.stats.sold_sol.toFixed(1)} SOL out (90d)`
            : "no recorded trades in the 90d window";
        const flagsText = flagSummary.length ? `Flags: ${flagSummary.join(" · ")}\n` : "";
        callback?.({
            text: `${data.address.slice(0, 8)}…${data.address.slice(-4)}\n${flagsText}${tradeSummary}`,
            content: data,
        });
        return undefined;
    },
    examples: [
        [
            { name: "user1", content: { text: "Get stats for wallet ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk" } },
            { name: "assistant", content: { text: "Here's the wallet profile..." } },
        ],
    ],
};
export const walletPnlAction = {
    name: "WALLET_PNL",
    description: "Get full FIFO cost-basis PnL for any Solana wallet — realized + unrealized SOL, profit factor, max drawdown, hold time stats, closed positions sorted by pnl desc, and open positions with live unrealized P&L. Works on any wallet, not just curated KOLs.",
    similes: [
        "wallet pnl",
        "wallet profit",
        "wallet loss",
        "is this wallet profitable",
        "how much did this wallet make",
        "wallet performance",
        "win rate of this wallet",
        "best trades of this wallet",
    ],
    validate: async (_runtime, message) => {
        const text = message.content?.text || "";
        if (!extractWallet(text))
            return false;
        return /\b(pnl|profit|loss|winrate|win.rate|performance|best.trade)\b/i.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const wallet = extractWallet(message.content?.text || "");
        if (!wallet) {
            callback?.({ text: "Couldn't find a Solana wallet address in your message." });
            return undefined;
        }
        const client = getClient(runtime);
        const result = await client.getWalletPnl(wallet);
        if (result.error) {
            callback?.({ text: `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        const s = data.summary;
        const winRateStr = s.win_rate != null ? `${(s.win_rate * 100).toFixed(0)}%` : "—";
        const pfStr = s.profit_factor != null ? s.profit_factor.toFixed(2) : "—";
        const holdStr = s.avg_hold_minutes != null ? `${s.avg_hold_minutes}m` : "—";
        const topWinners = data.closed_positions.slice(0, 3).filter((p) => p.pnl_sol > 0);
        const winnerLines = topWinners.map((p) => `  ${p.token_mint.slice(0, 6)}… +${p.pnl_sol.toFixed(2)} SOL (${p.roi_pct?.toFixed(0) ?? "?"}% ROI, ${p.hold_minutes ?? "?"}m hold)`);
        const lines = [
            `${data.address.slice(0, 8)}…${data.address.slice(-4)} — 90d PnL`,
            `Realized: ${s.realized_sol >= 0 ? "+" : ""}${s.realized_sol.toFixed(2)} SOL · Unrealized: ${s.unrealized_sol >= 0 ? "+" : ""}${s.unrealized_sol.toFixed(2)} SOL`,
            `Win rate: ${winRateStr} (${s.wins}W / ${s.losses}L) · Profit factor: ${pfStr} · Avg hold: ${holdStr}`,
            `Max drawdown: ${s.max_drawdown_sol.toFixed(2)} SOL · Open: ${s.open_positions_count} · Closed: ${s.closed_positions_count}`,
        ];
        if (winnerLines.length)
            lines.push("Top winners:", ...winnerLines);
        callback?.({ text: lines.join("\n"), content: data });
        return undefined;
    },
    examples: [
        [
            { name: "user1", content: { text: "What's the PnL for ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk?" } },
            { name: "assistant", content: { text: "Here's the wallet's 90-day PnL..." } },
        ],
    ],
};
export const walletPositionsAction = {
    name: "WALLET_POSITIONS",
    description: "List open positions for any Solana wallet with live unrealized P&L from the market-cap tracker. Lighter slice of WALLET_PNL — use when you only need the bags, not the full performance summary.",
    similes: [
        "wallet positions",
        "what is this wallet holding",
        "open bags",
        "current positions",
        "what tokens does this wallet own",
        "wallet bags",
    ],
    validate: async (_runtime, message) => {
        const text = message.content?.text || "";
        if (!extractWallet(text))
            return false;
        return /\b(position|bag|holding|holds|owns|hold)\b/i.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const wallet = extractWallet(message.content?.text || "");
        if (!wallet) {
            callback?.({ text: "Couldn't find a Solana wallet address in your message." });
            return undefined;
        }
        const client = getClient(runtime);
        const result = await client.getWalletPositions(wallet);
        if (result.error) {
            callback?.({ text: `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        if (!data.positions || data.positions.length === 0) {
            callback?.({ text: `${data.address.slice(0, 8)}… has no open positions in the 90-day window.`, content: data });
            return undefined;
        }
        // Top 10 by absolute cost basis
        const top = [...data.positions]
            .sort((a, b) => b.cost_basis_sol - a.cost_basis_sol)
            .slice(0, 10);
        const lines = top.map((p) => {
            const u = p.unrealized_sol;
            const tag = u == null ? "?" : u > 0 ? `+${u.toFixed(2)} (${p.unrealized_pct?.toFixed(0)}%)` : `${u.toFixed(2)} (${p.unrealized_pct?.toFixed(0)}%)`;
            return `  ${p.token_mint.slice(0, 8)}… cost ${p.cost_basis_sol.toFixed(2)} SOL · unrealized ${tag} SOL`;
        });
        callback?.({
            text: `${data.address.slice(0, 8)}… — ${data.positions.length} open position(s)\nTop ${top.length}:\n${lines.join("\n")}`,
            content: data,
        });
        return undefined;
    },
    examples: [
        [
            { name: "user1", content: { text: "What is wallet ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk holding?" } },
            { name: "assistant", content: { text: "Open positions..." } },
        ],
    ],
};
export const walletTradesAction = {
    name: "WALLET_TRADES",
    description: "Get recent raw trades for any Solana wallet over the last 90 days. Filterable by action (buy/sell). Returns up to 50 most recent trades; use cursor pagination for more.",
    similes: [
        "wallet trades",
        "wallet history",
        "wallet activity",
        "recent trades",
        "what did this wallet trade",
        "wallet swaps",
    ],
    validate: async (_runtime, message) => {
        const text = message.content?.text || "";
        if (!extractWallet(text))
            return false;
        return /\b(trade|swap|activity|history|recent)\b/i.test(text);
    },
    handler: async (runtime, message, _state, _options, callback) => {
        const text = message.content?.text || "";
        const wallet = extractWallet(text);
        if (!wallet) {
            callback?.({ text: "Couldn't find a Solana wallet address in your message." });
            return undefined;
        }
        const client = getClient(runtime);
        const lc = text.toLowerCase();
        const action = lc.includes("buy") && !lc.includes("buys and sells") ? "buy" : lc.includes("sell") ? "sell" : undefined;
        const result = await client.getWalletTrades(wallet, { limit: 50, ...(action ? { action } : {}) });
        if (result.error) {
            callback?.({ text: `Error: ${result.error}` });
            return undefined;
        }
        const data = result.data;
        if (!data.trades || data.trades.length === 0) {
            callback?.({ text: `No trades found for ${data.address.slice(0, 8)}… (90-day window).`, content: data });
            return undefined;
        }
        const lines = data.trades.slice(0, 15).map((t) => `  ${t.traded_at.slice(0, 16).replace("T", " ")}  ${t.action.toUpperCase()}  ${t.sol_amount.toFixed(2)} SOL  →  ${t.token_mint.slice(0, 8)}…`);
        callback?.({
            text: `${data.address.slice(0, 8)}… — ${data.trades.length} recent ${action ?? "trade"}(s)${data.has_more ? " (more available)" : ""}:\n${lines.join("\n")}`,
            content: data,
        });
        return undefined;
    },
    examples: [
        [
            { name: "user1", content: { text: "Show recent buys for ASVzakePP6GNg9r95d4LPZHJDMXun6L6E4um4pu5ybJk" } },
            { name: "assistant", content: { text: "Here are the recent buys..." } },
        ],
    ],
};
