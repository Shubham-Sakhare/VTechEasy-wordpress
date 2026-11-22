import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Layout = lazy(() => import("./components/layout/Layout"));
const Home = lazy(() => import("./pages/Home"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-muted" role="status">
          Loading page...
        </div>
      }
    >
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<DetailPage kind="service" />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="portfolio/:slug" element={<DetailPage kind="portfolio" />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<DetailPage kind="blog" />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
