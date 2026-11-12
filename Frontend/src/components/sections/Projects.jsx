import { useRef } from "react";
import { Link } from "react-router-dom";
import { slugify } from "../../utils/slug";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";
import Reveal from "../ui/Reveal";

const TAG_COLORS = [
  "bg-brand-blue",
  "bg-brand-purple",
  "bg-emerald-500",
  "bg-brand-orange",
  "bg-brand-pink",
];

export default function Projects({ data }) {
  const scrollRef = useRef(null);

  // Live backend content only — no static fallback.
  const projects = { ...(data || {}) };
  const allItems = Array.isArray(projects.items) ? projects.items : [];

  // The backend already returns the right items for the page: every project
  // on the parent page, and only the featured ones on other pages (with the
  // feature flags stripped). So we must NOT filter by `feature` again here —
  // doing that on a secondary page would drop every card and hide the section.
  const visibleItems = allItems.filter((p) =>
    String(p?.title || "").trim()
  );

  // Nothing to show — hide the whole section rather than render an empty box.
  if (visibleItems.length === 0) return null;

  const scrollCards = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const firstCard = container.querySelector("[data-project-card]");
    if (!firstCard) return;

    const gap = 24;
    const distance = firstCard.getBoundingClientRect().width + gap;

    container.scrollBy({
      left: direction * distance,
      behavior: "smooth",
    });
  };

  return (
    <section id="portfolio" className="py-20 lg:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={projects.eyebrow}
            title={projects.title}
            description={projects.description}
          />
        </Reveal>

        <div className="relative mt-12">
          {/* Same portfolio-card style in a horizontal row */}
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleItems.map((p, i) => {
              const categories = Array.isArray(p.categories)
                ? p.categories
                : p.tag
                  ? [p.tag]
                  : [];

              const tech = Array.isArray(p.tech) ? p.tech : [];

              return (
                <Reveal
                  as="article"
                  key={p.slug || p.title}
                  direction="up"
                  delay={(i % 3) * 100}
                  data-project-card=""
                  className="group border-beam card w-full min-w-0 shrink-0 snap-start overflow-hidden transition-all duration-350 hover:-translate-y-2 hover:border-brand-blue/25 hover:shadow-[0_30px_70px_-20px_rgba(45,124,255,0.45),0_0_0_1px_rgba(45,124,255,0.15)] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                >
                  {/* Portfolio image */}
                  <div
                    className={`relative aspect-[16/10] overflow-hidden ${
                      p.image
                        ? "bg-ink-700"
                        : "bg-gradient-to-br from-ink-700 to-ink"
                    }`}
                  >
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}

                    {p.brand && (
                      <span className="absolute inset-0 grid place-items-center bg-ink/20 text-4xl font-bold tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.55)] sm:text-5xl">
                        {p.brand}
                      </span>
                    )}

                    {categories.length > 0 && (
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {categories.map((category, categoryIndex) => (
                          <span
                            key={category}
                            className={`rounded-full ${
                              TAG_COLORS[
                                categoryIndex % TAG_COLORS.length
                              ]
                            } px-3 py-1 text-xs font-semibold text-white shadow`}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                  </div>

                  {/* Portfolio details */}
                  <div className="p-5">
                    <h3 className="text-base font-semibold transition-colors group-hover:text-brand-cyan">
                      {p.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {p.desc}
                    </p>

                    {tech.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tech.map((technology, techIndex) => {
                          const name =
                            typeof technology === "string"
                              ? technology
                              : technology?.name;

                          if (!name) return null;

                          return (
                            <span
                              key={`${name}-${techIndex}`}
                              className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70"
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                      <Link
                        to={`/portfolio/${p.slug || slugify(p.title)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan transition-colors hover:text-white"
                      >
                        Details
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </Link>

                      {p.button_url && (
                        <a
                          href={p.button_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan transition-colors hover:text-white"
                        >
                          View Project
                          <Icon name="external" className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <SectionFooter
          showViewAll={isToggleOn(projects.cta_visible ?? Boolean(projects.cta))}
          label={projects.cta || "View All Projects"}
          url={projects.cta_url || "/portfolio"}
          icon={projects.cta_icon}
          showArrows={visibleItems.length > 3}
          onPrev={() => scrollCards(-1)}
          onNext={() => scrollCards(1)}
          arrowLabel="portfolio projects"
        />
      </div>
    </section>
  );
}

