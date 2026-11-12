import { useCallback, useEffect, useRef, useState } from "react";
import PageHero from "./PageHero";
import Icon from "../ui/Icon";

/**
 * Enhanced hero slider.
 * - Stable-height CSS grid stage (every slide = same cell)
 * - Cross-fade between slides (opacity transition)
 * - Autoplay progress bar under the control row
 * - Slide-enter direction animation (new slide slides up into view)
 * - Ken Burns-style zoom on the active slide's image is handled inside PageHero
 *   via the `isActive` prop we pass down
 * - Keyboard-accessible (←/→ arrow keys)
 */
export default function HeroSlider({ slides = [], options = {} }) {
  const {
    autoplay = true,
    interval = 6000,
    loop = true,
    arrows = true,
    dots = true,
  } = options;

  const count = slides.length;
  const [rawActive, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressStart = useRef(null);

  const active = count > 0 ? Math.min(rawActive, count - 1) : 0;

  /** Update the progress bar DOM element directly via rAF — avoids setState inside effect */
  const startProgress = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    progressStart.current = performance.now();
    const dur = Math.max(1500, interval);
    const tick = (now) => {
      const pct = Math.min(100, ((now - progressStart.current) / dur) * 100);
      if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [interval]);

  const resetProgress = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (progressBarRef.current) progressBarRef.current.style.width = "0%";
  }, []);

  const go = useCallback(
    (next) => {
      if (count <= 1) return;
      setActive((cur) => {
        const n = typeof next === "function" ? next(cur) : next;
        if (loop) return (n + count) % count;
        return Math.max(0, Math.min(count - 1, n));
      });
    },
    [count, loop]
  );

  const prev = useCallback(() => go((c) => c - 1), [go]);
  const next = useCallback(() => go((c) => c + 1), [go]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || paused || count <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setActive((cur) => (loop ? (cur + 1) % count : Math.min(cur + 1, count - 1)));
    }, Math.max(1500, interval));
    return () => clearInterval(timerRef.current);
  }, [autoplay, paused, count, interval, loop]);

  // Progress bar rAF — direct DOM writes, no setState
  useEffect(() => {
    if (!autoplay || paused || count <= 1) { resetProgress(); return undefined; }
    startProgress();
    return resetProgress;
  }, [active, autoplay, paused, count, startProgress, resetProgress]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (count === 0) return null;

  const showControls = count > 1;

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label="Hero slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide stage ── */}
      <div className="grid items-stretch">
        {slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${count}`}
              aria-hidden={!isActive}
              style={{ gridArea: "1 / 1" }}
              className={[
                "flex w-full flex-col justify-center transition-all duration-700 ease-in-out",
                isActive
                  ? "opacity-100 translate-y-0"
                  : "pointer-events-none opacity-0 translate-y-4",
              ].join(" ")}
            >
              <PageHero {...slide} isActive={isActive} />
            </div>
          );
        })}
      </div>

      {/* ── Control bar ── */}
      {showControls && (
        <div className="relative z-20 -mt-6 pb-10 sm:-mt-8 sm:pb-14">
          <div className="container-x grid items-center gap-12 lg:grid-cols-2">
            {/* Left spacer */}
            <div className="hidden lg:block" aria-hidden="true" />

            {/* Controls */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                {arrows && (
                  <button
                    type="button"
                    onClick={prev}
                    disabled={!loop && active === 0}
                    aria-label="Previous slide"
                    className="group grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:border-brand-blue/50 hover:bg-brand-blue/10 hover:text-white hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="arrowLeft" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  </button>
                )}

                {dots && (
                  <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
                    {slides.map((_, i) => {
                      const isD = i === active;
                      return (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-selected={isD}
                          aria-label={`Go to slide ${i + 1}`}
                          onClick={() => go(i)}
                          className={[
                            "h-2 rounded-full transition-all duration-400",
                            isD
                              ? "w-8 bg-gradient-to-r from-brand-blue to-brand-purple shadow-[0_0_8px_rgba(45,124,255,0.6)]"
                              : "w-2 bg-white/25 hover:bg-white/50 hover:w-4",
                          ].join(" ")}
                        />
                      );
                    })}
                  </div>
                )}

                {arrows && (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!loop && active === count - 1}
                    aria-label="Next slide"
                    className="group grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:border-brand-blue/50 hover:bg-brand-blue/10 hover:text-white hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                )}

                <div className="font-display text-sm font-semibold tabular-nums tracking-wide text-white/50">
                  <span className="text-white/90">{String(active + 1).padStart(2, "0")}</span>
                  <span className="mx-1.5 text-white/25">/</span>
                  <span>{String(count).padStart(2, "0")}</span>
                </div>
              </div>

              {/* Autoplay progress bar — driven by rAF via DOM ref */}
              {autoplay && (
                <div className="h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
                  <div
                    ref={progressBarRef}
                    className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-purple"
                    style={{ width: "0%" }}
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
