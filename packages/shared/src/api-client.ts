/**
 * ParentScript API client.
 *
 * Wraps the FastAPI backend at api.parentscript.app (or local in dev).
 * Auth uses the Supabase access token from the host app.
 */

import type { CoachingResponse } from "./types.js";

export interface ParentscriptApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
  fetch?: typeof fetch;
}

export class ParentscriptApiError extends Error {
  status: number;
  body?: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.name = "ParentscriptApiError";
    this.status = status;
    this.body = body;
  }
}

export class ParentscriptApiClient {
  private baseUrl: string;
  private getToken?: () => string | undefined | Promise<string | undefined>;
  private fetchImpl: typeof fetch;

  constructor(options: ParentscriptApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.parentscript.app";
    this.getToken = options.getToken;
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis);
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = this.getToken ? await this.getToken() : undefined;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * In-the-Moment coaching request — the core "parent in crisis" flow.
   * Routes through backend's safety-guard for crisis-response handling.
   */
  async coach(req: {
    situation: string;
    child_age_band?: string;
    locale?: string;
  }): Promise<CoachingResponse> {
    const auth = await this.authHeader();
    const res = await this.fetchImpl(`${this.baseUrl}/v1/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      throw new ParentscriptApiError(
        res.status,
        body?.error ?? `Coach request failed: ${res.status}`,
        body,
      );
    }
    return res.json();
  }
}