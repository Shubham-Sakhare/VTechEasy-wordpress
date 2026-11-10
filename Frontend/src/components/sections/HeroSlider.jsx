import { useCallback, useEffect, useRef, useState } from "react";
import PageHero from "./PageHero";
import Icon from "../ui/Icon";

/**
 * Functional hero slider.
 *
 * - All slides are stacked in a single CSS grid cell so the section keeps a
 *   STABLE height (the tallest slide drives it) — changing slides, or a slide
 *   with little/no text, never makes the section grow or shrink. A min-height
 *   guarantees a consistent hero size even when every slide is short.
 * - A control bar mirrors the reference design: prev/next arrows + dots on the
 *   left, a "01 / 04" counter on the right, separated by a divider.
 *
 * props:
 *  - slides: array of PageHero-ready slide objects (from normalizeHero).
 *  - options: { autoplay, interval, loop, arrows, dots } slider behaviour.
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

  // Clamp during render so a shrinking slide list never points past the end
  // (avoids a setState-in-effect pass).
  const active = count > 0 ? Math.min(rawActive, count - 1) : 0;

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

  // Autoplay.
  useEffect(() => {
    if (!autoplay || paused || count <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setActive((cur) => (loop ? (cur + 1) % count : Math.min(cur + 1, count - 1)));
    }, Math.max(1500, interval));
    return () => clearInterval(timerRef.current);
  }, [autoplay, paused, count, interval, loop]);

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
      {/*
       * Stable-height stage: every slide occupies the SAME grid cell
       * (grid-area 1/1), so the section height never jumps between slides or
       * when a slide's image is larger/smaller. The control bar below sits in
       * normal flow, so its position does NOT depend on each slide's image size.
       */}
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
                "flex w-full flex-col justify-center transition-opacity duration-700 ease-out",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
              ].join(" ")}
            >
              <PageHero {...slide} />
            </div>
          );
        })}
      </div>

      {/*
       * Control bar in NORMAL FLOW at the bottom of the section (NOT absolute),
       * so it always stays INSIDE the hero's painted background and never spills
       * out below it. It mirrors the hero's 2-column grid: the LEFT column is an
       * empty spacer and the controls live in the RIGHT column, so arrows +
       * counter sit UNDER the right-side image. Because the slide stage keeps a
       * stable height and the bar is pinned to the grid column (not the image),
       * its position stays fixed whether the slide image is big or small, and it
       * never overlaps the content.
       * Layout (right column):  <  ●●●  >            01 / 04
       */}
      {showControls && (
        <div className="relative z-20 -mt-6 pb-10 sm:-mt-8 sm:pb-14">
          <div className="container-x grid items-center gap-12 lg:grid-cols-2">
            {/* Left column spacer (keeps controls under the right image) */}
            <div className="hidden lg:block" aria-hidden="true" />

            {/* Right column: arrows + dots + counter, centered together */}
            <div className="flex items-center justify-center gap-4">
              {arrows && (
                <button
                  type="button"
                  onClick={prev}
                  disabled={!loop && active === 0}
                  aria-label="Previous slide"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-all duration-200 hover:border-white/40 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="arrowLeft" className="h-3.5 w-3.5" />
                </button>
              )}

              {dots && (
                <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
                  {slides.map((_, i) => {
                    const isDot = i === active;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={isDot}
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => go(i)}
                        className={[
                          "h-2 rounded-full transition-all duration-300",
                          isDot
                            ? "w-7 bg-gradient-to-r from-brand-blue to-brand-purple"
                            : "w-2 bg-white/25 hover:bg-white/50",
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
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-all duration-200 hover:border-white/40 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Counter as part of the centered control group */}
              <div className="font-display text-sm font-semibold tabular-nums tracking-wide text-white/60">
                <span className="text-white">{String(active + 1).padStart(2, "0")}</span>
                <span className="mx-1.5 text-white/30">/</span>
                <span>{String(count).padStart(2, "0")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
