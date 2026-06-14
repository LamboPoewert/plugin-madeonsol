/**
 * MadeOnSol x402 API client.
 * Uses @x402/fetch to automatically handle 402 → sign USDC → retry flow.
 */
export interface MadeOnSolClientOptions {
    baseUrl?: string;
    /**
     * A fetch function that handles x402 payments automatically.
     * Created via wrapFetchWithPayment() from @x402/fetch.
     * If not provided, uses plain fetch (requests will return 402).
     */
    fetchFn?: typeof fetch;
}
export declare class MadeOnSolClient {
    private baseUrl;
    private fetchFn;
    constructor(options?: MadeOnSolClientOptions);
    query<T = unknown>(path: string, params?: Record<string, string | undefined>): Promise<{
        data?: T;
        error?: string;
        status: number;
    }>;
    getKolFeed(params?: {
        limit?: string;
        action?: string;
        kol?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
    getKolCoordination(params?: {
        period?: string;
        min_kols?: string;
        limit?: string;
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
    getDeployerAlerts(params?: {
        since?: string;
        limit?: string;
        offset?: string;
    }): Promise<{
        data?: unknown;
        error?: string;
        status: number;
    }>;
}
