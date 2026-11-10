import { hero } from "../../data/siteData";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

function TitleLine({ text, variant }) {
  if (variant === "cool") return <span className="text-gradient">{text}</span>;
  if (variant === "warm") return <span className="text-gradient-warm">{text}</span>;
  return <span>{text}</span>;
}

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36">
      {/* Glow accents */}
      <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-20 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl" />

      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        {/* Left: copy */}
        <div>
          <Reveal direction="up" delay={0} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
            {hero.badge.map((b, i) => (
              <span key={b} className="flex items-center gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-brand-cyan" />}
                {b}
              </span>
            ))}
          </Reveal>

          <Reveal as="h1" direction="up" delay={80} className="font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            {hero.titleLines.map((line, i) => (
              <span key={i} className="block">
                <TitleLine {...line} />
              </span>
            ))}
          </Reveal>

          <Reveal as="p" direction="up" delay={200} className="mt-6 max-w-lg text-base leading-relaxed text-muted">
            {hero.description}
          </Reveal>

          <Reveal direction="up" delay={300} className="mt-8 flex flex-wrap items-center gap-4">
            <Button className="animate-pulse-ring">{hero.primaryCta}</Button>
            <Button variant="outline" icon="play" className="group pl-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition-transform duration-200 group-hover:scale-110">
                <Icon name="play" className="h-3.5 w-3.5" />
              </span>
              {hero.secondaryCta}
            </Button>
          </Reveal>

          {/* Highlights */}
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {hero.highlights.map((h, i) => (
              <Reveal
                key={h.title}
                direction="up"
                delay={420 + i * 120}
                className="group flex items-center gap-3"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:ring-brand-cyan/50">
                  <Icon name={h.icon} className="h-5 w-5 text-brand-cyan" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="block text-xs text-muted">{h.sub}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Right: mockup */}
        <Reveal direction="right" delay={150} className="relative">
          <div className="relative mx-auto max-w-xl">
            <div className="animate-gradient absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-blue/30 via-brand-purple/25 to-brand-pink/25 blur-2xl" />
            <img
              src={hero.image}
              alt="Product mockup on laptop and phone"
              className="animate-float w-full rounded-2xl border border-white/10 shadow-2xl"
              loading="eager"
            />
          </div>
          <span className="animate-float-slow absolute -right-2 top-6 hidden rotate-6 font-display text-sm font-semibold text-white/70 sm:block">
            Your Idea <span className="text-gradient-warm">Our Technology</span>
          </span>
        </Reveal>
      </div>
    </section>
  );
}
