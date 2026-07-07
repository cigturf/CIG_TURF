import { z } from "zod";

import { validationErrorResponse } from "@/lib/security/safe-error";

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: validationErrorResponse("Invalid request body"),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: validationErrorResponse(parsed.error.issues[0]?.message ?? "Invalid request"),
    };
  }

  return { success: true, data: parsed.data };
}
