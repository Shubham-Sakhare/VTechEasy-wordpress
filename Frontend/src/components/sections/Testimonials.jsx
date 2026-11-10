import { useRef } from "react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";
import Reveal from "../ui/Reveal";

export default function Testimonials({ data, isParent = true }) {
  const cardsRef = useRef(null);
  // Live backend content only — no static fallback.
  const testimonials = { ...(data || {}) };
  const testimonialItems = Array.isArray(testimonials.items) ? testimonials.items : [];
  if (!testimonialItems.length) return null;

  // Parent page shows all reviews in a grid. Other pages show the featured
  // reviews (already filtered by the backend) and switch to an arrow-scrolled
  // row — three visible at a time — once there are more than three.
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
          {items.map((t, i) => (
            <Reveal
              as="article"
              key={t.name}
              direction="up"
              delay={i * 130}
              className={`card card-glow relative p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 ${
                scroll
                  ? "w-[calc((100%-3rem)/3)] min-w-[calc((100%-3rem)/3)] flex-none snap-start max-md:w-[80%] max-md:min-w-[80%] max-sm:w-[88%] max-sm:min-w-[88%]"
                  : ""
              }`}
            >
              <span className="font-display text-5xl leading-none text-brand-blue/40">
                &ldquo;
              </span>
              <p className="-mt-4 text-sm leading-relaxed text-white/85">{t.quote}</p>

              <div className="mt-5 flex items-center gap-0.5 text-brand-orange">
                {Array.from({ length: Math.max(0, Math.min(5, Number(t.rating) || 0)) }).map((_, starIndex) => (
                  <Icon key={starIndex} name="star" className="h-4 w-4 fill-current" />
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-11 w-11 rounded-full border border-white/10 object-cover"
                  loading="lazy"
                />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
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
