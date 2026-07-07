export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
    const { initErrorMonitoring } = await import("@/lib/monitoring/capture-error");
    await initErrorMonitoring();
  }
}
