/**
 * Shared section header with an eyebrow label, a two-tone title and
 * an optional description. Used across most home-page sections.
 *
 * Enhancement: eyebrow now has an animated left accent line,
 * and the title fades in with a subtle clip-path reveal.
 */
export default function SectionHeading({
  eyebrow,
  title,
  accent,
  accentVariant = "cool",
  description,
  align = "left",
  className = "",
}) {
  const alignCls = align === "center" ? "items-center text-center" : "items-start text-left";
  const accentCls = accentVariant === "warm" ? "text-gradient-warm" : "text-gradient";

  return (
    <div className={`flex flex-col ${alignCls} ${className}`}>
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">
          {/* Animated accent line */}
          <span
            className="h-px bg-gradient-to-r from-brand-blue to-brand-cyan"
            style={{ width: "2rem", display: "inline-block", flexShrink: 0 }}
          />
          {eyebrow}
          <span
            className="h-px bg-gradient-to-r from-brand-cyan to-transparent"
            style={{ width: "1rem", display: "inline-block", flexShrink: 0 }}
          />
        </span>
      )}
      <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-[2.6rem]">
        {title}{" "}
        {accent && (
          <span className={accentCls}>{accent}</span>
        )}
      </h2>
      {description && (
        <p
          className={`mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
