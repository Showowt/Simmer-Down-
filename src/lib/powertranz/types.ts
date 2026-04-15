/**
 * Powertranz (FAC / BAC Credomatic) API types.
 *
 * Based on the "3D-Secure con SPI" Simplified Payment Integration spec.
 * Endpoints: /api/spi/sale, /api/spi/auth, /api/spi/riskmgmt, /api/spi/payment,
 *            /api/capture, /api/refund, /api/void
 */

// ──────────────────────────────────────────────────────────────
// ISO response codes we care about
// ──────────────────────────────────────────────────────────────
export type IsoResponseCode =
  | "00" // Approved
  | "SP1" // Card not 3DS-eligible; processed without authentication
  | "SP4" // SPI preprocessing complete (proceed to iframe)
  | "3D0" // 3DS complete — OK
  | "3D1" // 3DS complete — failed
  | string;

export type AuthenticationStatus =
  | "Y" // fully authenticated
  | "A" // attempted
  | "N" // not authenticated
  | "U" // unable to perform authentication
  | "R" // rejected
  | string;

// ──────────────────────────────────────────────────────────────
// Request types
// ──────────────────────────────────────────────────────────────
export interface CardSource {
  CardPan: string;
  CardCvv: string;
  /** Format: YYMM (e.g. "2310" = October 2023) */
  CardExpiration: string;
  CardholderName: string;
}

export interface BillingAddress {
  FirstName?: string;
  LastName?: string;
  Line1?: string;
  Line2?: string;
  City?: string;
  State?: string;
  PostalCode?: string;
  /** ISO 3166-1 alpha-2 */
  CountryCode?: string;
  EmailAddress?: string;
  PhoneNumber?: string;
}

export interface ThreeDSecureExtended {
  /** 01–05, window size for challenge page */
  ChallengeWindowSize?: number;
  /** "01" = no preference, "04" = challenge mandated */
  ChallengeIndicator?: string;
}

export interface ExtendedData {
  ThreeDSecure?: ThreeDSecureExtended;
  MerchantResponseUrl: string;
}

export interface SaleRequest {
  /** Must be a unique GUID per transaction attempt. */
  TransactionIdentifier: string;
  /** Decimal. Smallest currency unit precision left to the gateway. */
  TotalAmount: number;
  /** ISO 4217 numeric. 840 = USD. */
  CurrencyCode: string;
  ThreeDSecure: boolean;
  Source: CardSource;
  OrderIdentifier: string;
  AddressMatch?: boolean;
  BillingAddress?: BillingAddress;
  ExtendedData?: ExtendedData;
}

// ──────────────────────────────────────────────────────────────
// Response types
// ──────────────────────────────────────────────────────────────
export interface ThreeDSecureResult {
  Eci?: string;
  Xid?: string;
  Cavv?: string;
  AuthenticationStatus?: AuthenticationStatus;
  ProtocolVersion?: string;
  FingerprintIndicator?: string;
  DsTransId?: string;
  ResponseCode?: string;
  CardholderInfo?: string;
}

export interface RiskManagement {
  ThreeDSecure?: ThreeDSecureResult;
}

export interface SaleResponse {
  TransactionType?: number;
  Approved: boolean;
  TransactionIdentifier?: string;
  TotalAmount?: number;
  CurrencyCode?: string;
  CardBrand?: string;
  IsoResponseCode: IsoResponseCode;
  ResponseMessage: string;
  OrderIdentifier?: string;
  RedirectData?: string;
  SpiToken?: string;
  AuthorizationCode?: string;
  RRN?: string;
  PanToken?: string;
  RiskManagement?: RiskManagement;
  Errors?: Array<{ Code: string; Message: string }>;
}

export type PaymentResponse = SaleResponse;

// ──────────────────────────────────────────────────────────────
// Callback form (Powertranz → MerchantResponseUrl)
//
// Arrives form-encoded inside the iframe. Powertranz POSTs a single
// "Response" field containing URL-encoded JSON of the same SaleResponse
// shape. We parse & normalize it in `/api/payments/callback`.
// ──────────────────────────────────────────────────────────────
export interface CallbackForm {
  SpiToken?: string;
  Response?: string;
}
