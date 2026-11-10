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

/**
 * App shell shared by every route: animated background, header, the page
 * outlet, the blog-style CTA band and the footer.
 *
 * The current route's content (hero + ordered reusable sections) is loaded
 * once here from the vtech-core plugin and shared via context, so the page
 * body and the footer CTA both read from the same source. Local fallback data
 * keeps the site available if the API is unavailable. Scrolls to top on every
 * route change.
 */
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
    return <div className="min-h-screen bg-ink" aria-busy="true" />;
  }

  // CTA band: WP "cta" section for this page if present, else local fallback.
  const ctaData = page.live ? findCtaData(page.sections) : ctaFallback;
  const contentWarning = page.error || layout.error;

  return (
    <PageContentContext.Provider value={{ ...page, footer: layout.footer }}>
      <div className="relative min-h-screen overflow-hidden bg-ink text-white">
        {/* Ambient animated background blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="animate-blob absolute -top-24 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-brand-purple/15 blur-[90px]" />
          <div className="animate-blob-delay absolute top-1/3 left-[-8rem] h-[22rem] w-[22rem] rounded-full bg-brand-blue/15 blur-[90px]" />
          <div className="animate-blob absolute bottom-0 right-1/4 h-[20rem] w-[20rem] rounded-full bg-brand-cyan/10 blur-[90px]" />
        </div>

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
