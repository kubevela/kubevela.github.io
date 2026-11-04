import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// usePlayOnce steps a drawing from phase 0 to last, one phase every stepMs,
// starting when the drawing first scrolls into view. It returns the ref to
// put on the drawing and the current phase; with reduced motion the drawing
// starts on its last phase.
export default function usePlayOnce(last, stepMs = 380) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase(last);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [last]);

  useEffect(() => {
    if (!started || phase >= last) {
      return;
    }
    const timer = setTimeout(() => setPhase(phase + 1), phase === 0 ? 250 : stepMs);
    return () => clearTimeout(timer);
  }, [started, phase, last, stepMs]);

  return [ref, phase];
}
