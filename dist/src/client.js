/**
 * MadeOnSol x402 API client.
 * Uses @x402/fetch to automatically handle 402 → sign USDC → retry flow.
 */
const DEFAULT_BASE = "https://madeonsol.com";
export class MadeOnSolClient {
    baseUrl;
    fetchFn;
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || DEFAULT_BASE;
        this.fetchFn = options.fetchFn || globalThis.fetch;
    }
    async query(path, params) {
        const url = new URL(path, this.baseUrl);
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                if (v !== undefined)
                    url.searchParams.set(k, v);
            }
        }
        const res = await this.fetchFn(url.toString(), { method: "GET" });
        if (res.status === 402) {
            const body = await res.json();
            return { error: `Payment required: ${JSON.stringify(body.accepts?.[0] || body)}`, status: 402 };
        }
        if (!res.ok) {
            const text = await res.text().catch(() => "Unknown error");
            return { error: text, status: res.status };
        }
        const data = await res.json();
        return { data, status: res.status };
    }
    getKolFeed(params) {
        return this.query("/api/x402/kol/feed", params);
    }
    getKolCoordination(params) {
        return this.query("/api/x402/kol/coordination", params);
    }
    getKolLeaderboard(params) {
        return this.query("/api/x402/kol/leaderboard", params);
    }
    getDeployerAlerts(params) {
        return this.query("/api/x402/deployer-hunter/alerts", params);
    }
}
