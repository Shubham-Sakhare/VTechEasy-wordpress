import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import VHeader from "./vheader";
import VFooter from "./vfooter";
import FooterCta from "../sections/FooterCta";
import { findCtaData } from "../../data/sectionUtils";
import { usePageContent } from "../../hooks/usePageContent";
import { useLayout } from "../../hooks/useLayout";
import { PageContentContext } from "../../hooks/PageContentContext";
import { pageFallbacks, pathToSlug, ctaFallback } from "../../data/pageFallbacks";

/** Static particle positions — avoids layout shift from random on every render */
const PARTICLES = [
  { x: "12%",  y: "18%",  size: 3, delay: "0s",    dur: "6s"  },
  { x: "88%",  y: "22%",  size: 2, delay: "1.2s",  dur: "7s"  },
  { x: "35%",  y: "65%",  size: 4, delay: "2.4s",  dur: "5s"  },
  { x: "72%",  y: "78%",  size: 2, delay: "0.6s",  dur: "8s"  },
  { x: "55%",  y: "12%",  size: 3, delay: "3s",    dur: "6.5s"},
  { x: "20%",  y: "88%",  size: 2, delay: "1.8s",  dur: "7.5s"},
  { x: "90%",  y: "55%",  size: 4, delay: "0.3s",  dur: "5.5s"},
  { x: "45%",  y: "40%",  size: 2, delay: "2s",    dur: "9s"  },
  { x: "8%",   y: "50%",  size: 3, delay: "4s",    dur: "6s"  },
  { x: "65%",  y: "95%",  size: 2, delay: "1.5s",  dur: "7s"  },
  { x: "78%",  y: "35%",  size: 2, delay: "3.5s",  dur: "8s"  },
  { x: "30%",  y: "5%",   size: 3, delay: "2.8s",  dur: "5s"  },
];

export default function Layout() {
  const { pathname } = useLocation();
  const slug = pathToSlug(pathname);
  const fallback = pageFallbacks[slug] || { hero: null, sections: [] };

  const page = usePageContent(slug, fallback);
  const layout = useLayout();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (page.loading || layout.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink" aria-busy="true">
        {/* Animated loading indicator */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-brand-blue/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-blue" />
          <div className="h-2 w-2 rounded-full bg-brand-blue animate-glow-pulse" />
        </div>
      </div>
    );
  }

  const ctaData = page.live ? findCtaData(page.sections) : ctaFallback;
  const contentWarning = page.error || layout.error;

  return (
    <PageContentContext.Provider value={{ ...page, footer: layout.footer }}>
      <div className="relative min-h-screen overflow-hidden bg-ink text-white">

        {/* ── Layer 1: Large ambient blobs (slow drift) ── */}
        <div className="pointer-events-none fixed inset-0 -z-20">
          <div className="animate-blob absolute -top-24 right-[-6rem] h-[30rem] w-[30rem] rounded-full bg-brand-purple/15 blur-[100px]" />
          <div className="animate-blob-delay absolute top-1/3 left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-brand-blue/15 blur-[100px]" />
          <div className="animate-blob absolute bottom-0 right-1/4 h-[22rem] w-[22rem] rounded-full bg-brand-cyan/10 blur-[100px]" />
          {/* Extra blobs for depth */}
          <div className="animate-blob absolute top-2/3 right-1/3 h-[18rem] w-[18rem] rounded-full bg-brand-pink/8 blur-[80px]"
            style={{ animationDelay: "-9s", animationDuration: "24s" }} />
          <div className="animate-blob-delay absolute bottom-1/4 left-1/4 h-[20rem] w-[20rem] rounded-full bg-brand-purple/10 blur-[90px]"
            style={{ animationDelay: "-14s" }} />
        </div>

        {/* ── Layer 2: Grid / dot pattern ── */}
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* ── Layer 3: Floating particles ── */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-brand-blue/60 animate-twinkle"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.dur,
              }}
            />
          ))}
          {/* Purple particles */}
          {PARTICLES.slice(0, 6).map((p, i) => (
            <span
              key={`p-${i}`}
              className="absolute rounded-full bg-brand-purple/50 animate-twinkle-delay"
              style={{
                left: `${100 - parseFloat(p.x)}%`,
                top: `${100 - parseFloat(p.y)}%`,
                width: p.size - 1 || 1,
                height: p.size - 1 || 1,
                animationDelay: p.delay,
                animationDuration: p.dur,
              }}
            />
          ))}
        </div>

        {/* ── Layer 4: Subtle vignette edges ── */}
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(5,8,22,0.5) 100%)",
          }}
        />

        <VHeader />

        {contentWarning && (
          <p
            role="status"
            className="container-x pt-3 text-center text-xs text-amber-200/80"
          >
            Live website content is unavailable. Showing saved content instead.
          </p>
        )}

        <main>
          <Outlet />
        </main>

        {ctaData && <FooterCta data={ctaData} />}
        <VFooter />
      </div>
    </PageContentContext.Provider>
  );
}
