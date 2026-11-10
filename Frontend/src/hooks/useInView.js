import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref and a boolean that flips to true the first time the element
 * scrolls into view. Used to trigger scroll-reveal animations.
 */
export function useInView({ threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = {}) {
  const ref = useRef(null);
  // If IntersectionObserver isn't available (e.g. SSR), start visible so
  // content is never hidden. Computed as initial state, not inside the effect.
  const supported = typeof IntersectionObserver !== "undefined";
  const [inView, setInView] = useState(!supported);

  useEffect(() => {
    const el = ref.current;
    if (!el || !supported) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, supported]);

  return { ref, inView };
}
