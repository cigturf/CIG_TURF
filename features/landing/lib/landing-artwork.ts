/**
 * Premium landing-page artwork — part of the website design.
 * NOT editable from Admin. NOT real venue photography.
 * Real Chandna Indoor Ground media belongs in Gallery (Business Settings) only.
 */

export type LandingArtwork = {
  src: string;
  alt: string;
};

export const LANDING_HERO_ARTWORK: LandingArtwork[] = [
  {
    src: "/landing/hero-stadium-lights.jpg",
    alt: "Indoor cricket stadium under dramatic floodlights",
  },
  {
    src: "/landing/hero-equipment.jpg",
    alt: "Premium cricket equipment on indoor turf",
  },
  {
    src: "/landing/hero-batsman.jpg",
    alt: "Batsman silhouette in floodlit indoor arena",
  },
  {
    src: "/landing/hero-arena-wide.jpg",
    alt: "Wide view of premium indoor cricket arena",
  },
];

export const LANDING_STORY_ARTWORK: LandingArtwork = {
  src: "/landing/story-wickets.jpg",
  alt: "Cricket wickets and ball on premium indoor turf",
};

export const LANDING_CTA_ARTWORK: LandingArtwork = {
  src: "/landing/cta-helmet-bat.jpg",
  alt: "Cricket helmet and bat under stadium lights",
};

export const LANDING_FOOTER_ARTWORK: LandingArtwork = {
  src: "/landing/footer-bowler-silhouette.jpg",
  alt: "Subtle cricket bowler silhouette",
};

/** Cycle through hero artwork for facility editorial panels */
export const LANDING_FACILITY_ARTWORK: LandingArtwork[] = [
  {
    src: "/landing/hero-arena-wide.jpg",
    alt: "Premium indoor cricket arena",
  },
  {
    src: "/landing/hero-stadium-lights.jpg",
    alt: "Floodlit indoor stadium",
  },
  {
    src: "/landing/hero-equipment.jpg",
    alt: "Professional cricket equipment",
  },
  {
    src: "/landing/story-wickets.jpg",
    alt: "Match-ready indoor pitch",
  },
];
