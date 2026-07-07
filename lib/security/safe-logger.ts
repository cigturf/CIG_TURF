const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|otp|authorization|api[_-]?key|razorpay|signature|cookie/i;

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

export function safeLogError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  const payload = metadata ? redactObject(metadata) : undefined;
  if (error instanceof Error) {
    console.error(`[${context}]`, error.message, payload ?? "");
    return;
  }
  console.error(`[${context}]`, redactValue(error), payload ?? "");
}
