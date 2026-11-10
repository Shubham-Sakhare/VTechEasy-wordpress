import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon";
import { slugify } from "../utils/slug";

const shareOptions = [
  {
    name: "Facebook",
    icon: "facebook",
    url: (url, title) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
  },
  {
    name: "X",
    icon: "twitter",
    url: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    url: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    icon: "whatsapp",
    url: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: "Email",
    icon: "mail",
    url: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
];

function getCategories(service) {
  const values = service.categories || service.category;
  if (values) {
    return (Array.isArray(values) ? values : [values])
      .map((value) => (typeof value === "string" ? value : value?.name || ""))
      .filter(Boolean);
  }
  return service.title ? [service.title] : [];
}

function SidebarCard({ title, icon, children }) {
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon name={icon} className="h-4 w-4 text-brand-cyan" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function ServiceLinks({ services }) {
  if (!services.length) {
    return <p className="mt-4 text-sm text-muted">More services coming soon.</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {services.map((service) => (
        <li key={service.slug || slugify(service.title)}>
          <Link
            to={`/services/${service.slug || slugify(service.title)}`}
            className="group flex items-center gap-3"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-blue/25 to-brand-purple/25 text-brand-cyan">
              <Icon name={service.icon || "code"} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-medium leading-snug text-white/85 transition-colors group-hover:text-brand-cyan">
                {service.title}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {getCategories(service)[0] || "Service"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ServiceArticlePage({ item, services }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const title = item.title || "Service";
  const url = typeof window !== "undefined" ? window.location.href : "";
  const categories = getCategories(item);
  const otherServices = services.filter((service) => service !== item);
  const popularServices = otherServices.filter((service) =>
    Boolean(Number(service.popular)),
  );
  const displayedPopular = (popularServices.length ? popularServices : otherServices).slice(0, 5);
  const categoryRows = [...new Set(services.flatMap(getCategories))].map((name) => ({
    name,
    count: services.filter((service) => getCategories(service).includes(name)).length,
  }));
  const flow = Array.isArray(item.flow) ? item.flow.filter((step) => step?.title || step?.desc) : [];
  const content = item.detail_content || item.content || "";

  async function copyServiceLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Could not copy link. Copy the page URL from your browser.");
    }
  }

  return (
    <article className="container-x pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
      {item.image && (
        <figure className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-[0_20px_60px_-30px_rgba(45,124,255,0.45)] sm:mb-8">
          <img
            src={item.image}
            alt={title}
            className="aspect-[5/2] w-full object-cover"
            fetchPriority="high"
          />
        </figure>
      )}

      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted sm:mb-6">
        <Link to="/" className="transition-colors hover:text-white">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/services" className="transition-colors hover:text-white">Services</Link>
        <span className="mx-2">›</span>
        <span className="text-brand-cyan">{title}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
        <div className="min-w-0">
          <header className="overflow-hidden rounded-2xl border border-brand-blue/25 bg-gradient-to-br from-ink-800 via-ink to-ink-800/80 p-5 sm:p-8 lg:p-9">
            {categories[0] && (
              <span className="inline-flex rounded-full border border-brand-cyan/25 bg-brand-blue/15 px-3 py-1 text-xs font-semibold text-brand-cyan">
                {categories[0]}
              </span>
            )}
            <h1 className="mt-4 max-w-4xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {title}
            </h1>
            {item.desc && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
                {item.desc}
              </p>
            )}
          </header>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-6 sm:px-8 sm:py-9">
            <h2 className="mb-5 font-display text-xl font-bold">Service Details</h2>
            {content ? (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: content }} />
            ) : item.desc ? (
              <p className="leading-relaxed text-white/75">{item.desc}</p>
            ) : (
              <p className="text-sm text-muted">Service details have not been added yet.</p>
            )}
          </section>

          {flow.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-5 font-display text-xl font-bold">Our Service Flow</h2>
              <ol className="grid gap-4 sm:grid-cols-2">
                {flow.map((step, index) => (
                  <li
                    key={`${step.title || "step"}-${index}`}
                    className="card flex gap-4 p-5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue/20 text-sm font-bold text-brand-cyan">
                      {index + 1}
                    </span>
                    <span>
                      {step.title && <span className="block font-semibold">{step.title}</span>}
                      {step.desc && <span className="mt-1 block text-sm leading-relaxed text-muted">{step.desc}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-muted">Tags:</span>
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={`/services?category=${encodeURIComponent(category)}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80 transition hover:border-brand-cyan/40 hover:text-brand-cyan"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}

            <div className="relative ml-auto">
              <button
                type="button"
                aria-expanded={shareOpen}
                aria-haspopup="true"
                onClick={() => {
                  setShareOpen((open) => !open);
                  setCopyStatus("");
                }}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-blue/10 px-3 text-xs font-semibold text-brand-cyan transition hover:bg-brand-blue/20"
              >
                <Icon name="share" className="h-4 w-4" />
                Share
              </button>
              {shareOpen && (
                <div
                  role="menu"
                  aria-label="Share this service"
                  className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-white/10 bg-ink-800 p-2 shadow-xl"
                >
                  {shareOptions.map((option) => (
                    <a
                      key={option.name}
                      href={option.url(url, title)}
                      target={option.name === "Email" ? undefined : "_blank"}
                      rel={option.name === "Email" ? undefined : "noreferrer"}
                      role="menuitem"
                      onClick={() => setShareOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <Icon name={option.icon} className="h-4 w-4 text-brand-cyan" />
                      {option.name}
                    </a>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={copyServiceLink}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="link" className="h-4 w-4 text-brand-cyan" />
                    Copy link
                  </button>
                  {copyStatus && <p role="status" className="px-3 py-2 text-xs text-brand-cyan">{copyStatus}</p>}
                </div>
              )}
            </div>
          </div>

          {(() => {
            const btnUrl = item.button_url || "/contact#contact-form";
            const btnText = item.button_text || "Get a Free Consultation";
            const btnClass = "mt-8 inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-3 text-sm font-semibold text-white";
            return btnUrl.startsWith("/") ? (
              <Link to={btnUrl} className={btnClass}>
                {btnText}
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            ) : (
              <a href={btnUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
                {btnText}
                <Icon name="arrowRight" className="h-4 w-4" />
              </a>
            );
          })()}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          {categoryRows.length > 0 && (
            <SidebarCard title="Service Categories" icon="clipboard">
              <ul className="mt-4 space-y-1.5">
                {categoryRows.map((category) => (
                  <li key={category.name}>
                    <Link
                      to={`/services?category=${encodeURIComponent(category.name)}`}
                      className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-brand-blue/15"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-md border border-brand-blue/25 bg-brand-blue/10 text-brand-cyan">
                        <Icon name="code" className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm text-white/80 group-hover:text-white">{category.name}</span>
                      <span className="ml-auto text-xs text-muted">{category.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}

          <SidebarCard title="Popular Services" icon="views">
            <ServiceLinks services={displayedPopular} />
          </SidebarCard>

          <section className="rounded-2xl border border-brand-blue/25 bg-gradient-to-br from-brand-blue/20 via-ink-800 to-brand-purple/15 p-5">
            <h2 className="font-display text-lg font-bold">Need expert advice?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Talk with our team about the right solution for your business.
            </p>
            {(() => {
              const btnUrl = item.button_url || "/contact#contact-form";
              const btnText = item.button_text || "Get a Free Consultation";
              const btnClass = "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full btn-gradient px-4 py-3 text-sm font-semibold text-white";
              return btnUrl.startsWith("/") ? (
                <Link to={btnUrl} className={btnClass}>
                  {btnText}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              ) : (
                <a href={btnUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
                  {btnText}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </a>
              );
            })()}
          </section>
        </aside>
      </div>
    </article>
  );
}
