import Icon from "./Icon";

/**
 * Reusable pill button.
 * variant: "gradient" | "outline" | "ghost"
 *
 * Enhancement: gradient variant now has an internal shimmer sweep on hover,
 * and a subtle scale lift. All variants have smooth focus rings.
 */
export default function Button({
  children,
  variant = "gradient",
  icon = "arrowRight",
  showIcon = true,
  as = "button",
  className = "",
  ...props
}) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70";

  const variants = {
    gradient:
      "btn-gradient text-white ring-glow hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_14px_40px_-10px_rgba(45,124,255,0.65)]",
    outline:
      "border border-white/15 text-white hover:border-brand-blue/40 hover:bg-white/5 hover:-translate-y-0.5",
    ghost: "text-white/80 hover:text-white hover:-translate-y-0.5",
  };

  const Cmp = as;

  return (
    <Cmp className={`${base} ${variants[variant]} ${className}`} {...props}>
      {/* Shimmer sweep — only visible on gradient variant */}
      {variant === "gradient" && (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
          aria-hidden="true"
        />
      )}
      {children}
      {showIcon && (
        <Icon
          name={icon}
          className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </Cmp>
  );
}
