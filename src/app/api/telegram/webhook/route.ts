/**
 * Telegram Bot Webhook Handler
 *
 * Receives Telegram updates and processes bot commands.
 * All responses in Spanish for the El Salvador operations team.
 *
 * Commands:
 *   /pedidos   — Resumen de pedidos del dia
 *   /reservas  — Reservaciones de hoy + proximos 3 dias
 *   /ventas    — Reporte de ventas del dia
 *   /estado    — Estado del sistema
 *   /promo     — Crear codigo promocional
 *   /evento    — Crear evento
 *   /menu      — Link al menu
 *   /ayuda     — Lista de comandos
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegram } from "@/lib/telegram";
import { checkRateLimit } from "@/lib/rate-limit";
import { MENU_ITEMS } from "@/lib/data";
import { matchMenuItems } from "@/lib/menu-images";
import logger from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
}

interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://simmerdownsv.com";
const BOT_START_TIME = Date.now();

const LOCATION_SLUGS: Record<string, string> = {
  "santa-ana": "Santa Ana",
  "san-benito": "San Benito",
  "surf-city": "Surf City",
  "simmer-garden": "Simmer Garden",
  "lago-coatepeque": "Lago de Coatepeque",
  coatepeque: "Lago de Coatepeque",
  juayua: "Juayua",
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function getTodayStart(): string {
  const now = new Date();
  // El Salvador is UTC-6
  const svOffset = -6 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const svTime = new Date(utcMs + svOffset * 60000);
  const y = svTime.getFullYear();
  const m = String(svTime.getMonth() + 1).padStart(2, "0");
  const d = String(svTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getFutureDate(daysAhead: number): string {
  const now = new Date();
  const svOffset = -6 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const svTime = new Date(utcMs + svOffset * 60000);
  svTime.setDate(svTime.getDate() + daysAhead);
  const y = svTime.getFullYear();
  const m = String(svTime.getMonth() + 1).padStart(2, "0");
  const d = String(svTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*`\[\]]/g, "");
}

// ═══════════════════════════════════════════════════════════════
// Command Handlers
// ═══════════════════════════════════════════════════════════════

async function handlePedidos(chatId: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    const today = getTodayStart();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount, location_id, customer_name, order_type, created_at")
      .gte("created_at", `${today}T00:00:00-06:00`)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("[TelegramBot] Error fetching orders", error);
      await sendTelegram("Error al consultar pedidos. Intenta de nuevo.", chatId);
      return;
    }

    const orderList = orders || [];

    if (orderList.length === 0) {
      await sendTelegram("No hay pedidos hoy todavia.", chatId);
      return;
    }

    // Group by status
    const byStatus: Record<string, typeof orderList> = {};
    for (const o of orderList) {
      const status = (o.status as string) || "unknown";
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(o);
    }

    // Calculate totals
    const totalRevenue = orderList.reduce(
      (sum, o) => sum + (Number(o.total_amount) || 0),
      0,
    );

    // Get location names
    const locationIds = [...new Set(orderList.map((o) => o.location_id).filter(Boolean))];
    let locationMap: Record<string, string> = {};
    if (locationIds.length > 0) {
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name")
        .in("id", locationIds as string[]);
      if (locations) {
        locationMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));
      }
    }

    // Revenue by location
    const revenueByLocation: Record<string, number> = {};
    for (const o of orderList) {
      const locName = o.location_id ? (locationMap[o.location_id] || "Sin ubicacion") : "Sin ubicacion";
      revenueByLocation[locName] = (revenueByLocation[locName] || 0) + (Number(o.total_amount) || 0);
    }

    const statusLabels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "En preparacion",
      ready: "Listo",
      out_for_delivery: "En camino",
      completed: "Completado",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
      in_progress: "En progreso",
      delivered: "Entregado",
    };

    // Build message
    const lines: string[] = [
      `*PEDIDOS DE HOY* (${today})`,
      `Total: ${orderList.length} pedidos | $${totalRevenue.toFixed(2)}`,
      "",
    ];

    // Status breakdown
    for (const [status, items] of Object.entries(byStatus)) {
      const label = statusLabels[status] || status;
      const statusTotal = items.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      lines.push(`${label}: ${items.length} ($${statusTotal.toFixed(2)})`);
    }

    // Revenue by location
    lines.push("");
    lines.push("*Por ubicacion:*");
    for (const [loc, rev] of Object.entries(revenueByLocation)) {
      lines.push(`  ${loc}: $${rev.toFixed(2)}`);
    }

    // Pending orders that need attention
    const pending = byStatus["pending"] || [];
    if (pending.length > 0) {
      lines.push("");
      lines.push(`*${pending.length} pedidos pendientes:*`);
      for (const o of pending.slice(0, 10)) {
        const locName = o.location_id ? (locationMap[o.location_id] || "?") : "?";
        lines.push(
          `  #${o.order_number || o.id.slice(0, 8)} - ${escapeMarkdown(String(o.customer_name || ""))} - $${Number(o.total_amount).toFixed(2)} (${escapeMarkdown(locName)})`,
        );
      }
      if (pending.length > 10) {
        lines.push(`  ... y ${pending.length - 10} mas`);
      }
    }

    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handlePedidos error", err);
    await sendTelegram("Error interno al consultar pedidos.", chatId);
  }
}

async function handleReservas(chatId: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    const today = getTodayStart();
    const endDate = getFutureDate(3);

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("id, location_id, date, time, guest_count, customer_name, customer_phone, status")
      .gte("date", today)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      logger.error("[TelegramBot] Error fetching reservations", error);
      await sendTelegram("Error al consultar reservaciones. Intenta de nuevo.", chatId);
      return;
    }

    const resList = reservations || [];

    if (resList.length === 0) {
      await sendTelegram("No hay reservaciones para los proximos 3 dias.", chatId);
      return;
    }

    // Group by date
    const byDate: Record<string, typeof resList> = {};
    for (const r of resList) {
      const date = (r.date as string) || "Sin fecha";
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(r);
    }

    const lines: string[] = [
      `*RESERVACIONES* (${today} al ${endDate})`,
      `Total: ${resList.length} reservaciones`,
      "",
    ];

    for (const [date, items] of Object.entries(byDate)) {
      const totalGuests = items.reduce((s, r) => s + (Number(r.guest_count) || 0), 0);
      const isToday = date === today;
      lines.push(`*${isToday ? "HOY" : date}* - ${items.length} reservas, ${totalGuests} personas`);

      for (const r of items) {
        const locId = (r.location_id as string) || "";
        lines.push(
          `  ${r.time} | ${escapeMarkdown(String(r.customer_name || ""))} | ${r.guest_count} pers. | ${escapeMarkdown(String(locId))}`,
        );
      }
      lines.push("");
    }

    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handleReservas error", err);
    await sendTelegram("Error interno al consultar reservaciones.", chatId);
  }
}

async function handleVentas(chatId: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    const today = getTodayStart();

    // Today's orders
    const { data: todayOrders, error: todayErr } = await supabase
      .from("orders")
      .select("id, total_amount, location_id, status, created_at")
      .gte("created_at", `${today}T00:00:00-06:00`);

    if (todayErr) {
      logger.error("[TelegramBot] Error fetching today sales", todayErr);
      await sendTelegram("Error al consultar ventas. Intenta de nuevo.", chatId);
      return;
    }

    const orders = todayOrders || [];

    // Yesterday's orders for comparison
    const yesterday = getFutureDate(-1);
    const { data: yesterdayOrders } = await supabase
      .from("orders")
      .select("id, total_amount")
      .gte("created_at", `${yesterday}T00:00:00-06:00`)
      .lt("created_at", `${today}T00:00:00-06:00`);

    const yesterdayList = yesterdayOrders || [];

    // Revenue calculations
    const todayRevenue = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const yesterdayRevenue = yesterdayList.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const avgOrderValue = orders.length > 0 ? todayRevenue / orders.length : 0;

    // Revenue by location
    const locationIds = [...new Set(orders.map((o) => o.location_id).filter(Boolean))];
    let locationMap: Record<string, string> = {};
    if (locationIds.length > 0) {
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name")
        .in("id", locationIds as string[]);
      if (locations) {
        locationMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));
      }
    }

    const revenueByLocation: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      const locName = o.location_id ? (locationMap[o.location_id] || "Sin ubicacion") : "Sin ubicacion";
      if (!revenueByLocation[locName]) revenueByLocation[locName] = { count: 0, revenue: 0 };
      revenueByLocation[locName].count += 1;
      revenueByLocation[locName].revenue += Number(o.total_amount) || 0;
    }

    // Payment status — check payments table
    const orderIds = orders.map((o) => o.id);
    let paidCount = 0;
    let pendingPaymentCount = 0;

    if (orderIds.length > 0) {
      const { data: payments } = await supabase
        .from("payments")
        .select("order_id, status")
        .in("order_id", orderIds);

      const paymentsByOrder = new Set<string>();
      if (payments) {
        for (const p of payments) {
          if (p.status === "completed") paymentsByOrder.add(p.order_id as string);
        }
      }
      paidCount = paymentsByOrder.size;
      pendingPaymentCount = orders.length - paidCount;
    }

    // Build message
    const lines: string[] = [
      `*REPORTE DE VENTAS* (${today})`,
      "",
      `Pedidos hoy: ${orders.length}`,
      `Ingresos hoy: $${todayRevenue.toFixed(2)}`,
      `Ticket promedio: $${avgOrderValue.toFixed(2)}`,
      "",
    ];

    // Comparison with yesterday
    if (yesterdayList.length > 0) {
      const diff = todayRevenue - yesterdayRevenue;
      const diffPct = yesterdayRevenue > 0 ? ((diff / yesterdayRevenue) * 100).toFixed(1) : "N/A";
      const arrow = diff >= 0 ? "+" : "";
      lines.push(`vs. Ayer: $${yesterdayRevenue.toFixed(2)} (${yesterdayList.length} pedidos)`);
      lines.push(`Diferencia: ${arrow}$${diff.toFixed(2)} (${typeof diffPct === "string" ? diffPct : ""}%)`);
      lines.push("");
    }

    // Revenue by location
    lines.push("*Por ubicacion:*");
    for (const [loc, data] of Object.entries(revenueByLocation)) {
      lines.push(`  ${loc}: ${data.count} pedidos, $${data.revenue.toFixed(2)}`);
    }

    // Payment status
    lines.push("");
    lines.push("*Estado de pago:*");
    lines.push(`  Pagados: ${paidCount}`);
    lines.push(`  Pendientes: ${pendingPaymentCount}`);

    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handleVentas error", err);
    await sendTelegram("Error interno al consultar ventas.", chatId);
  }
}

async function handleEstado(chatId: string): Promise<void> {
  try {
    const supabase = createServiceClient();

    // Check Supabase connection
    let dbStatus = "OK";
    let lastOrderTime = "N/A";

    const { data: lastOrder, error: dbError } = await supabase
      .from("orders")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) {
      dbStatus = `Error: ${dbError.message}`;
    } else if (lastOrder) {
      lastOrderTime = new Date(lastOrder.created_at as string).toLocaleString("es-SV", {
        timeZone: "America/El_Salvador",
      });
    }

    const uptime = formatDuration(Date.now() - BOT_START_TIME);

    const lines = [
      "*ESTADO DEL SISTEMA*",
      "",
      `Base de datos: ${dbStatus}`,
      `Ultimo pedido: ${lastOrderTime}`,
      `Sitio web: ${SITE_URL}`,
      `Bot uptime: ${uptime}`,
      `Entorno: ${process.env.NODE_ENV || "production"}`,
    ];

    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handleEstado error", err);
    await sendTelegram("Error interno al consultar estado.", chatId);
  }
}

async function handlePromo(chatId: string, args: string): Promise<void> {
  try {
    if (!args.trim()) {
      await sendTelegram(
        "Uso: /promo CODIGO PORCENTAJE\nEjemplo: /promo VERANO20 20\nEjemplo: /promo AMIGO5 $5",
        chatId,
      );
      return;
    }

    const parts = args.trim().split(/\s+/);
    if (parts.length < 2) {
      await sendTelegram(
        "Formato invalido. Uso: /promo CODIGO VALOR\nEjemplo: /promo VERANO20 20 (20% desc)\nEjemplo: /promo AMIGO5 $5 ($5 desc)",
        chatId,
      );
      return;
    }

    const code = parts[0].toUpperCase();
    const valueRaw = parts[1];

    let discountType: "percent" | "fixed";
    let discountValue: number;

    if (valueRaw.startsWith("$")) {
      discountType = "fixed";
      discountValue = parseFloat(valueRaw.slice(1));
    } else {
      discountType = "percent";
      discountValue = parseFloat(valueRaw);
    }

    if (isNaN(discountValue) || discountValue <= 0) {
      await sendTelegram("Valor de descuento invalido. Debe ser un numero positivo.", chatId);
      return;
    }

    if (discountType === "percent" && discountValue > 100) {
      await sendTelegram("El porcentaje no puede ser mayor a 100.", chatId);
      return;
    }

    // Code format validation
    if (!/^[A-Z0-9_-]{2,30}$/.test(code)) {
      await sendTelegram("Codigo invalido. Usa solo letras, numeros, guiones. 2-30 caracteres.", chatId);
      return;
    }

    const supabase = createServiceClient();

    // Check if code already exists
    const { data: existing } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existing) {
      await sendTelegram(`El codigo "${code}" ya existe. Usa otro nombre.`, chatId);
      return;
    }

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .insert([
        {
          code,
          discount_type: discountType,
          discount_value: discountValue,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          description:
            discountType === "percent"
              ? `${discountValue}% de descuento`
              : `$${discountValue.toFixed(2)} de descuento`,
        },
      ])
      .select("id, code, discount_type, discount_value, expires_at")
      .single();

    if (error) {
      logger.error("[TelegramBot] Error creating promo code", error);
      await sendTelegram(`Error al crear codigo: ${error.message}`, chatId);
      return;
    }

    const discountLabel =
      discountType === "percent"
        ? `${discountValue}%`
        : `$${discountValue.toFixed(2)}`;

    const lines = [
      "*CODIGO PROMOCIONAL CREADO*",
      "",
      `Codigo: ${promo.code}`,
      `Descuento: ${discountLabel}`,
      `Tipo: ${discountType === "percent" ? "Porcentaje" : "Monto fijo"}`,
      `Vence: ${expiresAt.toLocaleDateString("es-SV")}`,
      "",
      "Activo y listo para usar.",
    ];

    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handlePromo error", err);
    await sendTelegram("Error interno al crear codigo promocional.", chatId);
  }
}

async function handleEvento(chatId: string, args: string): Promise<void> {
  try {
    if (!args.trim()) {
      await sendTelegram(
        "Uso: /evento TITULO | UBICACION | FECHA HORA | DESCRIPCION\nEjemplo: /evento Noche de Jazz | san-benito | 2026-06-20 19:00 | Musica en vivo con pizza",
        chatId,
      );
      return;
    }

    const parts = args.split("|").map((p) => p.trim());
    if (parts.length < 3) {
      await sendTelegram(
        "Formato invalido. Se necesitan al menos 3 campos separados por |.\nUso: /evento TITULO | UBICACION | FECHA HORA | DESCRIPCION",
        chatId,
      );
      return;
    }

    const title = parts[0];
    const locationInput = parts[1].toLowerCase().trim();
    const dateTimeRaw = parts[2];
    const description = parts[3] || null;

    if (!title || title.length < 2) {
      await sendTelegram("El titulo debe tener al menos 2 caracteres.", chatId);
      return;
    }

    const locationName = LOCATION_SLUGS[locationInput] || parts[1];

    // Parse date and time
    const dateTimeParts = dateTimeRaw.split(/\s+/);
    const eventDate = dateTimeParts[0] || dateTimeRaw;
    const eventTime = dateTimeParts[1] || "19:00";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      await sendTelegram("Formato de fecha invalido. Usa: YYYY-MM-DD (ej: 2026-06-20)", chatId);
      return;
    }

    const supabase = createServiceClient();

    // Look up location UUID by name match
    let locationUuid: string | null = null;
    if (locationName) {
      const { data: loc } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", `%${locationName}%`)
        .limit(1)
        .maybeSingle();
      locationUuid = loc?.id ?? null;
    }

    // Build starts_at timestamp (El Salvador UTC-6)
    const startsAt = `${eventDate}T${eventTime}:00-06:00`;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80)
      + "-" + Date.now().toString(36);

    const insertData: Record<string, unknown> = {
      title,
      title_es: title,
      slug,
      description,
      description_es: description,
      starts_at: startsAt,
      custom_venue: locationUuid ? null : locationName,
      is_published: true,
      is_featured: false,
    };

    if (locationUuid) {
      insertData.location_id = locationUuid;
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert([insertData])
      .select("id, title, starts_at, custom_venue")
      .single();

    if (error) {
      logger.error("[TelegramBot] Error creating event", error);
      await sendTelegram(`Error al crear evento: ${error.message}`, chatId);
      return;
    }

    const lines = [
      "*EVENTO CREADO*",
      "",
      `Titulo: ${event.title}`,
      `Ubicacion: ${locationName}`,
      `Fecha: ${eventDate}`,
      `Hora: ${eventTime}`,
      description ? `Descripcion: ${description}` : "",
      "",
      `Publicado en el sitio web.`,
    ].filter(Boolean);

    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handleEvento error", err);
    await sendTelegram("Error interno al crear evento.", chatId);
  }
}

function handleMenu(chatId: string): Promise<void> {
  return sendTelegram(
    `*MENU SIMMER DOWN*\n\nVe nuestro menu completo aqui:\n${SITE_URL}/menu\n\nPide en linea:\n${SITE_URL}/carta`,
    chatId,
  ).then(() => undefined);
}

// ═══════════════════════════════════════════════════════════════
// /foto — photo upload: assign a dish photo to a menu item
// ═══════════════════════════════════════════════════════════════

const TELEGRAM_FILE_MAX_BYTES = 10 * 1024 * 1024;

async function handleFotosList(chatId: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("menu_image_overrides")
      .select("item_id");
    const overridden = new Set((data || []).map((r: { item_id: string }) => r.item_id));

    const missing = MENU_ITEMS.filter((i) => !i.image && !overridden.has(i.id));
    if (missing.length === 0) {
      await sendTelegram("Todos los platillos tienen foto. 🎉", chatId);
      return;
    }
    const lines = [
      `*PLATILLOS SIN FOTO (${missing.length})*`,
      "",
      ...missing.map((i) => `• ${i.nameEs} — \`${i.id}\``),
      "",
      "Para subir: envia la foto con el texto:",
      "`/foto nombre-del-platillo`",
    ];
    await sendTelegram(lines.join("\n"), chatId);
  } catch (err) {
    logger.error("[TelegramBot] handleFotosList error", err);
    await sendTelegram("Error al consultar fotos faltantes.", chatId);
  }
}

async function handleFotoUpload(
  photo: TelegramPhotoSize[],
  caption: string,
  chatId: string,
): Promise<void> {
  try {
    const query = caption.replace(/^\/foto(@\S+)?\s*/i, "").trim();
    if (!query) {
      await sendTelegram(
        "Falta el nombre del platillo.\nEnvia la foto con el texto: `/foto casanova` o `/foto leche-tigra`\nUsa /fotos para ver la lista.",
        chatId,
      );
      return;
    }

    const matches = matchMenuItems(query);
    if (matches.length === 0) {
      await sendTelegram(
        `No encontre ningun platillo para "${query}".\nUsa /fotos para ver los nombres validos.`,
        chatId,
      );
      return;
    }
    if (matches.length > 1) {
      await sendTelegram(
        `"${query}" coincide con varios platillos:\n${matches
          .slice(0, 6)
          .map((m) => `• ${m.nameEs} — \`${m.id}\``)
          .join("\n")}\n\nRepite con el id exacto.`,
        chatId,
      );
      return;
    }
    const item = matches[0];

    // Largest photo size Telegram provides
    const best = photo.reduce((a, b) =>
      (b.file_size || 0) > (a.file_size || 0) ? b : a,
    );
    if ((best.file_size || 0) > TELEGRAM_FILE_MAX_BYTES) {
      await sendTelegram("La foto es demasiado grande (max 10MB).", chatId);
      return;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) {
      await sendTelegram("Bot no configurado para descargas.", chatId);
      return;
    }

    // Resolve file path, then download
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(best.file_id)}`,
    );
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) {
      await sendTelegram("No pude descargar la foto de Telegram.", chatId);
      return;
    }
    const dl = await fetch(
      `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`,
    );
    if (!dl.ok) {
      await sendTelegram("Fallo la descarga de la foto.", chatId);
      return;
    }
    const bytes = Buffer.from(await dl.arrayBuffer());

    // Upload to Supabase storage
    const supabase = createServiceClient();
    const path = `menu-overrides/${item.id}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("menu-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (upErr) {
      logger.error("[TelegramBot] Storage upload failed", upErr);
      await sendTelegram("Error al guardar la foto en el servidor.", chatId);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("menu-images").getPublicUrl(path);

    // Point the menu item at the new photo
    const { error: dbErr } = await supabase
      .from("menu_image_overrides")
      .upsert(
        {
          item_id: item.id,
          image_url: publicUrl,
          updated_by: "telegram",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "item_id" },
      );
    if (dbErr) {
      logger.error("[TelegramBot] Override upsert failed", dbErr);
      await sendTelegram("Foto subida pero no pude asignarla al platillo.", chatId);
      return;
    }

    await sendTelegram(
      `✅ Foto asignada a *${item.nameEs}*.\nVisible en ${SITE_URL}/carta en ~1 minuto.`,
      chatId,
    );
  } catch (err) {
    logger.error("[TelegramBot] handleFotoUpload error", err);
    await sendTelegram("Error interno al procesar la foto.", chatId);
  }
}

function handleAyuda(chatId: string): Promise<void> {
  const lines = [
    "*COMANDOS DISPONIBLES*",
    "",
    "/pedidos - Resumen de pedidos del dia",
    "/reservas - Reservaciones proximas (3 dias)",
    "/ventas - Reporte de ventas del dia",
    "/estado - Estado del sistema",
    "/promo CODIGO VALOR - Crear codigo promo",
    "  Ej: /promo VERANO20 20 (20%)",
    "  Ej: /promo AMIGO5 $5 ($5 fijo)",
    "/evento TITULO | UBICACION | FECHA HORA | DESC",
    "  Ej: /evento Jazz Night | san-benito | 2026-06-20 19:00 | Musica en vivo",
    "/menu - Link al menu",
    "/fotos - Platillos sin foto",
    "/foto - Subir foto de platillo (adjunta imagen + `/foto nombre`)",
    "/ayuda - Esta lista de comandos",
    "",
    `Ubicaciones validas: ${Object.keys(LOCATION_SLUGS).join(", ")}`,
  ];

  return sendTelegram(lines.join("\n"), chatId).then(() => undefined);
}

// ═══════════════════════════════════════════════════════════════
// Command Router
// ═══════════════════════════════════════════════════════════════

async function routeCommand(
  command: string,
  args: string,
  chatId: string,
): Promise<void> {
  switch (command) {
    case "/pedidos":
      await handlePedidos(chatId);
      break;
    case "/reservas":
      await handleReservas(chatId);
      break;
    case "/ventas":
      await handleVentas(chatId);
      break;
    case "/estado":
      await handleEstado(chatId);
      break;
    case "/promo":
      await handlePromo(chatId, args);
      break;
    case "/evento":
      await handleEvento(chatId, args);
      break;
    case "/menu":
      await handleMenu(chatId);
      break;
    case "/fotos":
      await handleFotosList(chatId);
      break;
    case "/foto":
      await sendTelegram(
        "Para subir una foto: adjunta la imagen y escribe `/foto nombre-del-platillo` como descripcion de la foto.\nUsa /fotos para ver platillos sin foto.",
        chatId,
      );
      break;
    case "/ayuda":
    case "/help":
    case "/start":
      await handleAyuda(chatId);
      break;
    default:
      // Ignore unknown commands silently
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
// Webhook Handler
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse> {
  const endpoint = "/api/telegram/webhook";

  try {
    // Validate webhook secret — MANDATORY to prevent unauthorized command execution
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      logger.error("[TelegramBot] TELEGRAM_WEBHOOK_SECRET not set — rejecting all requests");
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token")?.trim();
    if (secretHeader !== webhookSecret) {
      logger.warn("[TelegramBot] Invalid webhook secret", {
        received: secretHeader ? "present-but-wrong" : "missing",
      });
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Parse the update
    let update: TelegramUpdate;
    try {
      update = (await request.json()) as TelegramUpdate;
    } catch {
      logger.warn("[TelegramBot] Invalid JSON body");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Validate update structure
    if (!update || typeof update.update_id !== "number") {
      logger.warn("[TelegramBot] Invalid update structure");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Only process messages (text commands or photos with caption)
    const message = update.message;
    if (!message || (!message.text && !message.photo)) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);

    // Security: Only respond to the configured chat — reject if TELEGRAM_CHAT_ID not set
    if (!ALLOWED_CHAT_ID || String(chatId) !== String(ALLOWED_CHAT_ID)) {
      logger.warn("[TelegramBot] Message from unauthorized chat", {
        chatId,
        chatType: message.chat.type,
      });
      return NextResponse.json({ ok: true });
    }

    // Rate limiting: 30 requests per minute per chat
    const rateLimit = checkRateLimit(`telegram:${chatId}`, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      logger.warn("[TelegramBot] Rate limited", { chatId });
      await sendTelegram("Demasiados comandos. Espera un momento.", chatId);
      return NextResponse.json({ ok: true });
    }

    // Photo message → /foto upload flow
    if (message.photo && message.photo.length > 0) {
      const caption = (message.caption || "").trim();
      const photos = message.photo;
      handleFotoUpload(photos, caption, chatId).catch((err) => {
        logger.error("[TelegramBot] Photo handler error", err);
      });
      return NextResponse.json({ ok: true });
    }

    // Extract command from message text
    const text = (message.text || "").trim();

    // Check for bot command entities
    const hasBotCommand = message.entities?.some(
      (e) => e.type === "bot_command" && e.offset === 0,
    );

    if (!hasBotCommand && !text.startsWith("/")) {
      // Not a command — ignore
      return NextResponse.json({ ok: true });
    }

    // Parse command and arguments
    // Handle "/command@BotName args" format common in groups
    const commandMatch = text.match(/^(\/\w+)(?:@\S+)?\s*([\s\S]*)/);
    if (!commandMatch) {
      return NextResponse.json({ ok: true });
    }

    const command = commandMatch[1].toLowerCase();
    const args = commandMatch[2] || "";

    logger.info("[TelegramBot] Command received", {
      command,
      chatId,
      from: message.from?.username || message.from?.first_name || "unknown",
    });

    // Route to handler — await to ensure errors are caught and logged
    try {
      await routeCommand(command, args, chatId);
    } catch (err) {
      logger.error("[TelegramBot] Command handler error", err, { command });
      // Try to notify the chat that something went wrong
      await sendTelegram(`Error al procesar el comando ${command}. Intenta de nuevo.`, chatId).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[TelegramBot] Webhook error", err);
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}

// No GET handler — don't expose command list publicly
