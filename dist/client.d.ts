/**
 * MadeOnSol API client.
 * Two auth modes: MadeOnSol API key (`msk_`, recommended) or x402 micropayments.
 *
 * v1.0 breaking change: RapidAPI auth has been removed (marketplace retired 2026-04-19).
 * Get a free `msk_` key at https://madeonsol.com/pricing.
 */
export interface MadeOnSolClientOptions {
    baseUrl?: string;
    /** MadeOnSol API key — get one free at https://madeonsol.com/pricing. Preferred. */
    apiKey?: string;
    /** x402 payment-enabled fetch (for AI agents with SVM_PRIVATE_KEY). */
    fetchFn?: typeof fetch;
}
export interface RateLimitInfo {
    limit?: string;
    remaining?: string;
    reset?: string;
    requestId?: string;
}
export declare class MadeOnSolClient {
    private baseUrl;
    private fetchFn;
    private authMode;
    private authHeaders;
    /** Most recent rate-limit headers, populated by every request. */
    lastRateLimit: RateLimitInfo;
    constructor(options?: MadeOnSolClientOptions);
    private captureRateLimit;
    query<T = unknown>(path: string, params?: Record<string, string | undefined>): Promise<{
        data?: T;
        error?: string;
        status: number;
    }>;
    getKolFeed(params?: {
        limit?: string;
        before?: string;
        action?: string;
        kol?: string;
        min_sol?: string;
        token_age_max_min?: string;
        exclude_sells?: string;
        min_kol_winrate?: string;
        strategy?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolCoordination(params?: {
        period?: string;
        min_kols?: string;
        limit?: string;
        /** v1.1 — include WIF/BONK/POPCAT etc. ("true" | "false", default "false") */
        include_majors?: string;
        /** v1.1 — peak-density window in minutes (1-60, default 15) */
        window_minutes?: string;
        /** v1.1 — minimum composite coordination_score (0-100) */
        min_score?: string;
        min_avg_winrate?: string;
        unique_strategies?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolLeaderboard(params?: {
        period?: string;
        limit?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    /**
     * Get deployer alerts. The `tier` filter (elite/good/moderate/rising/cold)
     * is PRO/ULTRA only — BASIC callers passing it receive HTTP 403.
     * Cursor-paginated via `before` (preferred over `offset` at scale).
     */
    getDeployerAlerts(params?: {
        since?: string;
        before?: string;
        limit?: string;
        offset?: string;
        tier?: string;
        alert_type?: string;
        priority?: string;
        min_kol_buys?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolPairs(params?: {
        period?: string;
        min_shared?: string;
        limit?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolHotTokens(params?: {
        period?: string;
        min_kols?: string;
        limit?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolTrendingTokens(params?: {
        period?: string;
        min_kols?: string;
        limit?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolTokenEntryOrder(mint: string, params?: {
        limit?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolCompare(wallets: string[]): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolAlertsRecent(params?: {
        window?: string;
        types?: string;
        min_severity?: string;
        limit?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolPnl(wallet: string, params?: {
        period?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolTiming(wallet: string, params?: {
        period?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getDeployerTrajectory(wallet: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    private restRequest;
    createWebhook(params: {
        url: string;
        events: string[];
        filters?: Record<string, unknown>;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    listWebhooks(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    deleteWebhook(id: number): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    testWebhook(webhookId: number): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getStreamToken(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletTrackerWatchlist(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    addToWatchlist(walletAddress: string, label?: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    removeFromWatchlist(walletAddress: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletTrackerTrades(params?: {
        wallet?: string;
        action?: string;
        event_type?: string;
        limit?: string;
        before?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletStats(address: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletPnl(address: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletPositions(address: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletTrades(address: string, params?: {
        limit?: number;
        cursor?: string;
        action?: "buy" | "sell";
        token_mint?: string;
        since?: number;
        until?: number;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getWalletTrackerSummary(params?: {
        period?: string;
        wallet?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getAlphaLeaderboard(params?: {
        limit?: string;
        min_tokens?: string;
        min_pnl?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getAlphaWallet(wallet: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getAlphaLinked(wallet: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getTokenCapTable(mint: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getTokenBuyerQuality(mint: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    /** Bulk buyer-quality scoring for up to 50 mints. Shares the single-mint 5-min LRU cache. */
    getTokenBuyerQualityBatch(mints: string[]): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    /** Comprehensive per-mint snapshot: price, MC, volume, deployer, KOL activity, age, blacklist. */
    getToken(mint: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    /** Bulk lookup of up to 50 mints — same per-mint shape as getToken(). 10-20× cheaper than N sequential calls. */
    getTokenBatch(mints: string[]): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    copyTradeList(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    copyTradeCreate(params: {
        name: string;
        source_wallet: string;
        is_active?: boolean;
        webhook_url?: string;
        delivery?: "webhook" | "websocket" | "both";
        filters?: Record<string, unknown>;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    copyTradeGet(ruleId: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    copyTradeUpdate(ruleId: string, updates: Record<string, unknown>): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    copyTradeDelete(ruleId: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    coordinationAlertsList(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    coordinationAlertsCreate(params: {
        name?: string;
        min_kols?: number;
        window_minutes?: number;
        min_score?: number;
        include_majors?: boolean;
        cooldown_min?: number;
        score_jump_break?: number;
        delivery_mode?: "websocket" | "webhook" | "both";
        webhook_url?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    coordinationAlertsGet(ruleId: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    coordinationAlertsUpdate(ruleId: string, updates: Record<string, unknown>): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    coordinationAlertsDelete(ruleId: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    firstTouches(params?: {
        since?: string;
        before?: string;
        limit?: number;
        kol?: string;
        min_kol_winrate_7d?: number;
        min_scout_tier?: "S" | "A" | "B" | "C";
        min_n_touches?: number;
        strategy?: "scalper" | "day_trader" | "swing_trader" | "hodler" | "mixed";
        token_age_max_min?: number;
        min_first_buy_sol?: number;
        mint_suffix?: string;
        preset?: "scout" | "fresh_launch";
        include?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    firstTouchSubscriptionsList(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    firstTouchSubscriptionsCreate(params: {
        name?: string;
        filters?: {
            kol?: string;
            mint_suffix?: string;
            min_first_buy_sol?: number;
            min_scout_tier?: "S" | "A" | "B" | "C";
            min_n_touches?: number;
        };
        delivery_mode?: "websocket" | "webhook" | "both";
        webhook_url?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    firstTouchSubscriptionsGet(id: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    firstTouchSubscriptionsUpdate(id: string, updates: Record<string, unknown>): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    firstTouchSubscriptionsDelete(id: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    /** Get the authenticated caller's account, tier, and quota usage. */
    getMe(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    /**
     * List tokens with filters (mc band, liquidity, momentum, DEX, age, etc.).
     * Default `min_liq` is 2000 server-side. Returns up to ~50 tokens per call.
     */
    getTokensList(params?: {
        limit?: string;
        offset?: string;
        primary_dex?: string;
        min_mc?: string;
        max_mc?: string;
        min_liq?: string;
        max_age_min?: string;
        mc_change_1h_min_pct?: string;
        mc_change_1h_max_pct?: string;
        /** v1.10 — minimum liquidity-to-MC ratio (0-1). */
        min_liq_mc_ratio?: string;
        /** v1.10 — maximum liquidity-to-MC ratio (0-1). */
        max_liq_mc_ratio?: string;
        /** v1.10 — filter by deployer tier: "elite" | "good" | "moderate" | "rising" | "cold" | "unranked". */
        deployer_tier?: string;
        sort?: string;
        order?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    copyTradeSignals(params?: {
        rule_id?: string;
        limit?: string;
        since?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    priceAlertsList(): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    priceAlertsCreate(params: {
        token_mint: string;
        drop_pct: number;
        recovery_pct?: number;
        name?: string;
        delivery_mode?: "webhook" | "websocket" | "both";
        webhook_url?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    priceAlertsGet(id: number | string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    priceAlertsUpdate(id: number | string, updates: Record<string, unknown>): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    priceAlertsDelete(id: number | string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    priceAlertsEvents(params?: {
        alert_id?: number;
        event_type?: string;
        since?: string;
        limit?: number;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    scoutLeaderboard(params?: {
        limit?: number;
        scout_tier?: string;
        sort?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    coordinationHistory(params?: {
        limit?: number;
        since?: string;
        min_score?: number;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    kolConsensus(mint: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    peakHistory(mint: string): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
}
