import { useState } from "react";
import { submitNewsletterForm } from "../../api/wordpress";
import { footerCta as footerCtaFallback } from "../../data/siteData";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

/**
 * Blog-style "Stay Updated" CTA band shown above the footer on every page.
 * Mirrors the purple gradient newsletter band from the Blog screenshot.
 * Accepts optional `data` from the WordPress "CTA Band" section.
 */
export default function FooterCta({ data }) {
  const footerCta = data || footerCtaFallback;
  const [status, setStatus] = useState({ state: "idle", message: "" });

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
        message: error instanceof Error ? error.message : "Your request could not be sent. Please try again.",
      });
    }
  }

  return (
    <section className="pb-10 pt-4 lg:pb-16">
      <div className="container-x">
        <Reveal
          direction="scale"
          className="animate-shimmer relative overflow-hidden rounded-3xl border border-white/10 p-7 sm:p-9 lg:p-11"
        >
          {/* Animated gradient background */}
          <div className="animate-gradient absolute inset-0 -z-10 bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink opacity-90" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_20rem_at_85%_120%,rgba(255,255,255,0.25),transparent)]" />

          {/* Decorative floating blobs */}
          <div className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 bottom-0 h-20 w-20 rounded-full bg-white/10 blur-xl" />

          <div className="flex flex-col items-start gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 sm:grid">
                <Icon name="rocket" className="animate-float h-7 w-7 text-white" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                  {footerCta.eyebrow}
                </span>
                <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {footerCta.title}
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/90">
                  {footerCta.description}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative flex w-full max-w-md flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                placeholder={footerCta.placeholder}
                aria-label="Email address"
                className="w-full rounded-full border border-white/30 bg-white/15 px-5 py-3 text-sm text-white placeholder:text-white/70 outline-none backdrop-blur-sm transition focus:border-white/60 focus:bg-white/20"
              />
              <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                <label htmlFor="newsletter-website">Leave this field empty</label>
                <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={status.state === "loading"}
                className="shrink-0 border-white/40 bg-white text-ink hover:bg-white/90"
              >
                {status.state === "loading" ? "Sending..." : footerCta.button}
              </Button>
              {status.message && (
                <p
                  className={`w-full text-sm ${status.state === "error" ? "text-white" : "text-white/90"}`}
                  role={status.state === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {status.message}
                </p>
              )}
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
