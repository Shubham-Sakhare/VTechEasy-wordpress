import { useInView } from "../../hooks/useInView";

/**
 * Wraps children in a scroll-triggered reveal animation.
 *
 * props:
 *  - direction: "up" | "left" | "right" | "scale"  (default "up")
 *  - delay:     ms before the transition starts (for staggering)
 *  - as:        element/tag to render (default "div")
 */
export default function Reveal({
  children,
  direction = "up",
  delay = 0,
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
      : "";

  return (
    <Cmp
      ref={ref}
      className={`reveal ${dirClass} ${inView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Cmp>
  );
}
