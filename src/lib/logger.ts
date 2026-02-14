/**
 * Logger Utility for Simmer Down
 * Production: only errors | Development: all logs
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === "development";

function formatMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.info(formatMessage("info", message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.warn(formatMessage("warn", message, context));
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    // Always log errors in all environments
    const errorDetails =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { raw: error };

    console.error(
      formatMessage("error", message, { ...context, error: errorDetails }),
    );
  },

  // API-specific logging helpers
  api: {
    request(endpoint: string, method: string, context?: LogContext): void {
      if (isDevelopment) {
        console.log(
          formatMessage("info", `API Request: ${method} ${endpoint}`, context),
        );
      }
    },

    response(
      endpoint: string,
      status: number,
      durationMs: number,
      context?: LogContext,
    ): void {
      if (isDevelopment) {
        console.log(
          formatMessage(
            "info",
            `API Response: ${endpoint} ${status} (${durationMs}ms)`,
            context,
          ),
        );
      }
    },

    error(
      endpoint: string,
      error: Error | unknown,
      context?: LogContext,
    ): void {
      const errorDetails =
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { raw: error };

      console.error(
        formatMessage("error", `API Error: ${endpoint}`, {
          ...context,
          error: errorDetails,
        }),
      );
    },
  },
};

export default logger;
