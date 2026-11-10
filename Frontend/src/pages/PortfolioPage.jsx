import { useState } from "react";
import { Link } from "react-router-dom";
import { caseStudies as caseStudyFallback, portfolioPage } from "../data/siteData";
import { usePageContext } from "../hooks/PageContentContext";
import HeroSlider from "../components/sections/HeroSlider";
import SectionRenderer from "../components/sections/SectionRenderer";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Reveal from "../components/ui/Reveal";
import { slugify } from "../utils/slug";

export default function PortfolioPage() {
  const { hero, filters: fallbackFilters, items: fallbackItems } = portfolioPage;
  const { hero: wpHero, sections, live } = usePageContext();
  const wpProjects = sections.find((section) => section?.type === "projects")?.data;
  const wpCaseStudy = sections.find((section) => section?.type === "case_study")?.data;
  const [active, setActive] = useState("All");

  const items =
    live && wpProjects
      ? (Array.isArray(wpProjects.items) ? wpProjects.items : []).map((item) => ({
          ...item,
          categories: Array.isArray(item.categories)
            ? item.categories
            : item.tag
              ? [item.tag]
              : [],
          tech: Array.isArray(item.tech)
            ? item.tech.map((tech) => (typeof tech === "string" ? tech : tech?.name)).filter(Boolean)
            : [],
        })).filter((item) => String(item.title || "").trim())
      : fallbackItems.map((item) => ({
          ...item,
          categories: Array.isArray(item.categories)
            ? item.categories
            : item.category
              ? [item.category]
              : [],
          tech: Array.isArray(item.tech)
            ? item.tech.map((tech) => (typeof tech === "string" ? tech : tech?.name)).filter(Boolean)
            : [],
        })).filter((item) => String(item.title || "").trim());
  const categories =
    live && wpProjects && Array.isArray(wpProjects.categories)
      ? wpProjects.categories.map((category) => category.name).filter(Boolean)
      : fallbackFilters.filter((filter) => filter !== "All");
  const filters = ["All", ...categories];
  const visible = active === "All" ? items : items.filter((project) => project.categories.includes(active));
  const tagColors = ["bg-brand-blue", "bg-brand-purple", "bg-emerald-500", "bg-brand-orange", "bg-brand-pink"];
  const caseStudyData = live ? wpCaseStudy || {} : caseStudyFallback;
  const caseStudyContent = {
    ...caseStudyData,
    tech: Array.isArray(caseStudyData.tech)
      ? caseStudyData.tech.map((item) => (typeof item === "string" ? item : item?.name)).filter(Boolean)
      : [],
    stats: Array.isArray(caseStudyData.stats) ? caseStudyData.stats : [],
  };

  const heroVisible = live && wpHero ? wpHero.visible !== false : true;
  const heroSlides =
    live && wpHero && Array.isArray(wpHero.slides) && wpHero.slides.length
      ? wpHero.slides.map((slide) => ({ ...slide, imageAlt: "Portfolio showcase" }))
      : [
          {
            eyebrow: hero.eyebrow,
            title: hero.title,
            accent: hero.accent,
            description: hero.description,
            image: hero.image,
            imageAlt: "Portfolio showcase",
            note: (
              <>
                Ideas<br />Design<br />Development<br />Success
              </>
            ),
            stats: hero.stats,
          },
        ];
  const heroOptions = live && wpHero ? wpHero.slider : undefined;

  return (
    <>
      {heroVisible && <HeroSlider slides={heroSlides} options={heroOptions} />}

      {/* Filter + grid */}
      <section className="py-10 lg:py-16">
        <div className="container-x">
          <Reveal className="mb-10 flex flex-wrap justify-center gap-2.5">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  active === f
                    ? "btn-gradient border-transparent text-white ring-glow"
                    : "border-white/10 bg-white/5 text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <Reveal
                as="article"
                key={p.title}
                direction="up"
                delay={(i % 3) * 100}
                className="group card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-white/15 hover:shadow-[0_30px_70px_-25px_rgba(45,124,255,0.5)]"
              >
                <div className={`relative aspect-[16/10] overflow-hidden ${p.image ? "bg-ink-700" : "bg-gradient-to-br from-ink-700 to-ink"}`}>
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {p.brand && (
                    <span className="absolute inset-0 grid place-items-center bg-ink/20 text-4xl font-bold tracking-tight text-gradient sm:text-5xl">
                      {p.brand}
                    </span>
                  )}
                  {p.categories.length > 0 && (
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {p.categories.map((category) => {
                        const categoryIndex = categories.indexOf(category);
                        return (
                          <span
                            key={category}
                            className={`rounded-full ${tagColors[(categoryIndex + tagColors.length) % tagColors.length]} px-3 py-1 text-xs font-semibold text-white shadow`}
                          >
                            {category}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold transition-colors group-hover:text-brand-cyan">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tech.map((technology, techIndex) => (
                      <span key={`${technology}-${techIndex}`} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                        {typeof technology === "string" ? technology : technology?.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <Link
                      to={`/portfolio/${p.slug || slugify(p.title)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan hover:text-white"
                    >
                      Details
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </Link>
                    {p.button_url && (
                      <a
                        href={p.button_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan"
                      >
                        View Project
                        <Icon name="external" className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured case study */}
      {(!live || wpCaseStudy) && (
      <section className="py-12 lg:py-20">
        <div className="container-x">
          <Reveal
            direction="up"
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-700/60 p-6 sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-brand-purple/20 blur-3xl" />
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="relative">
                <div className="animate-gradient absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-blue/25 to-brand-purple/20 blur-2xl" />
                {caseStudyContent.image && (
                  <img
                    src={caseStudyContent.image}
                    alt={caseStudyContent.title}
                    className="w-full rounded-2xl border border-white/10 shadow-2xl"
                    loading="lazy"
                  />
                )}
                {caseStudyContent.brand && (
                  <span className="absolute inset-0 grid place-items-center text-center text-3xl font-semibold text-brand-blue sm:text-4xl">
                    {caseStudyContent.brand}
                  </span>
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-cyan">
                  <Icon name="star" className="h-3.5 w-3.5" />
                  {caseStudyContent.badge || caseStudyContent.eyebrow}
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  {caseStudyContent.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{caseStudyContent.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {caseStudyContent.tech.map((technology, techIndex) => (
                    <span key={`${technology}-${techIndex}`} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                      {typeof technology === "string" ? technology : technology?.name}
                    </span>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {caseStudyContent.stats.map((s) => (
                    <div key={s.label} className="card p-4 text-center">
                      <div className="text-gradient font-display text-xl font-extrabold">{s.value}</div>
                      <div className="mt-1 text-xs text-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
                {caseStudyContent.button && (
                  <Button as="a" href={caseStudyContent.button_url || "#"} icon={caseStudyContent.button_icon || "arrowRight"} className="mt-7">
                    {caseStudyContent.button_text || "View Full Project"}
                  </Button>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      )}

      <SectionRenderer sections={sections.filter((section) => !["projects", "case_study"].includes(section?.type))} />
    </>
  );
}
