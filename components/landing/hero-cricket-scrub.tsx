"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

type HeroCricketScrubProps = {
  progress: MotionValue<number>;
};

/**
 * A bowled ball that travels, spins, and hits the stumps precisely as the
 * user scrolls through the hero — scroll position drives every value
 * directly (no timers, no on-view triggers), the same way the headline
 * reveal below it works.
 */
export function HeroCricketScrub({ progress }: HeroCricketScrubProps) {
  const ballLeft = useTransform(progress, [0.02, 0.22], ["4%", "88%"]);
  const ballTop = useTransform(progress, [0.02, 0.12, 0.22], ["24%", "13%", "22%"]);
  const ballRotate = useTransform(progress, [0.02, 0.22], [0, 900]);
  const ballOpacity = useTransform(progress, [0, 0.02, 0.2, 0.23], [0, 1, 1, 0]);

  const stumpsOpacity = useTransform(progress, [0.15, 0.19], [0, 1]);
  const stumpsShakeX = useTransform(
    progress,
    [0.22, 0.232, 0.244, 0.256, 0.27],
    [0, -4, 3, -1.5, 0],
  );

  const flashScale = useTransform(progress, [0.21, 0.23, 0.3], [0.4, 1.6, 1.9]);
  const flashOpacity = useTransform(progress, [0.21, 0.23, 0.3], [0, 0.55, 0]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6] overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        style={{ opacity: flashOpacity, scale: flashScale, left: "89%", top: "22%" }}
        className="bg-primary absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl sm:size-14"
      />

      <motion.div
        style={{ opacity: stumpsOpacity, x: stumpsShakeX, left: "89%", top: "22%" }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <svg width="34" height="46" viewBox="0 0 34 46" fill="none" className="sm:h-[54px] sm:w-10">
          <rect x="3" y="10" width="3.5" height="34" rx="1.5" fill="#f1e4c6" />
          <rect x="15.25" y="10" width="3.5" height="34" rx="1.5" fill="#f1e4c6" />
          <rect x="27.5" y="10" width="3.5" height="34" rx="1.5" fill="#f1e4c6" />
          <rect x="2" y="6" width="14" height="3" rx="1.5" fill="#d8c396" />
          <rect x="18" y="6" width="14" height="3" rx="1.5" fill="#d8c396" />
        </svg>
      </motion.div>

      <motion.div
        style={{ left: ballLeft, top: ballTop, rotate: ballRotate, opacity: ballOpacity }}
        className="absolute size-4 -translate-x-1/2 -translate-y-1/2 sm:size-5"
      >
        <svg viewBox="0 0 20 20" className="size-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          <circle cx="10" cy="10" r="9" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.6" />
          <path d="M10 1 Q14 10 10 19" stroke="#fef3c7" strokeWidth="0.9" fill="none" />
          <path d="M10 1 Q6 10 10 19" stroke="#fef3c7" strokeWidth="0.9" fill="none" />
        </svg>
      </motion.div>
    </div>
  );
}
