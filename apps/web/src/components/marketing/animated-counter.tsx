'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  target: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ target, duration = 1500, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(target);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function animate() {
    // Extract numeric part
    const numMatch = target.match(/(\d+)/);
    if (!numMatch) {
      setDisplay(target);
      return;
    }
    const numTarget = parseInt(numMatch[1], 10);
    const prefix = target.slice(0, numMatch.index);
    const suffix = target.slice((numMatch.index ?? 0) + numMatch[1].length);

    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numTarget);
      setDisplay(`${prefix}${current}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
