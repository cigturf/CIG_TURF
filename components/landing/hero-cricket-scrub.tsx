"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

type HeroCricketScrubProps = {
  progress: MotionValue<number>;
};

/**
 * A cinematic ball → bat → FOUR beat, entirely scroll-driven. No literal
 * figures (no illustrated bowler or crowd) — the "action" is told through
 * motion, a light-streak impact, and a scoreboard-style numeral, which reads
 * as premium sports broadcast graphics rather than hand-drawn animation.
 */
const T = {
  ballStart: 0.36,
  preContact: 0.44,
  contact: 0.47,
  fourPeak: 0.52,
  fourFadeEnd: 0.6,
};

// The whole beat stays in this upper strip of the hero, on purpose — it's
// clear of the headline on desktop (left-aligned, lower) and mobile
// (centered, lower still), on every viewport, without needing breakpoint
// logic for a set of plain motion-value positions.
const CONTACT_LEFT = "62%";
const CONTACT_TOP = "13%";

export function HeroCricketScrub({ progress }: HeroCricketScrubProps) {
  const ballLeft = useTransform(
    progress,
    [T.ballStart, T.contact, T.fourFadeEnd],
    ["6%", CONTACT_LEFT, "94%"],
  );
  const ballTop = useTransform(
    progress,
    [T.ballStart, T.preContact, T.contact, T.fourFadeEnd],
    ["16%", "20%", CONTACT_TOP, "2%"],
  );
  const ballRotate = useTransform(progress, [T.ballStart, T.fourFadeEnd], [0, 1080]);
  const ballOpacity = useTransform(
    progress,
    [T.ballStart - 0.02, T.ballStart, T.fourFadeEnd - 0.04, T.fourFadeEnd],
    [0, 1, 1, 0],
  );

  const batOpacity = useTransform(
    progress,
    [T.contact - 0.02, T.contact - 0.005, T.contact + 0.05],
    [0, 1, 0],
  );

  const swooshOpacity = useTransform(
    progress,
    [T.contact - 0.012, T.contact, T.contact + 0.05],
    [0, 1, 0],
  );
  const swooshScale = useTransform(progress, [T.contact - 0.012, T.contact + 0.05], [0.5, 1.4]);

  const burstOpacity = useTransform(
    progress,
    [T.contact, T.contact + 0.03, T.fourFadeEnd],
    [0, 0.55, 0],
  );
  const burstScale = useTransform(progress, [T.contact, T.fourFadeEnd], [0.3, 2.4]);

  const fourOpacity = useTransform(
    progress,
    [T.contact + 0.005, T.contact + 0.025, T.fourPeak, T.fourFadeEnd],
    [0, 1, 1, 0],
  );
  const fourScale = useTransform(
    progress,
    [T.contact + 0.005, T.contact + 0.03, T.fourFadeEnd],
    [0.7, 1, 1.04],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden" aria-hidden="true">
      {/* Crowd-energy abstraction: a soft light burst, not illustrated people */}
      <motion.div
        style={{ opacity: burstOpacity, scale: burstScale, left: CONTACT_LEFT, top: CONTACT_TOP }}
        className="bg-primary absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl sm:size-24"
      />

      {/* Impact swoosh stands in for "bat connects" */}
      <motion.div
        style={{
          opacity: swooshOpacity,
          scale: swooshScale,
          left: CONTACT_LEFT,
          top: CONTACT_TOP,
          rotate: -32,
        }}
        className="absolute h-1 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent sm:w-36"
      />

      {/* Minimal bat glyph — a static angled pose, not a swing animation */}
      <motion.div
        style={{ opacity: batOpacity, left: CONTACT_LEFT, top: CONTACT_TOP, rotate: -32 }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <svg width="70" height="18" viewBox="0 0 70 18" fill="none" className="sm:h-6 sm:w-[100px]">
          <rect x="0" y="6" width="16" height="6" rx="3" fill="#2b2118" />
          <path
            d="M16 4 H58 a6 6 0 0 1 6 6 a6 6 0 0 1 -6 6 H16 Z"
            fill="#d9b98a"
            stroke="#8a6a42"
            strokeWidth="0.6"
          />
        </svg>
      </motion.div>

      {/* Scoreboard-style payoff */}
      <motion.div
        style={{ opacity: fourOpacity, scale: fourScale }}
        className="absolute inset-x-0 top-[10%] flex justify-center sm:top-[8%]"
      >
        <span className="font-display text-primary text-6xl font-bold tracking-tight uppercase italic drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-8xl">
          FOUR!
        </span>
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
