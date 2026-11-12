import { process as processFallback } from "../../data/siteData";
import Button from "../ui/Button";
import DynIcon from "../ui/DynIcon";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

const STEP_COLORS = [
  "from-brand-blue to-brand-cyan",
  "from-emerald-400 to-teal-500",
  "from-brand-purple to-brand-pink",
  "from-orange-400 to-amber-500",
];

const STEP_GLOW = [
  "rgba(45,124,255,0.5)",
  "rgba(52,211,153,0.5)",
  "rgba(168,85,247,0.5)",
  "rgba(249,115,22,0.5)",
];

export default function Process({ data }) {
  const process = data
    ? {
        ...processFallback,
        ...data,
        titleAccent: data.title_accent ?? data.titleAccent ?? processFallback.titleAccent,
        ctaUrl: data.cta_url ?? data.ctaUrl ?? processFallback.ctaUrl,
        ctaIcon: data.cta_icon ?? data.ctaIcon ?? processFallback.ctaIcon,
        ctaVisible: data.cta_visible ?? data.ctaVisible ?? processFallback.ctaVisible,
        steps: Array.isArray(data.steps) ? data.steps : processFallback.steps,
      }
    : processFallback;

  return (
    <section id="process" className="py-20 lg:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">

        {/* ── Left: sticky heading ── */}
        <Reveal direction="left" className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow={process.eyebrow}
            title={process.title}
            accent={process.titleAccent}
            description={process.description}
          />
          {process.ctaVisible !== false && process.ctaVisible !== 0 && process.ctaVisible !== "0" && (
            <Button
              as={process.ctaUrl ? "a" : "button"}
              href={process.ctaUrl || undefined}
              showIcon={false}
              className="mt-7"
            >
              {process.cta}
              {process.ctaIcon && (
                <DynIcon
                  name={process.ctaIcon}
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              )}
            </Button>
          )}
        </Reveal>

        {/* ── Right: step cards ── */}
        <div className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Animated connector line (desktop only) */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-10 hidden xl:block"
            aria-hidden="true"
          >
            <div className="mx-auto h-[2px] w-[calc(100%-4rem)]"
              style={{
                background:
                  "linear-gradient(90deg, #2d7cff 0%, #22d3ee 25%, #a855f7 50%, #ec4899 75%, #f97316 100%)",
                opacity: 0.25,
              }}
            />
          </div>

          {process.steps.map((step, i) => {
            const color = step.color || STEP_COLORS[i % STEP_COLORS.length];
            const glow = STEP_GLOW[i % STEP_GLOW.length];
            return (
              <Reveal
                as="article"
                key={step.no ?? i}
                direction="up"
                delay={i * 120}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-400
                  hover:-translate-y-2 hover:border-white/15"
                style={{
                  "--glow": glow,
                  transition:
                    "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
                }}
              >
                {/* Background glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${glow.replace("0.5", "0.08")} 0%, transparent 70%)`,
                  }}
                />

                {/* Step connector dot (desktop) */}
                <div
                  className={`absolute -top-[9px] left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full bg-gradient-to-br ${color} xl:block`}
                  style={{ boxShadow: `0 0 10px 2px ${glow}` }}
                  aria-hidden="true"
                />

                {/* Step number */}
                <span className="absolute right-5 top-4 font-display text-4xl font-extrabold transition-all duration-300 group-hover:text-brand-blue/40"
                  style={{ color: "rgba(255,255,255,0.07)" }}>
                  {step.no || String(i + 1).padStart(2, "0")}
                </span>

                {/* Icon */}
                <span
                  className={`relative z-10 mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6`}
                  style={{
                    boxShadow: `0 8px 20px -6px ${glow}`,
                  }}
                >
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>

                <h3 className="relative z-10 text-lg font-semibold transition-colors duration-200 group-hover:text-white">
                  {step.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted">
                  {step.desc}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
