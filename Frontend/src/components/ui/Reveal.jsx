import { useInView } from "../../hooks/useInView";

/**
 * Wraps children in a scroll-triggered reveal animation.
 *
 * props:
 *  - direction: "up" | "left" | "right" | "scale" | "flip" | "zoom"  (default "up")
 *  - delay:     ms before the transition starts (for staggering)
 *  - as:        element/tag to render (default "div")
 *  - duration:  override the transition duration (ms, default 700)
 */
export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  as = "div",
  className = "",
  ...props
}) {
  const { ref, inView } = useInView();
  const Cmp = as;

  const dirClass =
    direction === "left"
      ? "reveal-left"
      : direction === "right"
      ? "reveal-right"
      : direction === "scale"
      ? "reveal-scale"
      : direction === "flip"
      ? "reveal-flip"
      : direction === "zoom"
      ? "reveal-zoom"
      : "";

  return (
    <Cmp
      ref={ref}
      className={`reveal ${dirClass} ${inView ? "is-visible" : ""} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
      {...props}
    >
      {children}
    </Cmp>
  );
}
