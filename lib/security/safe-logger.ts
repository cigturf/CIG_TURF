import { getAppEnvironment } from "@/config/runtime.config";

const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|otp|authorization|api[_-]?key|razorpay|signature|cookie|dsn/i;

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 120) return `${value.slice(0, 8)}…[redacted]`;
    return value;
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === "object") return redactObject(value as Record<string, unknown>);
  return value;
}

function redactObject(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : redactValue(value);
  }
  return output;
}

type LogLevel = "info" | "warn" | "error";

function writeStructuredLog(
  level: LogLevel,
  context: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const payload = {
    level,
    context,
    message,
    environment: getAppEnvironment(),
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata: redactObject(metadata) } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function safeLogError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  writeStructuredLog("error", context, message, {
    ...metadata,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

export function safeLogWarn(context: string, message: string, metadata?: Record<string, unknown>) {
  writeStructuredLog("warn", context, message, metadata);
}

export function safeLogInfo(context: string, message: string, metadata?: Record<string, unknown>) {
  writeStructuredLog("info", context, message, metadata);
}

export { redactObject, redactValue };
