import { useRef } from "react";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";
import Reveal from "../ui/Reveal";

const EMPTY_LIST = [];

/**
 * TeamSection – showcases team members with animated GIFs that redirect to
 * each member's personal / portfolio website.
 *
 * Data shape (from WP or fallback):
 *   {
 *     eyebrow: string,
 *     title: string,
 *     accent: string,
 *     description: string,
 *     cta: string,
 *     cta_url: string,
 *     cta_visible: boolean,
 *     members: [
 *       { name, role, gif (image URL), website (redirect URL), bio? }
 *     ]
 *   }
 *
 * Falls back to null when no title and no members are provided.
 */
export default function TeamSection({ data = {}, isParent = true }) {
  const cardsRef = useRef(null);
  const team = { ...(data || {}) };
  const members = Array.isArray(team.members) ? team.members : EMPTY_LIST;
  if (!team.title && !members.length) return null;

  // On secondary pages: featured members in an arrow-scrolled strip.
  const scroll = !isParent;

  const scrollCards = (direction) => {
    const container = cardsRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * container.clientWidth, behavior: "smooth" });
  };

  return (
    <section id="team" className="py-20 lg:py-28">
      <div className="container-x">
        {/* Heading */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionHeading
            align="center"
            eyebrow={team.eyebrow}
            title={team.title}
            accent={team.accent}
            description={team.description}
          />
        </Reveal>

        {/* Member grid */}
        <div
          ref={cardsRef}
          className={
            scroll
              ? "mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          }
        >
          {members.map((m, i) => (
            <Reveal
              as="article"
              key={m.name || `member-${i}`}
              direction="up"
              delay={i * 100}
              className="group card card-glow overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15"
            >
              {/* GIF wrapped in a link to the member's website */}
              {m.gif && (
                <a
                  href={m.website || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-[4/3] overflow-hidden"
                  aria-label={`Visit ${m.name || "team member"}'s website`}
                >
                  <img
                    src={m.gif}
                    alt={m.name || "Team member"}
                    className="absolute inset-0 h-full w-full object-fill transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-ink/40 group-hover:bg-ink/20 transition-colors" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between p-4 pointer-events-none">
                    <span className="text-xs font-semibold text-white bg-ink/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                      {m.role}
                    </span>
                    <span className="text-xs font-semibold text-brand-cyan bg-ink/80 backdrop-blur px-2.5 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      Visit site
                    </span>
                  </div>
                </a>
              )}

              <div className="mt-5 p-4">
                <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                {m.role && (
                  <p className="mt-0.5 text-xs text-brand-cyan">{m.role}</p>
                )}
                {m.bio && (
                  <p className="mt-2.5 text-xs leading-relaxed text-white/70">{m.bio}</p>
                )}
                {m.website && (
                  <a
                    href={m.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-cyan transition-colors"
                  >
                    Visit website
                    <svg
                      className="h-3 w-3 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Scroll footer for secondary pages */}
        {scroll && (
          <SectionFooter
            showViewAll={isToggleOn(team.cta_visible ?? Boolean(team.cta))}
            label={team.cta || "Meet Our Team"}
            url={team.cta_url || "/about"}
            showArrows={members.length > 3}
            onPrev={() => scrollCards(-1)}
            onNext={() => scrollCards(1)}
            arrowLabel="team members"
          />
        )}
      </div>
    </section>
  );
}