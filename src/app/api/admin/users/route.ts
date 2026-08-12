/**
 * Staff / dashboard-user management.
 *
 *   GET   — list all staff accounts
 *   POST  — create a new staff login (auth user + staff row)
 *   PATCH — activate/deactivate a staff account, or reset its password
 *
 * Auth: caller must be a logged-in admin (profiles.role='admin'), same gate as
 * every other /api/admin route. All writes go through the service client:
 *  - staff RLS is own-row only, so listing/creating others needs service role;
 *  - creating the auth user needs the Admin API (service role).
 *
 * Access model (see sync_staff_access trigger): inserting/updating an ACTIVE
 * staff row with auth_user_id auto-upserts profiles.role='admin' and syncs
 * user_id↔auth_user_id. The trigger never DOWNGRADES, so deactivating a user
 * here also clears profiles.role to fully revoke page access.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const STAFF_ROLES = [
  "owner",
  "admin",
  "manager",
  "location_manager",
  "staff",
] as const;

/** Password rules mirror /auth/reset-password: 8+ chars, an uppercase, a digit. */
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Z]/, "Requiere una mayúscula")
  .regex(/\d/, "Requiere un número");

const CreateSchema = z.object({
  email: z.string().email().max(160),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(STAFF_ROLES),
  password: passwordSchema,
});

const PatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("toggle_active"),
    staffId: z.string().uuid(),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("reset_password"),
    staffId: z.string().uuid(),
    password: passwordSchema,
  }),
]);

interface AdminCaller {
  userId: string;
  email: string;
}

async function requireAdmin(): Promise<
  { ok: true; caller: AdminCaller } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "unauthorized", message: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "forbidden", message: "Requiere rol admin" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, caller: { userId: user.id, email: user.email || "admin" } };
}

// ── GET: list staff ───────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const service = createServiceClient();
    const { data, error } = await service
      .from("staff")
      .select(
        "id, email, first_name, last_name, phone, role, is_active, last_login_at, created_at",
      )
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("[AdminUsers] list failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar usuarios" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data, error: null, message: null });
  } catch (err) {
    logger.error("[AdminUsers] GET error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

// ── POST: create staff login ──────────────────────────────────
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const rl = checkRateLimit(`admin-users-create:${getClientIp(request)}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rl.success) return rateLimitResponse(rl);

    const parsed = CreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: "invalid_body",
          message: parsed.error.issues[0]?.message ?? "Datos inválidos",
        },
        { status: 400 },
      );
    }
    const b = parsed.data;
    const email = b.email.trim().toLowerCase();

    const service = createServiceClient();

    // 1) Create the auth user (email pre-confirmed — SV doesn't use email; the
    //    admin shares the temp password directly, user changes it in-app).
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email,
      password: b.password,
      email_confirm: true,
      user_metadata: { first_name: b.firstName, last_name: b.lastName },
    });
    if (createErr || !created?.user) {
      const already =
        createErr?.message?.toLowerCase().includes("already") ||
        createErr?.status === 422;
      logger.error("[AdminUsers] createUser failed", createErr);
      return NextResponse.json(
        {
          data: null,
          error: already ? "email_exists" : "auth_error",
          message: already
            ? "Ya existe una cuenta con ese correo"
            : "No se pudo crear el usuario",
        },
        { status: already ? 409 : 500 },
      );
    }

    // 2) Insert the staff row. The sync_staff_access trigger syncs
    //    user_id↔auth_user_id and upserts profiles.role='admin'.
    const { error: staffErr } = await service.from("staff").insert({
      auth_user_id: created.user.id,
      email,
      first_name: b.firstName,
      last_name: b.lastName,
      phone: b.phone || null,
      role: b.role,
      is_active: true,
    });
    if (staffErr) {
      // Compensating action: don't leave an orphan auth user behind.
      await service.auth.admin.deleteUser(created.user.id).catch(() => {});
      logger.error("[AdminUsers] staff insert failed (auth user rolled back)", staffErr);
      return NextResponse.json(
        { data: null, error: "db_error", message: "No se pudo registrar el usuario" },
        { status: 500 },
      );
    }

    logger.info("[AdminUsers] created", { by: auth.caller.email, email, role: b.role });
    return NextResponse.json({
      data: { email, role: b.role },
      error: null,
      message: "Usuario creado",
    });
  } catch (err) {
    logger.error("[AdminUsers] POST error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

// ── PATCH: (de)activate or reset password ─────────────────────
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const rl = checkRateLimit(`admin-users-patch:${getClientIp(request)}`, {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.success) return rateLimitResponse(rl);

    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: "invalid_body",
          message: parsed.error.issues[0]?.message ?? "Datos inválidos",
        },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const service = createServiceClient();
    const { data: staff, error: findErr } = await service
      .from("staff")
      .select("id, auth_user_id, email")
      .eq("id", body.staffId)
      .maybeSingle();
    if (findErr || !staff) {
      return NextResponse.json(
        { data: null, error: "not_found", message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Guard against self-lockout: an admin can't disable their own access.
    if (
      body.action === "toggle_active" &&
      !body.isActive &&
      staff.auth_user_id === auth.caller.userId
    ) {
      return NextResponse.json(
        { data: null, error: "self_lockout", message: "No puedes desactivar tu propia cuenta" },
        { status: 400 },
      );
    }

    if (body.action === "toggle_active") {
      const { error: upErr } = await service
        .from("staff")
        .update({ is_active: body.isActive })
        .eq("id", staff.id);
      if (upErr) {
        logger.error("[AdminUsers] toggle failed", upErr);
        return NextResponse.json(
          { data: null, error: "db_error", message: "Error al actualizar" },
          { status: 500 },
        );
      }
      // Activating: the staff UPDATE trigger restores profiles.role='admin'.
      // Deactivating: the trigger never downgrades, so drop the admin role
      // explicitly to fully revoke /admin page access. 'user' is the non-admin
      // value allowed by profiles_role_check (admin|staff|user) — the
      // middleware/layout redirect anything != 'admin'.
      if (!body.isActive) {
        await service
          .from("profiles")
          .update({ role: "user" })
          .eq("id", staff.auth_user_id);
      }
      return NextResponse.json({
        data: { id: staff.id, isActive: body.isActive },
        error: null,
        message: body.isActive ? "Acceso activado" : "Acceso desactivado",
      });
    }

    // action === 'reset_password'
    const { error: pwErr } = await service.auth.admin.updateUserById(
      staff.auth_user_id,
      { password: body.password },
    );
    if (pwErr) {
      logger.error("[AdminUsers] password reset failed", pwErr);
      return NextResponse.json(
        { data: null, error: "auth_error", message: "No se pudo cambiar la contraseña" },
        { status: 500 },
      );
    }
    logger.info("[AdminUsers] password reset", { by: auth.caller.email, target: staff.email });
    return NextResponse.json({
      data: { id: staff.id },
      error: null,
      message: "Contraseña actualizada",
    });
  } catch (err) {
    logger.error("[AdminUsers] PATCH error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
