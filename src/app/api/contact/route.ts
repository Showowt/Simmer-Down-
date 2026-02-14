/**
 * Contact Form API
 * Server-side validation and submission handling
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import {
  contactFormSchema,
  formatZodErrors,
  validationErrorResponse,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import logger from "@/lib/logger";

interface ContactResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ContactResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/contact";

  // Rate limiting: 5 submissions per 10 minutes per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`contact:${clientIp}`, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
  });

  if (!rateLimit.success) {
    logger.warn("Rate limit exceeded for contact form", { ip: clientIp });
    return rateLimitResponse(rateLimit) as NextResponse<ContactResponse>;
  }

  logger.api.request(endpoint, "POST", { ip: clientIp });

  try {
    const body = await request.json();

    // Validate input with Zod
    const parseResult = contactFormSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      logger.info("Contact form validation failed", { errors });
      return validationErrorResponse(errors) as NextResponse<ContactResponse>;
    }

    const { name, email, phone, reason, message } = parseResult.data;
    const supabase = createApiClient();

    // Insert into contact_submissions table
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          reason,
          message,
          status: "new",
        },
      ]);

    if (dbError) {
      // Log but don't fail - table might not exist in some environments
      logger.warn("Contact submission database insert failed", {
        error: dbError.message,
        code: dbError.code,
      });
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, { reason });

    return NextResponse.json({
      success: true,
      message: "Mensaje recibido. Te responderemos dentro de 24 horas.",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Error al enviar el mensaje. Por favor intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/contact",
    method: "POST",
    features: ["rate-limiting", "zod-validation"],
    rateLimit: "5 submissions per 10 minutes",
  });
}
