import { useState } from "react";
import { submitNewsletterForm } from "../../api/wordpress";
import { footerCta as footerCtaFallback } from "../../data/siteData";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

export default function FooterCta({ data }) {
  const footerCta = data || footerCtaFallback;
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [focused, setFocused] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const result = await submitNewsletterForm({
        email: values.get("email"),
        website: values.get("website"),
      });
      form.reset();
      setStatus({ state: "success", message: result.message });
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <section className="relative py-16 lg:py-24">
      <div className="container-x">
        <Reveal direction="scale">
          <div className="relative isolate overflow-hidden rounded-[2rem] px-8 py-14 sm:px-14 sm:py-16 lg:px-20 lg:py-20">

            {/* ── Deep layered background ── */}
            <div className="absolute inset-0 -z-20 bg-[#09082e]" />
            {/* Main gradient blob centre */}
            <div className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(168,85,247,0.35) 0%, rgba(45,124,255,0.25) 45%, transparent 75%)",
              }}
            />
            {/* Top-left streak */}
            <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-[500px] w-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(45,124,255,0.3) 0%, transparent 70%)" }}
            />
            {/* Bottom-right streak */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 -z-10 h-[400px] w-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)" }}
            />
            {/* Noise texture overlay */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "150px" }}
            />
            {/* Shimmer sweep */}
            <div className="animate-shimmer pointer-events-none absolute inset-0 -z-10" />
            {/* Border glow ring */}
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />

            {/* ── Grid dots pattern (top half) ── */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* ── Main layout ── */}
            <div className="flex flex-col items-center gap-10 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:text-left">

              {/* ── LEFT column ── */}
              <div className="flex max-w-xl flex-col items-center lg:items-start">

                {/* Animated eyebrow chip */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-purple/40 bg-brand-purple/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-purple">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-purple opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-purple" />
                  </span>
                  {footerCta.eyebrow || "Stay Connected"}
                </div>

                {/* Heading */}
                <h2 className="font-display text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
                  {footerCta.title || "Get the Latest"}{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(90deg, #a855f7, #2d7cff, #22d3ee)" }}
                  >
                    Tech Updates
                  </span>
                </h2>

                {/* Description */}
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
                  {footerCta.description ||
                    "Subscribe for the latest technology trends, expert insights, and digital solutions to grow your business."}
                </p>

                {/* Social proof row */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                  {[
                    { icon: "users", value: "10K+", label: "Subscribers" },
                    { icon: "zap", value: "Weekly", label: "Fresh content" },
                    { icon: "shield", value: "Zero", label: "Spam" },
                  ].map(({ icon, value, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <Icon name={icon} className="h-4 w-4 text-brand-purple" />
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-sm font-bold text-white">{value}</p>
                        <p className="text-[11px] text-white/50">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT column — form card ── */}
              <div className="w-full max-w-sm shrink-0 lg:max-w-[380px]">
                {status.state === "success" ? (
                  /* ── Success state ── */
                  <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur-xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
                      <Icon name="checkCircle" className="h-8 w-8 text-green-400" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-white">You're subscribed!</p>
                      <p className="mt-1 text-sm text-white/60">{status.message || "Welcome to the community."}</p>
                    </div>
                  </div>
                ) : (
                  /* ── Form card ── */
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-7">
                    {/* Card header */}
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-purple/30 bg-brand-purple/15">
                        <Icon name="rocket" className="h-5 w-5 animate-float text-brand-purple" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">Newsletter</p>
                        <p className="text-xs text-white/50">Join 10,000+ tech professionals</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      {/* Email input */}
                      <div
                        className={`flex items-center gap-2 rounded-2xl border px-4 transition-all duration-200 ${
                          focused
                            ? "border-brand-purple/60 bg-brand-purple/5 ring-2 ring-brand-purple/20"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <Icon name="mail" className="h-4 w-4 shrink-0 text-white/30" />
                        <input
                          name="email"
                          type="email"
                          required
                          maxLength={254}
                          placeholder={footerCta.placeholder || "yourname@example.com"}
                          aria-label="Email address"
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          className="w-full bg-transparent py-4 text-sm text-white placeholder:text-white/30 outline-none"
                        />
                      </div>

                      {/* Honeypot */}
                      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                        <label htmlFor="newsletter-website">Leave this field empty</label>
                        <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                      </div>

                      {/* CTA button */}
                      <button
                        type="submit"
                        disabled={status.state === "loading"}
                        className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-sm font-bold text-white transition-all duration-200 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #a855f7 0%, #2d7cff 100%)" }}
                      >
                        {/* Button shimmer on hover */}
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                        {status.state === "loading" ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Subscribing…
                          </>
                        ) : (
                          <>
                            {footerCta.button || "Subscribe Now"}
                            <Icon name="send" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </>
                        )}
                      </button>

                      {/* Error message */}
                      {status.state === "error" && status.message && (
                        <p
                          role="alert"
                          aria-live="polite"
                          className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs text-red-300"
                        >
                          <Icon name="zap" className="h-3.5 w-3.5 shrink-0" />
                          {status.message}
                        </p>
                      )}

                      {/* Fine print */}
                      <p className="text-center text-[11px] leading-relaxed text-white/35">
                        No spam. Unsubscribe anytime. By subscribing you agree to our{" "}
                        <a href="/privacy-policy" className="text-white/55 underline underline-offset-2 hover:text-white/80 transition-colors">
                          Privacy Policy
                        </a>.
                      </p>
                    </form>
                  </div>
                )}

                {/* Avatar stack below card */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {["#a855f7","#2d7cff","#22d3ee","#ec4899","#f97316"].map((color, i) => (
                      <div
                        key={i}
                        className="h-7 w-7 rounded-full border-2 border-[#09082e] text-[10px] font-bold text-white flex items-center justify-center"
                        style={{ background: color }}
                      >
                        {["A","B","C","D","E"][i]}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/50">
                    <span className="font-semibold text-white/80">+10K</span> already joined
                  </p>
                </div>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
