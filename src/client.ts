/**
 * MadeOnSol x402 API client.
 * Uses @x402/fetch to automatically handle 402 → sign USDC → retry flow.
 */

const DEFAULT_BASE = "https://madeonsol.com";

export interface MadeOnSolClientOptions {
  baseUrl?: string;
  /**
   * A fetch function that handles x402 payments automatically.
   * Created via wrapFetchWithPayment() from @x402/fetch.
   * If not provided, uses plain fetch (requests will return 402).
   */
  fetchFn?: typeof fetch;
}

export class MadeOnSolClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: MadeOnSolClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE;
    this.fetchFn = options.fetchFn || globalThis.fetch;
  }

  async query<T = unknown>(path: string, params?: Record<string, string | undefined>): Promise<{ data?: T; error?: string; status: number }> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, v);
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

    const data = await res.json() as T;
    return { data, status: res.status };
  }

  getKolFeed(params?: { limit?: string; action?: string; kol?: string }) {
    return this.query("/api/x402/kol/feed", params);
  }

  getKolCoordination(params?: { period?: string; min_kols?: string; limit?: string }) {
    return this.query("/api/x402/kol/coordination", params);
  }

  getKolLeaderboard(params?: { period?: string; limit?: string }) {
    return this.query("/api/x402/kol/leaderboard", params);
  }

  getDeployerAlerts(params?: { since?: string; limit?: string; offset?: string }) {
    return this.query("/api/x402/deployer-hunter/alerts", params);
  }

  // ── Webhook management (requires RAPIDAPI_KEY) ──

  private rapidApiKey?: string;

  setRapidApiKey(key: string) {
    this.rapidApiKey = key;
  }

  private async restRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<{ data?: T; error?: string; status: number }> {
    if (!this.rapidApiKey) {
      return { error: "RAPIDAPI_KEY required for webhook/streaming features", status: 401 };
    }
    const res = await this.fetchFn(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": this.rapidApiKey,
        "x-rapidapi-host": "madeonsol-solana-kol-tracker-tools-api.p.rapidapi.com",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return { error: text, status: res.status };
    }
    return { data: await res.json() as T, status: res.status };
  }

  createWebhook(params: { url: string; events: string[]; filters?: Record<string, unknown> }) {
    return this.restRequest("POST", "/webhooks", params);
  }

  listWebhooks() {
    return this.restRequest("GET", "/webhooks");
  }

  deleteWebhook(id: number) {
    return this.restRequest("DELETE", `/webhooks/${id}`);
  }

  testWebhook(webhookId: number) {
    return this.restRequest("POST", "/webhooks/test", { webhook_id: webhookId });
  }

  getStreamToken() {
    return this.restRequest("POST", "/stream/token");
  }
}
