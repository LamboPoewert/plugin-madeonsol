import type { Plugin } from "@elizaos/core";
import { kolFeedAction } from "./actions/kol-feed.js";
import { kolCoordinationAction } from "./actions/kol-coordination.js";
import { kolLeaderboardAction } from "./actions/kol-leaderboard.js";
import { deployerAlertsAction } from "./actions/deployer-alerts.js";
/** Key used to store the initialized client on the runtime */
export declare const MADEONSOL_CLIENT_KEY = "madeonsol:client";
export declare const madeOnSolPlugin: Plugin;
export default madeOnSolPlugin;
export { MadeOnSolClient } from "./client.js";
export { kolFeedAction, kolCoordinationAction, kolLeaderboardAction, deployerAlertsAction };
