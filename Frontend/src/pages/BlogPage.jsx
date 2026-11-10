import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { blogPage } from "../data/siteData";
import { usePageContext } from "../hooks/PageContentContext";
import HeroSlider from "../components/sections/HeroSlider";
import SectionRenderer from "../components/sections/SectionRenderer";
import SectionHeading from "../components/ui/SectionHeading";
import Icon from "../components/ui/Icon";
import Reveal from "../components/ui/Reveal";
import { slugify } from "../utils/slug";

const categoryColors = [
  "bg-brand-blue",
  "bg-brand-purple",
  "bg-brand-pink",
  "bg-brand-cyan",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-orange-500",
];
const pageSize = 6;
const EMPTY_POSTS = [];

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((category) =>
      typeof category === "string" ? category : category?.name || "",
    )
    .filter(Boolean);
}

function PostCard({ post, delay }) {
  const categories = normalizeCategories(post.categories);
  const tag = categories[0] || post.tag || "Article";

  return (
    <Reveal
      as="article"
      direction="up"
      delay={delay}
      className="group card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-white/15 hover:shadow-[0_30px_70px_-25px_rgba(45,124,255,0.5)]"
    >
      <Link
        to={`/blog/${post.slug || slugify(post.title)}`}
        className="block w-full text-left"
        aria-label={`Read ${post.title}`}
      >
        <div className="relative overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span className={`absolute left-3 top-3 rounded-full ${post.tagColor || "bg-brand-blue"} px-3 py-1 text-xs font-semibold text-white shadow`}>
            {tag}
          </span>
          {post.featured && (
            <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
              Featured
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-base font-semibold leading-snug transition-colors group-hover:text-brand-cyan">{post.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
          <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><Icon name="calendar" className="h-3.5 w-3.5" />{post.date}</span>
            <span className="flex items-center gap-1.5"><Icon name="views" className="h-3.5 w-3.5" />{post.views}</span>
            <span className="flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5" />{post.read}</span>
            <span className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/5 text-brand-cyan ring-1 ring-white/10 transition-all group-hover:bg-brand-blue group-hover:text-white">
              <Icon name="arrowRight" className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export default function BlogPage() {
  const { sections, hero, live } = usePageContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const contentSection = sections.find((section) => section?.type === "blog_content");
  const data = live && contentSection?.data ? contentSection.data : null;
  const heading = live ? data?.heading || {} : blogPage.heading;
  const rawPosts = live
    ? Array.isArray(data?.posts) ? data.posts : EMPTY_POSTS
    : blogPage.posts;
  const posts = useMemo(
    () =>
      rawPosts
        .filter(
          (post) =>
            post &&
            (data
              ? post.published === undefined || Boolean(Number(post.published))
              : true),
        )
        .map((post) => {
          const categories = normalizeCategories(post.categories);
          return {
            ...post,
            categories,
            tag: categories[0] || post.tag || "",
            tagColor:
              post.tagColor ||
              categoryColors[
                Math.max(
                  0,
                  (data?.categories || blogPage.categories).findIndex((category) =>
                    categories.includes(category.name),
                  ),
                ) % categoryColors.length
              ],
            views: post.views || "",
            read: post.read || "",
          };
        }),
    [data, rawPosts],
  );
  const categories = useMemo(
    () =>
      (live
        ? Array.isArray(data?.categories) ? data.categories : []
        : blogPage.categories
      ).map((category) => ({
        ...category,
        count: posts.filter((post) =>
          normalizeCategories(post.categories).includes(category.name),
        ).length,
      })),
    [data, live, posts],
  );
  const sidebar = live ? data?.sidebar || {} : {
    search_placeholder: "Search blogs...",
    categories_title: "Categories",
    categories_link: "View All",
    recent_title: "Recent Posts",
    recent_link: "View All",
  };

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get("category") || "",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const selectedPost =
    posts.find((post) => post.slug === searchParams.get("post")) ||
    null;
  function closePost() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("post");
    setSearchParams(nextParams, { replace: true });
  }
  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesCategory =
          !activeCategory ||
          normalizeCategories(post.categories).includes(activeCategory);
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          `${post.title || ""} ${post.excerpt || ""}`.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      }),
    [activeCategory, posts, search],
  );
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const visiblePosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const recent = posts.slice(0, 5);

  function selectCategory(name) {
    setActiveCategory((current) => (current === name ? "" : name));
    setCurrentPage(1);
  }

  function submitSearch(event) {
    event.preventDefault();
    setCurrentPage(1);
  }

  return (
    <>
      {hero?.visible !== false && hero && (
        <HeroSlider slides={hero.slides} options={hero.slider} />
      )}

      <section className="py-10 lg:py-16">
        <div className="container-x">
          <Reveal className="flex items-end justify-between">
            <SectionHeading
              eyebrow={heading.eyebrow}
              title={heading.title}
              accent={heading.accent}
              description={heading.description}
            />
            <span className="hidden text-sm text-muted sm:block">Home / Blog</span>
          </Reveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
            <div>
              {visiblePosts.length ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {visiblePosts.map((post, index) => (
                    <PostCard
                      key={post.slug || post.title}
                      post={post}
                      delay={(index % 2) * 100}
                    />
                  ))}
                </div>
              ) : (
                <p className="card p-6 text-sm text-muted">No articles match your search.</p>
              )}

              {pageCount > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:text-white disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <Icon name="arrowLeft" className="h-4 w-4" />
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-medium transition ${
                        currentPage === page ? "btn-gradient text-white" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                    disabled={currentPage === pageCount}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:text-white disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <Reveal className="card p-2">
                <form onSubmit={submitSearch} className="relative">
                  <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={sidebar.search_placeholder}
                    aria-label="Search blogs"
                    className="w-full rounded-xl bg-transparent py-3 pl-11 pr-12 text-sm text-white placeholder:text-muted outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg btn-gradient text-white" aria-label="Search">
                    <Icon name="search" className="h-4 w-4" />
                  </button>
                </form>
              </Reveal>

              <Reveal className="card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">{sidebar.categories_title}</h3>
                  <button type="button" onClick={() => selectCategory("")} className="text-xs text-brand-cyan hover:underline">{sidebar.categories_link}</button>
                </div>
                <ul className="mt-4 space-y-2">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <button
                        type="button"
                        onClick={() => selectCategory(category.name)}
                        aria-pressed={activeCategory === category.name}
                        className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                          activeCategory === category.name ? "border-brand-cyan/50 bg-white/10" : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/5"
                        }`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-md btn-gradient text-white">
                          <Icon name={category.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm text-white/85 group-hover:text-white">{category.name}</span>
                        <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted">{category.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">{sidebar.recent_title}</h3>
                  <button type="button" onClick={() => { setActiveCategory(""); setSearch(""); setCurrentPage(1); }} className="text-xs text-brand-cyan hover:underline">{sidebar.recent_link}</button>
                </div>
                <ul className="mt-4 space-y-4">
                  {recent.map((post) => (
                    <li key={post.slug || post.title}>
                      <Link to={`/blog/${post.slug || slugify(post.title)}`} className="group flex w-full gap-3 text-left">
                        <img src={post.image} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-white/10 object-cover" loading="lazy" />
                        <span>
                          <span className="line-clamp-2 text-sm font-medium leading-snug text-white/85 group-hover:text-brand-cyan">{post.title}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Icon name="calendar" className="h-3 w-3" />{post.date}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>

            </aside>
          </div>
        </div>
      </section>

      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePost();
          }}
        >
          <article role="dialog" aria-modal="true" aria-labelledby="blog-post-title" className="card mx-auto my-8 max-w-3xl overflow-hidden">
            <div className="relative">
              <img src={selectedPost.image} alt="" className="max-h-96 w-full object-cover" />
              <button type="button" onClick={closePost} className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-2 text-white" aria-label="Close article">Close</button>
            </div>
            <div className="p-6 sm:p-9">
              <p className="text-sm text-brand-cyan">{normalizeCategories(selectedPost.categories).join(" · ")}</p>
              <h2 id="blog-post-title" className="mt-2 font-display text-2xl font-bold sm:text-3xl">{selectedPost.title}</h2>
              <p className="mt-3 text-sm text-muted">{selectedPost.author} · {selectedPost.date} · {selectedPost.read}</p>
              {selectedPost.content ? (
                <div className="prose prose-invert mt-7 max-w-none" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              ) : (
                <p className="mt-7 leading-relaxed text-muted">{selectedPost.excerpt}</p>
              )}
            </div>
          </article>
        </div>
      )}
      <SectionRenderer sections={sections.filter((section) => section?.type !== "blog_content")} />
    </>
  );
}
