import type { ErrorResponse } from "../types/ynab.ts";

export class YnabApiError extends Error {
  constructor(
    public statusCode: number,
    public errorId: string,
    public errorName: string,
    public detail: string
  ) {
    super(`YNAB API Error (${statusCode}): ${detail}`);
    this.name = "YnabApiError";
  }
}

export interface ClientOptions {
  token: string;
  baseUrl?: string;
}

export class YnabClient {
  private token: string;
  private baseUrl: string;

  constructor(options: ClientOptions) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? "https://api.ynab.com/v1";
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: this.headers(),
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      let errorBody: ErrorResponse;
      try {
        errorBody = (await response.json()) as ErrorResponse;
      } catch {
        throw new YnabApiError(
          response.status,
          "unknown",
          "unknown",
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
      throw new YnabApiError(
        response.status,
        errorBody.error.id,
        errorBody.error.name,
        errorBody.error.detail
      );
    }

    // DELETE returns the deleted resource
    const json = await response.json();
    return (json as { data: T }).data;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    let queryString = "";
    if (params) {
      const filtered = Object.entries(params).filter(
        ([, v]) => v !== undefined
      );
      if (filtered.length > 0) {
        queryString = "?" + filtered.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
      }
    }
    return this.request<T>("GET", path + queryString);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

let _client: YnabClient | null = null;

export function getClient(): YnabClient {
  if (!_client) {
    throw new Error(
      "YNAB client not initialized. Set YNAB_TOKEN environment variable or use --token flag."
    );
  }
  return _client;
}

export function initClient(token: string, baseUrl?: string): YnabClient {
  _client = new YnabClient({ token, baseUrl });
  return _client;
}
