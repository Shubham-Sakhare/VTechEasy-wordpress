import Icon from "./Icon";

/**
 * Reusable pill button.
 * variant: "gradient" | "outline" | "ghost"
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
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70";

  const variants = {
    gradient:
      "btn-gradient text-white ring-glow hover:-translate-y-0.5 hover:brightness-110",
    outline:
      "border border-white/15 text-white hover:border-white/40 hover:bg-white/5",
    ghost: "text-white/80 hover:text-white",
  };

  const Cmp = as;

  return (
    <Cmp className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
      {showIcon && (
        <Icon
          name={icon}
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </Cmp>
  );
}
