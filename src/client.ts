/**
 * MadeOnSol API client.
 * Supports 3 auth modes: API key (simplest), RapidAPI key, or x402 micropayments.
 */

const DEFAULT_BASE = "https://madeonsol.com";
const RAPIDAPI_HOST = "madeonsol-solana-kol-tracker-tools-api.p.rapidapi.com";

type AuthMode = "madeonsol" | "rapidapi" | "x402" | "none";

export interface MadeOnSolClientOptions {
  baseUrl?: string;
  /** MadeOnSol API key (get one free at madeonsol.com/developer). Preferred. */
  apiKey?: string;
  /** RapidAPI subscription key. */
  rapidApiKey?: string;
  /** x402 payment-enabled fetch (for AI agents with SVM_PRIVATE_KEY). */
  fetchFn?: typeof fetch;
}

export class MadeOnSolClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private authMode: AuthMode;
  private authHeaders: Record<string, string>;

  constructor(options: MadeOnSolClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE;
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.authHeaders = {};

    if (options.apiKey) {
      this.authMode = "madeonsol";
      this.authHeaders = { Authorization: `Bearer ${options.apiKey}` };
    } else if (options.rapidApiKey) {
      this.authMode = "rapidapi";
      this.authHeaders = { "x-rapidapi-key": options.rapidApiKey, "x-rapidapi-host": RAPIDAPI_HOST };
    } else if (options.fetchFn) {
      this.authMode = "x402";
    } else {
      this.authMode = "none";
    }
  }

  async query<T = unknown>(path: string, params?: Record<string, string | undefined>): Promise<{ data?: T; error?: string; status: number }> {
    const apiPath = this.authMode === "x402" || this.authMode === "none"
      ? path
      : path.replace("/api/x402/", "/api/v1/");
    const url = new URL(apiPath, this.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, v);
      }
    }

    const res = this.authMode === "x402"
      ? await this.fetchFn(url.toString(), { method: "GET" })
      : await this.fetchFn(url.toString(), { method: "GET", headers: this.authHeaders });

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

  // ── Webhook management (requires API key or RapidAPI key with Pro/Ultra) ──

  private async restRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<{ data?: T; error?: string; status: number }> {
    if (this.authMode !== "madeonsol" && this.authMode !== "rapidapi") {
      return { error: "API key or RapidAPI key required for webhook/streaming features. Get a free key at madeonsol.com/developer", status: 401 };
    }
    const res = await this.fetchFn(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.authHeaders,
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
