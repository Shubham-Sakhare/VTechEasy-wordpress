import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

/**
 * Shared inner-page hero used on About / Portfolio / Contact / Blog.
 * Left: eyebrow pill, two-tone heading, description, feature points + CTAs.
 * Right: a floating image mockup with a hand-written accent note.
 *
 * props:
 *  - eyebrow, title, accent, titleEnd, description
 *  - image, imageAlt, note (JSX for the slanted accent text)
 *  - points: [{ icon, title, sub }]
 *  - stats:  [{ value, label }]  (shown as a row, portfolio-style)
 *  - primary / secondary: { label, to } CTA buttons
 */
export default function PageHero({
  eyebrow,
  title,
  accent,
  titleEnd,
  description,
  image,
  imageAlt = "",
  note,
  points = [],
  stats = [],
  primary,
  secondary,
}) {
  return (
    <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 lg:pt-36">
      <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-20 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl" />

      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        {/* Left: copy */}
        <div>
          {eyebrow && (
            <Reveal
              direction="up"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
              {eyebrow}
            </Reveal>
          )}

          <Reveal
            as="h1"
            direction="up"
            delay={80}
            className="font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl"
          >
            {title && <span className="block">{title}</span>}
            {accent && <span className="block text-gradient">{accent}</span>}
            {titleEnd && <span className="block">{titleEnd}</span>}
          </Reveal>

          {description && (
            <Reveal
              as="p"
              direction="up"
              delay={200}
              className="mt-6 max-w-lg text-base leading-relaxed text-muted"
            >
              {description}
            </Reveal>
          )}

          {points.length > 0 && (
            <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {points.map((p, i) => (
                <Reveal
                  key={p.title}
                  direction="up"
                  delay={320 + i * 110}
                  className="group flex items-center gap-3"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:ring-brand-cyan/50">
                    <Icon name={p.icon} className="h-5 w-5 text-brand-cyan" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{p.title}</span>
                    {p.sub && <span className="block text-xs text-muted">{p.sub}</span>}
                  </span>
                </Reveal>
              ))}
            </div>
          )}

          {stats.length > 0 && (
            <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
              {stats.map((s, i) => (
                <Reveal key={s.label} direction="up" delay={320 + i * 110}>
                  <div className="text-gradient font-display text-3xl font-extrabold">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs text-muted">{s.label}</div>
                </Reveal>
              ))}
            </div>
          )}

          {(primary?.label && primary?.url) || (secondary?.label && secondary?.url) ? (
            <Reveal direction="up" delay={420} className="mt-9 flex flex-wrap items-center gap-4">
              {primary?.label && primary?.url && (
                <Button as="a" href={primary.url} icon={primary.icon || "arrowRight"}>
                  {primary.label}
                </Button>
              )}
              {secondary?.label && secondary?.url && (
                <Button
                  as="a"
                  href={secondary.url}
                  variant="outline"
                  icon={secondary.icon || "play"}
                >
                  {secondary.label}
                </Button>
              )}
            </Reveal>
          ) : null}
        </div>

        {/* Right: mockup */}
        {image && (
          <Reveal direction="right" delay={150} className="relative">
            <div className="relative mx-auto max-w-xl">
              <div className="animate-gradient absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-blue/30 via-brand-purple/25 to-brand-pink/25 blur-2xl" />
              <img
                src={image}
                alt={imageAlt}
                className="animate-float w-full rounded-2xl border border-white/10 shadow-2xl"
                loading="eager"
              />
            </div>
            {note && (
              <span className="animate-float-slow absolute -right-2 top-6 hidden rotate-6 text-right font-display text-sm font-semibold leading-snug text-white/70 sm:block">
                {note}
              </span>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
