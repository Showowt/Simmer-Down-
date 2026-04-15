/**
 * Powertranz (FAC / BAC Credomatic) HTTP client.
 *
 * All outbound card data is scrubbed via `stripCardFields()` before any
 * logger call. The `ptSale`, `ptVoid`, `ptRefund` endpoints require
 * PowerTranz-PowerTranzId and PowerTranz-PowerTranzPassword headers.
 * The `/spi/payment` endpoint does NOT require those headers — it is
 * authenticated by the short-lived SpiToken alone (5-min TTL).
 */

import logger from "@/lib/logger";
import { stripCardFields } from "./sanitize";
import type { SaleRequest, SaleResponse, PaymentResponse } from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;

export class PowertranzError extends Error {
  constructor(
    message: string,
    public httpStatus: number,
    public isoResponseCode?: string,
    public responseBody?: unknown,
  ) {
    super(message);
    this.name = "PowertranzError";
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var: ${name}. Check .env.local or Vercel project settings.`,
    );
  }
  return v;
}

function apiRoot(): string {
  const root = requireEnv("FAC_API_ROOT").replace(/\/+$/, "");
  return root;
}

function authHeaders(): Record<string, string> {
  return {
    "PowerTranz-PowerTranzId": requireEnv("FAC_POWERTRANZ_ID"),
    "PowerTranz-PowerTranzPassword": requireEnv("FAC_POWERTRANZ_PASSWORD"),
  };
}

interface PtCallOptions {
  path: string;
  body: unknown;
  includeAuth: boolean;
  stage: "sale" | "payment" | "void" | "refund";
}

async function ptCall<T>(opts: PtCallOptions): Promise<{
  status: number;
  body: T;
  raw: string;
}> {
  const url = `${apiRoot()}${opts.path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts.includeAuth) {
    Object.assign(headers, authHeaders());
  }

  const safeLogPayload = stripCardFields(opts.body);
  logger.api.request(opts.path, "POST", {
    stage: opts.stage,
    payload: safeLogPayload,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(opts.body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === "AbortError";
    throw new PowertranzError(
      isAbort
        ? `Powertranz request timed out after ${DEFAULT_TIMEOUT_MS}ms`
        : `Powertranz network error: ${err instanceof Error ? err.message : String(err)}`,
      0,
    );
  }
  clearTimeout(timer);

  const raw = await res.text();
  let body: T;
  try {
    body = raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    throw new PowertranzError(
      `Powertranz returned non-JSON body (status ${res.status})`,
      res.status,
      undefined,
      raw.slice(0, 500),
    );
  }

  logger.api.response(opts.path, res.status, 0, {
    stage: opts.stage,
    // The response may include PanToken etc. — still strip defensively.
    body: stripCardFields(body),
  });

  return { status: res.status, body, raw };
}

/**
 * Initiate a 3DS-enabled Sale.
 * Returns SpiToken + RedirectData (HTML) the client must render in an iframe.
 */
export async function ptSale(req: SaleRequest): Promise<SaleResponse> {
  const { body, status } = await ptCall<SaleResponse>({
    path: "/spi/sale",
    body: req,
    includeAuth: true,
    stage: "sale",
  });
  if (status >= 500) {
    throw new PowertranzError(
      `Powertranz /spi/sale returned ${status}`,
      status,
      body?.IsoResponseCode,
      body,
    );
  }
  return body;
}

/**
 * Finalize a previously-authenticated Sale.
 * Body is the SpiToken wrapped in JSON quotes (per spec).
 * Does NOT require PowerTranzId/Password headers.
 */
export async function ptPayment(spiToken: string): Promise<PaymentResponse> {
  const { body, status } = await ptCall<PaymentResponse>({
    path: "/spi/payment",
    // Spec: content is the SPI token as a JSON string.
    body: spiToken,
    includeAuth: false,
    stage: "payment",
  });
  if (status >= 500) {
    throw new PowertranzError(
      `Powertranz /spi/payment returned ${status}`,
      status,
      body?.IsoResponseCode,
      body,
    );
  }
  return body;
}

/**
 * Void an authorization (before capture / same business day).
 */
export async function ptVoid(params: {
  TransactionIdentifier: string;
}): Promise<SaleResponse> {
  const { body, status } = await ptCall<SaleResponse>({
    path: "/void",
    body: params,
    includeAuth: true,
    stage: "void",
  });
  if (status >= 500) {
    throw new PowertranzError(
      `Powertranz /void returned ${status}`,
      status,
      body?.IsoResponseCode,
      body,
    );
  }
  return body;
}

/**
 * Refund a settled/captured transaction.
 */
export async function ptRefund(params: {
  TransactionIdentifier: string;
  TotalAmount: number;
  CurrencyCode: string;
}): Promise<SaleResponse> {
  const { body, status } = await ptCall<SaleResponse>({
    path: "/refund",
    body: params,
    includeAuth: true,
    stage: "refund",
  });
  if (status >= 500) {
    throw new PowertranzError(
      `Powertranz /refund returned ${status}`,
      status,
      body?.IsoResponseCode,
      body,
    );
  }
  return body;
}
