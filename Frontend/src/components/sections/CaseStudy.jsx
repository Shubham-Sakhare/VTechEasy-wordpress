import { caseStudies as caseStudiesFallback } from "../../data/siteData";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

/**
 * "Case Study" — a single, self-contained section (no repeater): image with
 * brand text on the left, and on the right a badge, title, description, tech
 * chips, stat boxes and one button. All editable from the Portfolio page menu.
 */
export default function CaseStudy({ data }) {
  const cs = data || caseStudiesFallback;

  return (
    <section id="case-study" className="py-20 lg:py-28">
      <div className="container-x">
        <Reveal
          as="article"
          direction="up"
          className="card overflow-hidden p-5 transition-all duration-300 hover:border-white/15 sm:p-7"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left: image with brand text on top */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              {cs.image && (
                <img
                  src={cs.image}
                  alt={cs.title || cs.brand || "Case study"}
                  className="aspect-[16/11] w-full object-cover"
                  loading="lazy"
                />
              )}
              {cs.brand && (
                <span className="absolute inset-0 grid place-items-center px-6 text-center text-3xl font-bold tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.55)] sm:text-4xl">
                  {cs.brand}
                </span>
              )}
            </div>

            {/* Right: content */}
            <div>
              {cs.badge && (
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-cyan/10 px-4 py-1.5 text-sm font-semibold text-brand-cyan ring-1 ring-brand-cyan/30">
                  <Icon name="star" className="h-4 w-4" />
                  {cs.badge}
                </span>
              )}

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {cs.title}
              </h3>

              {cs.description && (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {cs.description}
                </p>
              )}

              {/* Tech stack chips */}
              {Array.isArray(cs.tech) && cs.tech.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {cs.tech.map((t, ti) => (
                    <span
                      key={`${t.name}-${ti}`}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/75"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats boxes — display only, one button for the whole section */}
              {Array.isArray(cs.stats) && cs.stats.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {cs.stats.map((s, si) => (
                    <div
                      key={`${s.label}-${si}`}
                      className="rounded-2xl bg-white/[.03] px-4 py-5 text-center ring-1 ring-white/10"
                    >
                      <p className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
                        {s.value}
                      </p>
                      <p className="mt-1 text-xs text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {cs.button && (
                <div className="mt-7">
                  <Button
                    as="a"
                    href={cs.button_url || "#"}
                    icon={cs.button_icon || "arrowRight"}
                    className="!px-7 !py-3"
                  >
                    {cs.button_text || "View Full Project"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}