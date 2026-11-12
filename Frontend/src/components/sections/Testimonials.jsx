import { useRef } from "react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";
import Reveal from "../ui/Reveal";

export default function Testimonials({ data, isParent = true }) {
  const cardsRef = useRef(null);
  const testimonials = { ...(data || {}) };
  const testimonialItems = Array.isArray(testimonials.items) ? testimonials.items : [];
  if (!testimonialItems.length) return null;

  const scroll = !isParent;
  const items = testimonialItems;

  const scrollCards = (direction) => {
    const container = cardsRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * container.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="container-x">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {testimonials.image && (
            <img
              src={testimonials.image}
              alt={testimonials.title || "Testimonials"}
              className="mb-6 h-16 w-16 rounded-2xl object-cover"
              loading="lazy"
            />
          )}
          <SectionHeading
            eyebrow={testimonials.eyebrow}
            title={testimonials.title}
            description={testimonials.description}
            align="center"
          />
        </Reveal>

        <div
          ref={cardsRef}
          className={
            scroll
              ? "mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          }
        >
          {items.map((t, i) => {
            const rating = Math.max(0, Math.min(5, Number(t.rating) || 0));
            return (
              <Reveal
                as="article"
                key={t.name}
                direction="up"
                delay={i * 130}
                className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-7 backdrop-blur-sm
                  transition-all duration-350 hover:-translate-y-2 hover:border-brand-blue/25
                  hover:shadow-[0_25px_60px_-20px_rgba(45,124,255,0.35),0_0_0_1px_rgba(45,124,255,0.1)]
                  ${scroll
                    ? "w-[calc((100%-3rem)/3)] min-w-[calc((100%-3rem)/3)] flex-none snap-start max-md:w-[80%] max-md:min-w-[80%] max-sm:w-[88%] max-sm:min-w-[88%]"
                    : ""
                  }`}
              >
                {/* Hover background glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-blue/0 via-brand-purple/0 to-brand-pink/0 opacity-0 transition-all duration-400 group-hover:from-brand-blue/5 group-hover:via-brand-purple/5 group-hover:to-brand-pink/5 group-hover:opacity-100" />

                {/* Large decorative quote */}
                <span
                  className="absolute -right-2 -top-4 font-display text-8xl font-extrabold leading-none text-brand-blue/10 transition-all duration-400 group-hover:text-brand-blue/20 group-hover:-top-2 select-none"
                  aria-hidden="true"
                >
                  &rdquo;
                </span>

                {/* Opening quote + text */}
                <span className="relative font-display text-4xl leading-none text-brand-blue/50 group-hover:text-brand-blue/70 transition-colors duration-300">
                  &ldquo;
                </span>
                <p className="relative -mt-3 text-sm leading-relaxed text-white/85 group-hover:text-white transition-colors duration-300">
                  {t.quote}
                </p>

                {/* Stars — animate in staggered on hover */}
                <div className="mt-5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Icon
                      key={si}
                      name="star"
                      className={`h-4 w-4 transition-all duration-200 ${
                        si < rating
                          ? "fill-current text-brand-orange"
                          : "text-white/15"
                      }`}
                      style={{ transitionDelay: `${si * 40}ms` }}
                    />
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-xs font-semibold text-brand-orange/80">
                      {rating}.0
                    </span>
                  )}
                </div>

                {/* Reviewer */}
                <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-5">
                  <div className="relative">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="h-11 w-11 rounded-full border border-white/10 object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Online indicator dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink bg-brand-cyan" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-muted">{t.role}</div>
                  </div>
                  {/* Verified badge */}
                  <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/15 border border-brand-blue/25">
                    <Icon name="check" className="h-3 w-3 text-brand-blue" />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {scroll && (
          <SectionFooter
            showViewAll={isToggleOn(testimonials.cta_visible)}
            label={testimonials.cta || "View All Reviews"}
            url={testimonials.cta_url || "/about"}
            icon={testimonials.cta_icon}
            showArrows={items.length > 3}
            onPrev={() => scrollCards(-1)}
            onNext={() => scrollCards(1)}
            arrowLabel="testimonials"
          />
        )}
      </div>
    </section>
  );
}
