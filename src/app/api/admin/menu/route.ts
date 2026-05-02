/**
 * POST /api/admin/menu
 *
 * Staff-only. Create or update a menu item.
 * - No `id` in body → INSERT (create new item)
 * - `id` in body → UPDATE (modify existing item)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";

// ═══════════════════════════════════════════════════════════════
// Auth Helper
// ═══════════════════════════════════════════════════════════════

async function requireStaff(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: staff } = await supabase
      .from("staff")
      .select("id, role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    return !!staff && staff.is_active === true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

const menuItemSchema = z.object({
  id: z.string().uuid("ID de menú inválido").optional(),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .nullable()
    .optional(),
  price: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(99999, "El precio es demasiado alto"),
  category: z
    .string()
    .min(1, "La categoría es requerida")
    .max(100, "La categoría no puede exceder 100 caracteres"),
  image_url: z
    .string()
    .url("URL de imagen inválida")
    .max(500, "URL de imagen demasiado larga")
    .nullable()
    .optional(),
  available: z.boolean({
    error: "El campo disponible es requerido y debe ser verdadero o falso",
  }),
});

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface MenuItemResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    available: boolean | null;
    created_at: string | null;
  };
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
): Promise<NextResponse<MenuItemResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/admin/menu";

  logger.api.request(endpoint, "POST");

  // Auth check
  if (!(await requireStaff())) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "No tienes permisos para acceder a este recurso.",
      },
      { status: 401 },
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "JSON inválido",
        message: "El cuerpo de la solicitud debe ser JSON válido.",
      },
      { status: 400 },
    );
  }

  // Validate input
  const parsed = menuItemSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      {
        success: false,
        error: "Datos inválidos",
        message: firstError?.message ?? "Revisa los datos enviados.",
      },
      { status: 400 },
    );
  }

  const { id, name, description, price, category, image_url, available } =
    parsed.data;

  try {
    const supabase = createServiceClient();

    if (id) {
      // ── UPDATE existing item ──────────────────────────────
      const { data: existing, error: fetchError } = await supabase
        .from("menu_items")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !existing) {
        return NextResponse.json(
          {
            success: false,
            error: "Item no encontrado",
            message: "No se encontró un item de menú con ese ID.",
          },
          { status: 404 },
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from("menu_items")
        .update({
          name,
          description: description ?? null,
          price,
          category,
          image_url: image_url ?? null,
          available,
        })
        .eq("id", id)
        .select("id, name, description, price, category, image_url, available, created_at")
        .single();

      if (updateError) {
        logger.error("Failed to update menu item", updateError, { id });
        return NextResponse.json(
          {
            success: false,
            error: "Error al actualizar",
            message: "No se pudo actualizar el item. Intenta de nuevo.",
          },
          { status: 500 },
        );
      }

      const duration = Date.now() - startTime;
      logger.api.response(endpoint, 200, duration, {
        action: "update",
        itemId: id,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Item de menú actualizado exitosamente.",
      });
    } else {
      // ── CREATE new item ───────────────────────────────────
      const { data: created, error: insertError } = await supabase
        .from("menu_items")
        .insert({
          name,
          description: description ?? null,
          price,
          category,
          image_url: image_url ?? null,
          available,
        })
        .select("id, name, description, price, category, image_url, available, created_at")
        .single();

      if (insertError) {
        logger.error("Failed to create menu item", insertError);
        return NextResponse.json(
          {
            success: false,
            error: "Error al crear",
            message: "No se pudo crear el item. Intenta de nuevo.",
          },
          { status: 500 },
        );
      }

      const duration = Date.now() - startTime;
      logger.api.response(endpoint, 201, duration, {
        action: "create",
        itemId: created.id,
      });

      return NextResponse.json(
        {
          success: true,
          data: created,
          message: "Item de menú creado exitosamente.",
        },
        { status: 201 },
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Error interno del servidor. Por favor intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}
