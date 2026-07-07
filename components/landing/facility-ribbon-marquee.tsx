"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import type { LandingFacility } from "@/features/landing";

type FacilityRibbonMarqueeProps = {
  facilities: LandingFacility[];
  icons: readonly LucideIcon[];
};

function FacilityRibbonItem({
  facility,
  Icon,
}: {
  facility: LandingFacility;
  Icon: LucideIcon;
}) {
  return (
    <div className="flex w-[7.25rem] shrink-0 flex-col items-center gap-1.5 px-1 py-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <p className="text-[0.65rem] leading-snug font-semibold tracking-wide text-white uppercase">
        {facility.title}
      </p>
    </div>
  );
}

export function FacilityRibbonMarquee({ facilities, icons }: FacilityRibbonMarqueeProps) {
  const reduced = useReducedMotion();
  const loop = [...facilities, ...facilities];

  if (facilities.length === 0) return null;

  if (reduced) {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {facilities.map((facility, index) => {
          const Icon = icons[index % icons.length]!;
          return <FacilityRibbonItem key={facility.id} facility={facility} Icon={Icon} />;
        })}
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max gap-2"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((facility, index) => {
          const Icon = icons[index % icons.length]!;
          return (
            <FacilityRibbonItem
              key={`${facility.id}-${index}`}
              facility={facility}
              Icon={Icon}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
