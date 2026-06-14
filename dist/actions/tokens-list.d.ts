import type { Action } from "@elizaos/core";
/**
 * Scan the MadeOnSol token universe with MC, liquidity, momentum, and DEX filters.
 * Heuristics pulled from the user prompt: "high liquidity" → min_liq=10000,
 * "momentum"/"pumping" → mc_change_1h_min_pct=10, "pumpfun" → primary_dex=pumpfun.
 */
export declare const tokensListAction: Action;
