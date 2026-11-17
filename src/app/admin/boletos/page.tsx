/**
 * /admin/boletos — door scanner for TicketManía tickets (staff only; gated by
 * the /admin middleware + layout). Camera scanning, entry counts per event and
 * a searchable guest list for tickets that won't scan.
 *
 * The camera needs `Permissions-Policy: camera=(self)`, which next.config.ts
 * sends for /admin and /auth only (the public site keeps camera=()).
 */

import type { Metadata } from "next";
import ScannerClient from "./ScannerClient";

export const metadata: Metadata = {
  title: "Escanear boletos",
  robots: { index: false, follow: false },
};

export default async function DoorScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string | string[] }>;
}) {
  const { event } = await searchParams;
  return <ScannerClient initialEventId={typeof event === "string" ? event : null} />;
}
