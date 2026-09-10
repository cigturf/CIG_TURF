"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

type HeroCricketScrubProps = {
  progress: MotionValue<number>;
};

/**
 * A cinematic bowler → ball → batter → FOUR beat, entirely scroll-driven.
 * Illustrated line-art figures (matching the crest's silhouette style) stand
 * in for the bowler and batter, but the pacing is still told through motion,
 * a light-streak impact, and a scoreboard-style numeral — premium sports
 * broadcast graphics, not a hand-drawn cutscene.
 */
const T = {
  bowlerIn: 0.27,
  bowlerHold: 0.31,
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
const BOWLER_LEFT = "5%";
const BOWLER_TOP = "17%";
const CONTACT_LEFT = "62%";
const CONTACT_TOP = "13%";

export function HeroCricketScrub({ progress }: HeroCricketScrubProps) {
  const bowlerOpacity = useTransform(
    progress,
    [T.bowlerIn, T.bowlerHold, T.ballStart - 0.01, T.ballStart + 0.03],
    [0, 1, 1, 0],
  );

  const batterOpacity = useTransform(
    progress,
    [T.contact - 0.07, T.contact - 0.04, T.contact + 0.06, T.contact + 0.09],
    [0, 1, 1, 0],
  );
  const batterScale = useTransform(progress, [T.contact - 0.04, T.contact], [0.88, 1]);

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
      {/* Bowler, mid delivery stride — releases the ball the moment it starts its flight */}
      <motion.div
        style={{ opacity: bowlerOpacity, left: BOWLER_LEFT, top: BOWLER_TOP }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <svg
          width="46"
          height="60"
          viewBox="0 0 54 70"
          fill="none"
          className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:h-20 sm:w-[62px]"
        >
          <g stroke="#f8fafc" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M29 15 L21 38" />
            <path d="M21 38 L13 50 L6 60" />
            <path d="M23 38 L32 47 L39 55" />
            <path d="M27 17 L14 25" />
            <path d="M31 16 L44 4" />
          </g>
          <circle cx="30" cy="9" r="6.5" fill="#f8fafc" />
          <circle cx="44" cy="4" r="3.4" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.6" />
        </svg>
      </motion.div>

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

      {/* Batter, bat raised through the shot that sends the ball for FOUR */}
      <motion.div
        style={{
          opacity: batterOpacity,
          scale: batterScale,
          left: CONTACT_LEFT,
          top: CONTACT_TOP,
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <svg
          width="50"
          height="64"
          viewBox="-4 -16 70 88"
          fill="none"
          className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:h-[86px] sm:w-[68px]"
        >
          <g stroke="#f8fafc" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M27 17 L25 39" />
            <path d="M25 39 L16 49 L9 58" />
            <path d="M25 39 L34 48 L41 54" />
            <path d="M23 20 L11 30" />
            <path d="M29 19 L40 6" />
          </g>
          <circle cx="27" cy="10" r="6.5" fill="#f8fafc" />
          <path d="M40 6 L62 -10" stroke="#d9b98a" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="40" cy="6" r="3" fill="#2b2118" />
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
