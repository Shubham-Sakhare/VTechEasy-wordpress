import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { slugify } from "../../utils/slug";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";
import Reveal from "../ui/Reveal";

// Gradient fallbacks for cards that come from WP without a color set.
const SERVICE_COLORS = [
  "from-brand-blue to-brand-cyan",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-orange-400 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-brand-purple to-indigo-500",
];

/** Parent page: paginate once the card list exceeds this many cards. */
const PAGE_SIZE = 9;
/** Other pages: scroll once this many featured cards are shown. */
const SCROLL_LIMIT = 3;
const EMPTY_ITEMS = [];

/**
 * `data` comes from the WordPress "Our Services" section. The section renders
 * only live backend content — there is no static fallback. If no service cards
 * are provided, the whole section is hidden.
 * WP stores the accent as `title_accent`; map it to `titleAccent`.
 * `isParent` is true on the section's parent page, which lists every card.
 */
export default function Services({ data, isParent = true }) {
  const cardsRef = useRef(null);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();

  const services = {
    ...(data || {}),
    titleAccent: data?.title_accent ?? data?.titleAccent ?? "",
  };

  const items = Array.isArray(services.items) ? services.items : EMPTY_ITEMS;

  // No live service cards — render nothing rather than an empty section.
  if (items.length === 0) {
    return null;
  }

  // Parent page lists every card and paginates beyond PAGE_SIZE. Other pages
  // show only the featured cards (already filtered by the backend) and turn
  // into a scroll area once there are more than SCROLL_LIMIT of them.
  const paginate = isParent && items.length > PAGE_SIZE;
  const scroll = !isParent;
  const selectedCategory = searchParams.get("category") || "";
  const filteredItems = selectedCategory
    ? items.filter((item) => {
      const values = item.categories || item.category || item.title || [];
        const categories = (Array.isArray(values) ? values : [values]).map(
          (value) => (typeof value === "string" ? value : value?.name || ""),
        );
        return categories.includes(selectedCategory);
      })
    : items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = paginate ? (currentPage - 1) * PAGE_SIZE : 0;
  const visible = paginate
    ? filteredItems.slice(offset, offset + PAGE_SIZE)
    : filteredItems;

  return (
    <section id="services" className="py-20 lg:py-28">
      <div className="container-x">
        {/* Top: heading */}
        <Reveal direction="up" className="mx-auto max-w-3xl text-center">
          <SectionHeading
            align="center"
            eyebrow={services.eyebrow}
            title={services.title}
            accent={services.titleAccent}
            description={services.description}
          />
        </Reveal>
        {selectedCategory && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-muted">
            <span>Showing services in {selectedCategory}</span>
            <Link to="/services" className="font-semibold text-brand-cyan hover:text-white">
              Clear filter
            </Link>
          </div>
        )}

        {/* Bottom: cards */}
        <div ref={cardsRef}
          className={
            scroll
              ? "mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {visible.map((item, i) => (
            <Reveal
              as="article"
              key={item.title}
              direction="up"
              delay={i * 90}
              className={`group border-beam card card-glow p-6 transition-all duration-300 hover:-translate-y-2 hover:border-brand-blue/30 hover:shadow-[0_30px_60px_-20px_rgba(45,124,255,0.45),0_0_0_1px_rgba(45,124,255,0.2)] ${
                scroll ? "w-[calc((100%-3rem)/3)] min-w-[calc((100%-3rem)/3)] flex-none snap-start max-md:w-[80%] max-md:min-w-[80%] max-sm:w-[88%] max-sm:min-w-[88%]" : ""
              }`}
            >
              <span
                className={`mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${item.color || SERVICE_COLORS[(offset + i) % SERVICE_COLORS.length]} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold transition-colors group-hover:text-brand-cyan">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Link
                  to={`/services/${item.slug || slugify(item.title)}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan hover:text-white"
                >
                  View service details
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                {(() => {
                  const buttonUrl = item.button_url || "/contact#contact-form";
                  const buttonText = item.button_text || "Get Started";
                  const buttonClass = "inline-flex items-center justify-center gap-2 rounded-full btn-gradient px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110";
                  return buttonUrl.startsWith("/") ? (
                    <Link to={buttonUrl} className={buttonClass}>
                      {buttonText}
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Button
                      as="a"
                      href={buttonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="!px-4 !py-2.5 text-xs"
                    >
                      {buttonText}
                    </Button>
                  );
                })()}
              </div>
            </Reveal>
          ))}
        </div>

        {scroll && (
          <SectionFooter
            showViewAll={isToggleOn(services.cta_visible ?? Boolean(services.cta))}
            label={services.cta || "View All Services"}
            url={services.cta_url || "/services"}
            icon={services.cta_icon}
            showArrows={visible.length > SCROLL_LIMIT}
            onPrev={() => cardsRef.current?.scrollBy({ left: -cardsRef.current.clientWidth, behavior: "smooth" })}
            onNext={() => cardsRef.current?.scrollBy({ left: cardsRef.current.clientWidth, behavior: "smooth" })}
            arrowLabel="service cards"
          />
        )}

        {paginate && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, Math.min(totalPages, p) - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, n) => n + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === currentPage ? "page" : undefined}
                className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition ${
                  n === currentPage
                    ? "btn-gradient text-white ring-glow"
                    : "border border-white/10 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, Math.min(totalPages, p) + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
