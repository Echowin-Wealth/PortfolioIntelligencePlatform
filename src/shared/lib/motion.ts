import type { Variants, Transition } from 'framer-motion';

/**
 * Shared framer-motion presets so every marketing section animates with the
 * same cadence and easing (Monocept-style consistent scroll reveals). Sections
 * should prefer the <Reveal> wrapper, but these are exported for cases that
 * need direct control (staggered parents, custom children).
 */

// Stripe/Monocept-style spring-ish ease used across the design system.
export const EASE_SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const baseTransition: Transition = { duration: 0.55, ease: EASE_SPRING };

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const revealLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { ...baseTransition, duration: 0.6 } },
};

export const revealRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { ...baseTransition, duration: 0.6 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...baseTransition, duration: 0.65 } },
};

/** Container that staggers its direct children's reveal. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Child that fades+rises; pairs with `staggerParent`. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

/**
 * Like `staggerChild` but rises WITHOUT fading from opacity 0. Use for
 * above-the-fold LCP text (e.g. the hero headline/subhead) so the element is
 * painted on first frame instead of being hidden until JS + the fade run —
 * an opacity:0 start prevents the browser from counting it as the LCP paint.
 */
export const staggerChildSlide: Variants = {
  hidden: { y: 16 },
  visible: { y: 0, transition: baseTransition },
};

export const variantMap = {
  up: revealUp,
  left: revealLeft,
  right: revealRight,
  scale: scaleIn,
} as const;

export type RevealVariant = keyof typeof variantMap;

// Per-variant hidden offset + duration, used to build delay-aware variants.
const revealConfig: Record<RevealVariant, { hidden: Record<string, number>; duration: number }> = {
  up: { hidden: { opacity: 0, y: 18 }, duration: 0.55 },
  left: { hidden: { opacity: 0, x: -40 }, duration: 0.6 },
  right: { hidden: { opacity: 0, x: 40 }, duration: 0.6 },
  scale: { hidden: { opacity: 0, scale: 0.94, y: 24 }, duration: 0.65 },
};

/**
 * Build a reveal variant set with `delay` baked into the visible transition.
 * A variant's own transition overrides the component `transition` prop in
 * framer-motion, so per-instance delay must live inside the variant itself.
 */
export function makeReveal(variant: RevealVariant, delay = 0): Variants {
  const cfg = revealConfig[variant];
  return {
    hidden: cfg.hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: cfg.duration, ease: EASE_SPRING, delay },
    },
  };
}

/** Shared viewport config — animate once when ~80px into view. */
export const VIEWPORT_ONCE = { once: true, margin: '-80px' } as const;
