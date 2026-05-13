/**
 * Zod Validation Schemas for Simmer Down API Routes
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// Phone number validation (El Salvador format)
// ═══════════════════════════════════════════════════════════════

// El Salvador phone formats: +503 XXXX-XXXX, 503XXXXXXXX, XXXX-XXXX, XXXXXXXX
const phoneRegex = /^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/;

export const phoneSchema = z
  .string()
  .min(8, "El teléfono debe tener al menos 8 dígitos")
  .max(20, "El teléfono es demasiado largo")
  .regex(
    phoneRegex,
    "Formato de teléfono inválido. Usa: XXXX-XXXX o +503 XXXX-XXXX",
  );

// ═══════════════════════════════════════════════════════════════
// Order Item Schema
// ═══════════════════════════════════════════════════════════════

export const orderItemSchema = z.object({
  id: z.string().min(1, "ID de item requerido"),
  name: z.string().min(1, "Nombre de item requerido"),
  quantity: z.number().int().min(1).max(99, "Cantidad máxima es 99"),
  price: z.number().min(0), // We'll validate against DB prices
  description: z.string().optional(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// ═══════════════════════════════════════════════════════════════
// Create Order Schema
// ═══════════════════════════════════════════════════════════════

export const createOrderSchema = z
  .object({
    locationId: z.string().min(1, "Ubicación requerida"),
    orderType: z.enum(["delivery", "pickup"]),
    customerName: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es demasiado largo"),
    customerPhone: phoneSchema,
    customerEmail: z
      .string()
      .email("Correo electrónico inválido")
      .optional()
      .nullable()
      .or(z.literal("")),
    deliveryAddress: z
      .string()
      .max(500, "Dirección demasiado larga")
      .optional()
      .nullable(),
    deliveryCity: z
      .string()
      .max(100, "Ciudad demasiado larga")
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(500, "Las notas son demasiado largas")
      .optional()
      .nullable(),
    promoCode: z
      .string()
      .max(50, "Código de promoción demasiado largo")
      .optional()
      .nullable(),
    items: z
      .array(orderItemSchema)
      .min(1, "El pedido debe tener al menos un item"),
  })
  .refine(
    (data) => {
      // If delivery, address is required
      if (data.orderType === "delivery") {
        return data.deliveryAddress && data.deliveryAddress.length >= 5;
      }
      return true;
    },
    {
      message: "La dirección es requerida para delivery",
      path: ["deliveryAddress"],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ═══════════════════════════════════════════════════════════════
// Sophia Chatbot Schema
// ═══════════════════════════════════════════════════════════════

export const sophiaMessageSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(500, "El mensaje es demasiado largo (máximo 500 caracteres)"),
  locationId: z
    .enum(["santa-ana", "san-benito", "la-majada", "lago-coatepeque"])
    .optional()
    .nullable(),
});

export type SophiaMessageInput = z.infer<typeof sophiaMessageSchema>;

// ═══════════════════════════════════════════════════════════════
// Anima Chatbot Schema
// ═══════════════════════════════════════════════════════════════

export const animaContextSchema = z.object({
  customerName: z.string().max(100).optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  loyaltyTier: z.string().max(20).optional().nullable(),
  loyaltyPoints: z.number().min(0).optional().nullable(),
  visitCount: z.number().min(0).optional().nullable(),
  favoriteItems: z.array(z.string()).max(10).optional().nullable(),
  dietaryPreferences: z.array(z.string()).max(5).optional().nullable(),
  cartItems: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }),
    )
    .max(20)
    .optional()
    .nullable(),
  currentTime: z.string(),
  dayOfWeek: z.string(),
  language: z.enum(["es", "en"]).optional().nullable(),
});

export const animaMessageSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(500, "El mensaje es demasiado largo (máximo 500 caracteres)"),
  context: animaContextSchema,
});

export type AnimaMessageInput = z.infer<typeof animaMessageSchema>;

// ═══════════════════════════════════════════════════════════════
// Contact Form Schema
// ═══════════════════════════════════════════════════════════════

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .max(255, "El correo es demasiado largo"),
  phone: z.string().max(20).optional().nullable().or(z.literal("")),
  reason: z
    .string()
    .min(1, "Por favor selecciona un motivo")
    .max(50, "Motivo inválido"),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "El mensaje es demasiado largo (máximo 2000 caracteres)"),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ═══════════════════════════════════════════════════════════════
// Reservation Form Schema
// ═══════════════════════════════════════════════════════════════

const VALID_LOCATION_IDS = [
  "santa-ana",
  "coatepeque",
  "san-benito",
  "juayua",
  "surf-city",
] as const;

export const reservationFormSchema = z
  .object({
    location_id: z.enum(VALID_LOCATION_IDS, {
      error: "Ubicación inválida / Invalid location",
    }),
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Formato de fecha inválido. Usa: YYYY-MM-DD",
      ),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido. Usa: HH:MM"),
    guest_count: z
      .number()
      .int()
      .min(1, "Mínimo 1 persona")
      .max(20, "Para grupos mayores a 20 personas, contáctanos directamente"),
    customer_name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es demasiado largo"),
    customer_phone: z
      .string()
      .min(7, "El teléfono debe tener al menos 7 dígitos")
      .max(20, "El teléfono es demasiado largo"),
    customer_email: z
      .string()
      .email("Correo electrónico inválido")
      .max(255)
      .optional()
      .nullable()
      .or(z.literal("")),
    special_requests: z
      .string()
      .max(1000, "Las solicitudes especiales son demasiado largas")
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // Ensure date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reservationDate = new Date(data.date + "T00:00:00");
      return reservationDate >= today;
    },
    {
      message:
        "No se pueden hacer reservaciones en fechas pasadas / Cannot book past dates",
      path: ["date"],
    },
  )
  .refine(
    (data) => {
      // Ensure date is not more than 30 days out
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      maxDate.setHours(23, 59, 59, 999);
      const reservationDate = new Date(data.date + "T00:00:00");
      return reservationDate <= maxDate;
    },
    {
      message:
        "Solo se permiten reservaciones hasta 30 días en el futuro / Max 30 days ahead",
      path: ["date"],
    },
  );

export type ReservationFormInput = z.infer<typeof reservationFormSchema>;

// ═══════════════════════════════════════════════════════════════
// Validation Error Response Helper
// ═══════════════════════════════════════════════════════════════

export interface ValidationError {
  field: string;
  message: string;
}

export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function validationErrorResponse(errors: ValidationError[]) {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Validation failed",
      message: "Por favor revisa los campos del formulario",
      errors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    },
  );
}
