import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface GradientMeshProps {
  className?: string;
  variant?: 'hero' | 'panel' | 'cta';
}

const blobConfig = {
  hero: [
    { color: '#635bff', size: 760, top: '-18%', left: '-12%', duration: 22, opacity: 0.7 },
    { color: '#a78bfa', size: 640, top: '-8%', left: '48%', duration: 26, opacity: 0.65 },
    { color: '#22d3ee', size: 600, top: '34%', left: '4%', duration: 19, opacity: 0.55 },
    { color: '#f472b6', size: 520, top: '52%', left: '60%', duration: 28, opacity: 0.5 },
    { color: '#34d399', size: 460, top: '70%', left: '28%', duration: 24, opacity: 0.45 },
  ],
  panel: [
    { color: '#635bff', size: 500, top: '-22%', left: '-12%', duration: 28, opacity: 0.55 },
    { color: '#22d3ee', size: 420, top: '18%', left: '60%', duration: 24, opacity: 0.5 },
    { color: '#a78bfa', size: 360, top: '60%', left: '18%', duration: 30, opacity: 0.5 },
  ],
  cta: [
    { color: '#635bff', size: 700, top: '-30%', left: '-5%', duration: 22, opacity: 0.85 },
    { color: '#22d3ee', size: 580, top: '8%', left: '60%', duration: 26, opacity: 0.7 },
    { color: '#f472b6', size: 520, top: '40%', left: '20%', duration: 24, opacity: 0.65 },
  ],
};

export function GradientMesh({ className, variant = 'hero' }: GradientMeshProps) {
  const reduced = useReducedMotion();
  const blobs = blobConfig[variant];

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Colored blobs — saturated, no white-wash on top */}
      <div className="absolute inset-0 [filter:blur(72px)] saturate-150">
        {blobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              top: b.top,
              left: b.left,
              opacity: b.opacity,
              background: `radial-gradient(circle at 50% 50%, ${b.color} 0%, ${b.color}cc 30%, ${b.color}55 55%, transparent 75%)`,
              willChange: 'transform',
            }}
            animate={
              reduced
                ? undefined
                : {
                    x: [0, 32, -22, 0],
                    y: [0, -24, 28, 0],
                    scale: [1, 1.08, 0.94, 1],
                  }
            }
            transition={{
              duration: b.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          />
        ))}
      </div>

      {/* Soft fade only at the bottom edge to blend into the next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 70%, #ffffff 100%)',
        }}
      />

      {/* Subtle grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04] mix-blend-multiply">
        <filter id="gm-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gm-noise)" />
      </svg>
    </div>
  );
}
