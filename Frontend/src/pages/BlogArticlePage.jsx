import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon";
import { slugify } from "../utils/slug";

const socialIconNames = {
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  "linkedin-in": "linkedin",
  twitter: "twitter",
  x: "twitter",
  youtube: "youtube",
  whatsapp: "whatsapp",
  telegram: "telegram",
};

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
    name: "Telegram",
    icon: "telegram",
    url: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "Email",
    icon: "mail",
    url: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
];

function getCategories(post) {
  const values = post.categories || post.category || post.tag;
  if (!values) return [];
  return (Array.isArray(values) ? values : [values])
    .map((value) => (typeof value === "string" ? value : value?.name || ""))
    .filter(Boolean);
}

function viewCount(value) {
  const match = String(value || "")
    .replace(/,/g, "")
    .match(/([\d.]+)\s*([KMB])?/i);
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

function PostLinks({ posts, ranked = false }) {
  if (!posts.length) {
    return <p className="mt-4 text-sm text-muted">More articles coming soon.</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {posts.map((post, index) => (
        <li key={post.slug || post.title}>
          <Link
            to={`/blog/${post.slug || slugify(post.title)}`}
            className="group flex items-center gap-3"
          >
            {ranked && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-brand-cyan">
                {index + 1}
              </span>
            )}
            {post.image && (
              <img
                src={post.image}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg border border-white/10 object-cover"
                loading="lazy"
              />
            )}
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-medium leading-snug text-white/85 transition-colors group-hover:text-brand-cyan">
                {post.title}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                {ranked ? (
                  <>
                    <Icon name="views" className="h-3 w-3" />
                    {post.views || "Popular"}
                    {post.read ? ` · ${post.read} read` : ""}
                  </>
                ) : (
                  <>
                    <Icon name="calendar" className="h-3 w-3" />
                    {post.date || "Article"}
                  </>
                )}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function BlogArticlePage({
  item,
  posts,
  categories,
  sidebar = {},
  isLive,
  socials = [],
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const image = item.image || item.featured_image || "";
  const content = item.detail_content || item.content || "";
  const articleUrl = typeof window !== "undefined" ? window.location.href : "";
  const articleSocials = socials
    .map((social) => ({
      ...social,
      iconName: socialIconNames[String(social.icon || "").toLowerCase()],
    }))
    .filter((social) => social.iconName);
  const articleCategories = getCategories(item);
  const otherPosts = posts.filter((post) => post !== item);
  const categoryRows = (Array.isArray(categories) ? categories : [])
    .map((category) =>
      typeof category === "string" ? { name: category } : category,
    )
    .filter((category) => category?.name)
    .map((category) => ({
      ...category,
      count: posts.filter((post) =>
        getCategories(post).includes(category.name),
      ).length,
    }));
  const knownCategoryNames = new Set(categoryRows.map(({ name }) => name));
  for (const name of posts.flatMap(getCategories)) {
    if (!knownCategoryNames.has(name)) {
      categoryRows.push({
        name,
        count: posts.filter((post) => getCategories(post).includes(name))
          .length,
      });
      knownCategoryNames.add(name);
    }
  }
  const popularPosts = [...otherPosts]
    .map((post, index) => ({ post, index, views: viewCount(post.views) }))
    .sort((left, right) => right.views - left.views || left.index - right.index)
    .slice(0, 5)
    .map(({ post }) => post);

  async function copyArticleLink() {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Could not copy link. Copy the page URL from your browser.");
    }
  }

  return (
    <article className="container-x pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
      {image && (
        <figure className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-[0_20px_60px_-30px_rgba(45,124,255,0.45)] sm:mb-8">
          <img
            src={image}
            alt={item.title || ""}
            className="aspect-[5/2] w-full object-cover"
            fetchPriority="high"
          />
        </figure>
      )}

      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted sm:mb-6">
        <Link to="/" className="transition-colors hover:text-white">
          Home
        </Link>
        <span className="mx-2">›</span>
        <Link to="/blog" className="transition-colors hover:text-white">
          Blog
        </Link>
        <span className="mx-2">›</span>
        <span className="text-brand-cyan">{item.title}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
        <div className="min-w-0">
          <header className="overflow-hidden rounded-2xl border border-brand-blue/25 bg-gradient-to-br from-ink-800 via-ink to-ink-800/80 p-5 sm:p-8 lg:p-9">
            {articleCategories[0] && (
              <span className="inline-flex rounded-full border border-brand-cyan/25 bg-brand-blue/15 px-3 py-1 text-xs font-semibold text-brand-cyan">
                {articleCategories[0]}
              </span>
            )}
            <h1 className="mt-4 max-w-4xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {item.title}
            </h1>
            {item.excerpt && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">
                {item.excerpt}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-xs text-white/75 sm:text-sm">
              {item.author && (
                <span className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue/20 text-brand-cyan">
                    <Icon name="users" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">
                      {item.author}
                    </span>
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
              {item.read && (
                <span className="flex items-center gap-2">
                  <Icon name="clock" className="h-4 w-4 text-brand-cyan" />
                  {item.read} read
                </span>
              )}
            </div>
          </header>

          <div className="blog-content mt-6 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-6 sm:px-8 sm:py-9">
            {content ? (
              <div
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-sm text-muted">
                {isLive
                  ? "Full article content has not been added to this post yet. Add it in the WordPress Blog editor and save the article."
                  : "Full article content is unavailable in the offline preview. Connect the WordPress backend to load the content saved in the Blog editor."}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            {articleCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-muted">Tags:</span>
                {articleCategories.map((category) => (
                  <Link
                    key={category}
                    to={`/blog?category=${encodeURIComponent(category)}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80 transition hover:border-brand-cyan/40 hover:text-brand-cyan"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {articleSocials.map((social, index) => (
                <a
                  key={`${social.icon}-${index}`}
                  href={social.url || "#"}
                  target={social.url && social.url !== "#" ? "_blank" : undefined}
                  rel={social.url && social.url !== "#" ? "noreferrer" : undefined}
                  aria-label={`Visit ${social.icon} profile`}
                  title={social.icon}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-brand-cyan/40 hover:bg-brand-blue/15 hover:text-brand-cyan"
                >
                  <Icon name={social.iconName} className="h-4 w-4" />
                </a>
              ))}

              <div className="relative">
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
                    aria-label="Share this article"
                    className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-white/10 bg-ink-800 p-2 shadow-xl"
                  >
                    {shareOptions.map((option) => (
                      <a
                        key={option.name}
                        href={option.url(articleUrl, item.title || "")}
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
                      onClick={copyArticleLink}
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

          <Link
            to="/blog"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan transition hover:text-white"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back to all articles
          </Link>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          {categoryRows.length > 0 && (
            <SidebarCard
              title={sidebar.categories_title || "Categories"}
              icon="clipboard"
            >
              <ul className="mt-4 space-y-1.5">
                {categoryRows.map((category) => (
                  <li key={category.name}>
                    <Link
                      to={`/blog?category=${encodeURIComponent(category.name)}`}
                      className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-brand-blue/15"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-md border border-brand-cyan/20 bg-brand-blue/10 text-brand-cyan">
                        <Icon
                          name={category.icon || "code"}
                          className="h-3.5 w-3.5"
                        />
                      </span>
                      <span className="text-sm text-white/80 group-hover:text-white">
                        {category.name}
                      </span>
                      <span className="ml-auto text-xs text-muted">
                        {category.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}

          <SidebarCard
            title={sidebar.recent_title || "Recent Posts"}
            icon="calendar"
          >
            <PostLinks posts={otherPosts.slice(0, 5)} />
          </SidebarCard>

          <SidebarCard title="Popular Posts" icon="views">
            <PostLinks posts={popularPosts} ranked />
          </SidebarCard>
        </aside>
      </div>
    </article>
  );
}
