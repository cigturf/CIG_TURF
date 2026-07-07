import { API_CACHE_SECONDS } from "@/config/cache.config";
import { listActivePricingRules } from "@/features/pricing/services/pricing.repository";
import { buildPricingSnapshot } from "@/features/pricing/services/pricing-engine.service";
import { jsonWithPublicCache } from "@/lib/api/cache-response";

// Public endpoint (no auth): active rules only — read-only.
export async function GET() {
  const rules = await listActivePricingRules();
  const snapshot = buildPricingSnapshot(rules);

  return jsonWithPublicCache(
    {
      rules,
      defaultPrice: snapshot.defaultPrice,
    },
    API_CACHE_SECONDS.pricing,
  );
}
