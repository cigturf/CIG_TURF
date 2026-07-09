export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  if ("code" in error && error.code === "23505") return true;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("unique") || message.includes("duplicate");
  }

  return false;
}
