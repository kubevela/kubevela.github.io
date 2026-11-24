import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// PlayCueContext hands the decision of when a drawing plays to its parent.
// Its value is { waiting } to hold the drawing on its first phase, { takes,
// onDone } to play it, replaying from the start each time takes rises, and
// { takes: 0 } to rest it on its last phase. onDone is called once the drawing
// has played through.
export const PlayCueContext = createContext(null);

// usePlayOnce steps a drawing from phase 0 to last, one phase every stepMs,
// starting when the drawing first scrolls into view, or when cued under a
// PlayCueContext. It returns the ref to put on the drawing, the current phase,
// whether the drawing is resting on its last phase, and done, which reports
// that the drawing has played through. A drawing that keeps moving after its
// last phase passes holdsEnd and calls done itself. Uncued, with reduced
// motion the drawing starts on its last phase; a parent that cues it checks
// reduced motion itself.
export default function usePlayOnce(last, stepMs = 380, holdsEnd = false) {
  const cue = useContext(PlayCueContext);
  const cued = cue !== null;
  const waiting = !!cue?.waiting;
  const takes = cue?.takes ?? 0;
  const doneRef = useRef(null);
  doneRef.current = cue?.onDone;
  const done = useCallback(() => doneRef.current?.(), []);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (cued) {
      return;
    }
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
  }, [last, cued]);

  useEffect(() => {
    if (!cued) {
      return;
    }
    if (waiting) {
      setStarted(false);
      setPhase(0);
      return;
    }
    if (takes === 0) {
      setStarted(false);
      setPhase(last);
      return;
    }
    setPhase(0);
    setStarted(true);
  }, [cued, waiting, takes, last]);

  useEffect(() => {
    if (!started) {
      return;
    }
    if (phase >= last) {
      if (!holdsEnd) {
        done();
      }
      return;
    }
    const timer = setTimeout(() => setPhase(phase + 1), phase === 0 ? 250 : stepMs);
    return () => clearTimeout(timer);
  }, [started, phase, last, stepMs, holdsEnd, done]);

  return [ref, phase, cued && !waiting && takes === 0, done];
}
