import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Thin gradient bar pinned to the top of the viewport that fills as the page
 * scrolls. Mounted once, above the sticky nav.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-violet)_55%,var(--color-cyan))]"
    />
  );
}
