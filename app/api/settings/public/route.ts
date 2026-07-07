import { API_CACHE_SECONDS } from "@/config/cache.config";
import { jsonWithPublicCache } from "@/lib/api/cache-response";
import { SettingsService } from "@/server/settings/settings.service";

/** Public read-only business settings for customer pages and client hooks. */
export async function GET() {
  const settings = await SettingsService.getPublic();
  return jsonWithPublicCache({ settings }, API_CACHE_SECONDS.businessSettings);
}
