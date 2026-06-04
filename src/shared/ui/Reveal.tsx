import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { makeReveal, VIEWPORT_ONCE, type RevealVariant } from '@/shared/lib/motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  /** Direction of the entrance: up (default), left, right, scale. */
  variant?: RevealVariant;
  /** Extra delay (seconds) before the reveal begins. */
  delay?: number;
}

/**
 * Scroll-triggered reveal wrapper. Wrap any block to fade/slide it in once it
 * enters the viewport. Honors `prefers-reduced-motion` (renders statically).
 */
export function Reveal({ variant = 'up', delay = 0, children, ...rest }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const { className, style, id } = rest;
    return (
      <div className={className} style={style as React.CSSProperties} id={id}>
        {children as React.ReactNode}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={makeReveal(variant, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
