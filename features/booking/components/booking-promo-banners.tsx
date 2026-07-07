"use client";

import Link from "next/link";

import { Text } from "@/components/design-system";
import { usePublicPromotions } from "@/features/promotions/hooks/use-public-promotions";

export function BookingPromoBanners() {
  const { data: promotions = [] } = usePublicPromotions("booking_page_banner");

  if (promotions.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {promotions.slice(0, 3).map((promo) => (
        <div
          key={promo.id}
          className="border-primary/20 bg-primary/5 flex flex-col gap-1 rounded-[var(--radius-lg)] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Text className="font-semibold">{promo.title}</Text>
            {promo.shortDescription ? (
              <Text size="sm" className="text-muted-foreground">
                {promo.shortDescription}
              </Text>
            ) : null}
          </div>
          {promo.ctaText && promo.ctaLink ? (
            <Link
              href={promo.ctaLink}
              className="text-primary text-sm font-medium hover:underline"
            >
              {promo.ctaText}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
