import { useEffect, useReducer, useRef, useState } from "react";
import { hero } from "../../data/siteData";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

function TitleLine({ text, variant }) {
  if (variant === "cool") return <span className="text-gradient">{text}</span>;
  if (variant === "warm") return <span className="text-gradient-warm">{text}</span>;
  return <span>{text}</span>;
}

/** Animated count-up number on scroll into view */
function CountUp({ target, suffix = "", duration = 1600 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !ran.current) {
          ran.current = true;
          const startTime = performance.now();
          const tick = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

/** Typewriter cycling through words — state machine driven by a single reducer */
function typewriterReducer(state, action) {
  if (action.type === "TICK") {
    const { words, speed, pause } = action;
    const current = words[state.wordIdx % words.length];
    if (!state.deleting && state.charIdx < current.length) {
      return { ...state, charIdx: state.charIdx + 1, display: current.slice(0, state.charIdx + 1), nextDelay: speed };
    }
    if (!state.deleting && state.charIdx >= current.length) {
      return { ...state, deleting: true, nextDelay: pause };
    }
    if (state.deleting && state.charIdx > 0) {
      return { ...state, charIdx: state.charIdx - 1, display: current.slice(0, state.charIdx - 1), nextDelay: speed / 2 };
    }
    return { wordIdx: (state.wordIdx + 1) % words.length, charIdx: 0, display: "", deleting: false, nextDelay: speed };
  }
  return state;
}

function Typewriter({ words, speed = 100, pause = 1800 }) {
  const [state, dispatch] = useReducer(typewriterReducer, {
    wordIdx: 0, charIdx: 0, display: "", deleting: false, nextDelay: speed,
  });

  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: "TICK", words, speed, pause }), state.nextDelay);
    return () => clearTimeout(id);
  }, [state, words, speed, pause]);

  return (
    <span>
      <span className="text-gradient">{state.display}</span>
      <span className="animate-cursor inline-block w-[3px] translate-y-[1px] rounded-sm bg-brand-blue align-middle" style={{ height: "0.9em" }} />
    </span>
  );
}

export default function Hero() {
  const typeWords = ["Web Apps", "Mobile Apps", "Cloud Solutions", "UI/UX Design", "Digital Products"];

  return (
    <section id="home" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36">
      {/* Glow accents */}
      <div className="pointer-events-none absolute -top-24 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-purple/25 blur-[80px] animate-blob" />
      <div className="pointer-events-none absolute top-40 -left-20 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl animate-blob-delay" />
      {/* Decorative grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        {/* ── Left: copy ── */}
        <div>
          <Reveal direction="up" delay={0}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/30 bg-brand-blue/8 px-4 py-1.5 text-xs font-medium text-white/80 animate-glow-pulse">
            {hero.badge.map((b, i) => (
              <span key={b} className="flex items-center gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-brand-cyan animate-twinkle" />}
                {b}
              </span>
            ))}
          </Reveal>

          <Reveal as="h1" direction="up" delay={80}
            className="font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            {hero.titleLines.map((line, i) => (
              <span key={i} className="block">
                <TitleLine {...line} />
              </span>
            ))}
          </Reveal>

          {/* Typewriter line */}
          <Reveal direction="up" delay={160} className="mt-3 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
            We Build <Typewriter words={typeWords} />
          </Reveal>

          <Reveal as="p" direction="up" delay={240}
            className="mt-6 max-w-lg text-base leading-relaxed text-muted">
            {hero.description}
          </Reveal>

          <Reveal direction="up" delay={340} className="mt-8 flex flex-wrap items-center gap-4">
            <Button className="animate-pulse-ring">{hero.primaryCta}</Button>
            <Button variant="outline" icon="play" className="group pl-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition-all duration-200 group-hover:scale-110 group-hover:bg-brand-blue/20">
                <Icon name="play" className="h-3.5 w-3.5 text-brand-cyan" />
              </span>
              {hero.secondaryCta}
            </Button>
          </Reveal>

          {/* Stats row */}
          <Reveal direction="up" delay={440} className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/5 pt-8">
            {[
              { value: 150, suffix: "+", label: "Projects Delivered" },
              { value: 98, suffix: "%", label: "Client Satisfaction" },
              { value: 7, suffix: "+", label: "Years Experience" },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="flex flex-col">
                <span className="font-display text-2xl font-extrabold text-white">
                  <CountUp target={value} suffix={suffix} />
                </span>
                <span className="mt-0.5 text-xs text-muted">{label}</span>
              </div>
            ))}
          </Reveal>

          {/* Highlights */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {hero.highlights.map((h, i) => (
              <Reveal
                key={h.title}
                direction="up"
                delay={520 + i * 100}
                className="group border-beam flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-cyan/30 hover:bg-white/5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-brand-cyan/50 group-hover:scale-110 group-hover:bg-brand-cyan/10">
                  <Icon name={h.icon} className="h-5 w-5 text-brand-cyan" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{h.title}</span>
                  <span className="block text-xs text-muted">{h.sub}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── Right: mockup ── */}
        <Reveal direction="right" delay={180} className="relative">
          <div className="relative mx-auto max-w-xl">
            {/* Multi-layer glow behind image */}
            <div className="animate-gradient absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-blue/30 via-brand-purple/25 to-brand-pink/25 blur-2xl" />
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-brand-purple/10 blur-3xl animate-blob" />

            {/* Orbiting decorative dot */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-4 w-4"
              style={{ transform: "translate(-50%, -50%)" }}>
              <span className="absolute h-3 w-3 rounded-full bg-brand-blue/80 blur-[2px]"
                style={{ animation: "orbit 8s linear infinite" }} />
              <span className="absolute h-2 w-2 rounded-full bg-brand-pink/70 blur-[1px]"
                style={{ animation: "orbit 12s linear infinite reverse", animationDelay: "-4s" }} />
            </div>

            <img
              src={hero.image}
              alt="Product mockup on laptop and phone"
              className="animate-float w-full rounded-2xl border border-white/10 shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
              loading="eager"
            />

            {/* Floating badge cards */}
            <div className="animate-float-slow absolute -left-6 top-1/4 hidden rounded-2xl border border-white/10 bg-ink/80 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-blue/20">
                  <Icon name="zap" className="h-4 w-4 text-brand-blue" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Fast Delivery</p>
                  <p className="text-[10px] text-muted">On-time, every time</p>
                </div>
              </div>
            </div>

            <div className="animate-float absolute -right-4 bottom-1/4 hidden rounded-2xl border border-white/10 bg-ink/80 px-4 py-3 shadow-xl backdrop-blur-xl sm:block"
              style={{ animationDelay: "-3s" }}>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-purple/20">
                  <Icon name="star" className="h-4 w-4 text-brand-purple" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">5★ Rated</p>
                  <p className="text-[10px] text-muted">150+ happy clients</p>
                </div>
              </div>
            </div>
          </div>

          <span className="animate-float-slow absolute -right-2 top-6 hidden rotate-6 font-display text-sm font-semibold text-white/70 sm:block">
            Your Idea <span className="text-gradient-warm">Our Technology</span>
          </span>
        </Reveal>
      </div>
    </section>
  );
}
