/**
 * POST /api/kitchen/auth
 *
 * Validates a kitchen PIN and returns a session token.
 * PIN is stored in env var KITCHEN_PIN (default: "2025" for testing).
 * Upgrade path: validate against kitchen_access table with per-location PINs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`kitchen_auth:${clientIp}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rl.success) return rateLimitResponse(rl);

  let body: { pin?: string; locationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Datos inválidos" },
      { status: 400 },
    );
  }

  const { pin, locationId } = body;
  if (!pin || !locationId) {
    return NextResponse.json(
      { success: false, error: "PIN y ubicación son requeridos" },
      { status: 400 },
    );
  }

  // Validate PIN — check env var first, then try per-location PINs in DB
  const globalPin = process.env.KITCHEN_PIN || "2025";
  let valid = pin === globalPin;

  if (!valid) {
    // Try per-location PIN from kitchen_access table (if it exists)
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from("kitchen_access")
        .select("pin_hash")
        .eq("location_id", locationId)
        .eq("is_active", true)
        .maybeSingle();

      if (data?.pin_hash === pin) {
        valid = true;
      }
    } catch {
      // Table doesn't exist yet — fall through to global PIN only
    }
  }

  if (!valid) {
    return NextResponse.json(
      { success: false, error: "PIN incorrecto" },
      { status: 401 },
    );
  }

  // Validate location exists
  try {
    const supabase = createServiceClient();
    const { data: location } = await supabase
      .from("locations")
      .select("id, name")
      .eq("id", locationId)
      .eq("is_active", true)
      .maybeSingle();

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Ubicación no encontrada" },
        { status: 404 },
      );
    }

    // Generate a simple session token (24h expiry)
    const token = Buffer.from(
      JSON.stringify({
        locationId,
        locationName: location.name,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      }),
    ).toString("base64url");

    return NextResponse.json({
      success: true,
      token,
      location: { id: location.id, name: location.name },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error de servidor" },
      { status: 500 },
    );
  }
}
