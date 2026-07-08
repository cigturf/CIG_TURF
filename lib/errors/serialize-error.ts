type ErrorLike = {
  message?: unknown;
  error?: unknown;
  description?: unknown;
  statusCode?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

export function serializeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const row = error as ErrorLike;

    if (typeof row.message === "string" && row.message.trim()) {
      return row.message;
    }

    const nested = row.error;
    if (nested && typeof nested === "object") {
      const nestedRow = nested as ErrorLike;
      if (typeof nestedRow.description === "string" && nestedRow.description.trim()) {
        return nestedRow.description;
      }
      if (typeof nestedRow.message === "string" && nestedRow.message.trim()) {
        return nestedRow.message;
      }
    }

    if (typeof row.description === "string" && row.description.trim()) {
      return row.description;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "[unserializable error]";
    }
  }

  return String(error);
}

export function serializeUnknownErrorDetails(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    return error;
  }

  return { value: String(error) };
}
