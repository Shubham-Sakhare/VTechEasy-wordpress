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

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {process.steps.map((step, i) => (
            <Reveal
              as="article"
              key={step.no}
              direction="up"
              delay={i * 120}
              className="group card card-glow relative p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15"
            >
              <span className="absolute right-5 top-4 font-display text-3xl font-extrabold text-white/10 transition-colors duration-300 group-hover:text-brand-blue/30">
                {step.no || String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${step.color || STEP_COLORS[i % STEP_COLORS.length]} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
              >
                <Icon name={step.icon} className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
