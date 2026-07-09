import { describe, expect, it, vi, beforeEach } from "vitest";

import { runHealthCheck } from "@/lib/health/health-check";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

describe("runHealthCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports database ok when Supabase query succeeds even if Prisma fails", async () => {
    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: () => ({
        select: () => ({
          limit: async () => ({ error: null, data: [{ id: "default" }] }),
        }),
      }),
      storage: {
        from: () => ({
          list: async () => ({ error: null, data: [] }),
        }),
      },
    } as never);
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("pooler unavailable"));

    const result = await runHealthCheck();

    expect(result.checks.database).toBe("ok");
    expect(result.status).not.toBe("error");
  });

  it("reports database error when both Supabase and Prisma fail", async () => {
    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: () => ({
        select: () => ({
          limit: async () => ({ error: { message: "db down" }, data: null }),
        }),
      }),
      storage: {
        from: () => ({
          list: async () => ({ error: null, data: [] }),
        }),
      },
    } as never);
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("pooler unavailable"));

    const result = await runHealthCheck();

    expect(result.checks.database).toBe("error");
    expect(result.status).toBe("error");
  });
});
