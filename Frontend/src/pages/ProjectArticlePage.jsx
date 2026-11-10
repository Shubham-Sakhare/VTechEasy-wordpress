import { useRef, useState } from "react";
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

function listNames(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (typeof value === "string" ? value : value?.name || ""))
    .filter(Boolean);
}

function getCategories(item) {
  const values = item.categories || item.category || item.tag;
  if (!values) return [];
  return (Array.isArray(values) ? values : [values])
    .map((value) => (typeof value === "string" ? value : value?.name || ""))
    .filter(Boolean);
}

function viewCount(value) {
  const match = String(value || "").replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
  return Number(match[1]) * (multiplier[match[2]?.toUpperCase()] || 1);
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

function ProjectLinks({ projects, listPath }) {
  if (!projects.length) {
    return <p className="mt-4 text-sm text-muted">More projects coming soon.</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {projects.map((project) => (
        <li key={project.slug || project.title}>
          <Link
            to={`${listPath}/${project.slug || slugify(project.title)}`}
            className="group flex items-center gap-3"
          >
            {project.image && (
              <img
                src={project.image}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg border border-white/10 object-cover"
                loading="lazy"
              />
            )}
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-medium leading-snug text-white/85 transition-colors group-hover:text-brand-cyan">
                {project.title}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {project.date || "Project"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProjectGallery({ item }) {
  const trackRef = useRef(null);
  const images = (Array.isArray(item.gallery) ? item.gallery : [])
    .map((image) =>
      typeof image === "string" ? image : image?.image || image?.url || "",
    )
    .filter((image, index, all) => image && all.indexOf(image) === index);

  if (!images.length) return null;

  function scrollGallery(direction) {
    const track = trackRef.current;
    if (!track) return;
    const firstImage = track.querySelector("[data-gallery-image]");
    const distance = firstImage
      ? firstImage.getBoundingClientRect().width + 16
      : track.clientWidth;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  return (
    <section className="mt-8" aria-label="Project gallery">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold sm:text-xl">Project Gallery</h2>
        {images.length > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollGallery(-1)}
              aria-label="Scroll gallery left"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-brand-cyan/40 hover:text-brand-cyan"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollGallery(1)}
              aria-label="Scroll gallery right"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-brand-cyan/40 hover:text-brand-cyan"
            >
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4"
        tabIndex={images.length > 1 ? 0 : undefined}
        aria-label="Project screenshots; scroll horizontally to view more"
      >
        {images.map((image, index) => (
          <figure
            key={`${image}-${index}`}
            data-gallery-image
            className="w-[88%] flex-none snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-800 sm:w-[70%] lg:w-[78%]"
          >
            <img
              src={image}
              alt={`${item.title} screenshot ${index + 1}`}
              className="aspect-[16/10] w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function ProjectArticlePage({ item, projects, listPath }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = item.title || "Project";
  const categories = getCategories(item);
  const technologies = listNames(item.tech);
  const content = item.detail_content || item.content || "";
  const recentProjects = projects.filter((project) => project !== item).slice(0, 5);
  const popularProjects = projects
    .map((project, index) => ({
      project,
      index,
      views: viewCount(project.views),
      featured: Number(project.feature || 0),
    }))
    .filter(({ project }) => project !== item)
    .sort(
      (left, right) =>
        right.views - left.views ||
        right.featured - left.featured ||
        left.index - right.index,
    )
    .slice(0, 5)
    .map(({ project }) => project);

  async function copyProjectLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Could not copy link. Copy the page URL from your browser.");
    }
  }

  return (
    <article className="container-x pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
      {(item.image || item.featured_image) && (
        <figure className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-[0_20px_60px_-30px_rgba(45,124,255,0.45)] sm:mb-8">
          <img
            src={item.image || item.featured_image}
            alt={title}
            className="aspect-[5/2] w-full object-cover"
            fetchPriority="high"
          />
        </figure>
      )}

      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted sm:mb-6">
        <Link to="/" className="transition-colors hover:text-white">Home</Link>
        <span className="mx-2">›</span>
        <Link to={listPath} className="transition-colors hover:text-white">Portfolio</Link>
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
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-xs text-white/75 sm:text-sm">
              {item.author && (
                <span className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue/20 text-brand-cyan">
                    <Icon name="users" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{item.author}</span>
                    <span className="text-xs text-muted">Author</span>
                  </span>
                </span>
              )}
              {item.date && (
                <span className="flex items-center gap-2">
                  <Icon name="calendar" className="h-4 w-4 text-brand-cyan" />
                  {item.date}
                </span>
              )}
            </div>
          </header>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-6 sm:px-8 sm:py-9">
            <h2 className="mb-5 font-display text-xl font-bold">Project Details</h2>
            {content ? (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: content }} />
            ) : item.desc ? (
              <p className="leading-relaxed text-white/75">{item.desc}</p>
            ) : (
              <p className="text-sm text-muted">Project details have not been added yet.</p>
            )}
          </section>

          <ProjectGallery item={item} />

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-muted">Tags:</span>
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80"
                  >
                    {category}
                  </span>
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
                  aria-label="Share this project"
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
                    onClick={copyProjectLink}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="link" className="h-4 w-4 text-brand-cyan" />
                    Copy link
                  </button>
                  {copyStatus && (
                    <p role="status" className="px-3 py-2 text-xs text-brand-cyan">
                      {copyStatus}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <SidebarCard title="Tech Stack" icon="code">
            {technologies.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {technologies.map((technology) => (
                  <span
                    key={technology}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No technologies listed.</p>
            )}
          </SidebarCard>

          <SidebarCard title="Recent Projects" icon="calendar">
            <ProjectLinks projects={recentProjects} listPath={listPath} />
          </SidebarCard>

          <SidebarCard title="Popular Projects" icon="views">
            <ProjectLinks projects={popularProjects} listPath={listPath} />
          </SidebarCard>
        </aside>
      </div>
    </article>
  );
}
