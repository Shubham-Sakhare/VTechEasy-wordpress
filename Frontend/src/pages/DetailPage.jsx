import { Link, useParams } from "react-router-dom";
import { usePageContext } from "../hooks/PageContentContext";
import Icon from "../components/ui/Icon";
import BlogArticlePage from "./BlogArticlePage";
import ProjectArticlePage from "./ProjectArticlePage.jsx";
import ServiceArticlePage from "./ServiceArticlePage.jsx";
import { slugify } from "../utils/slug";

const pageConfig = {
  service: {
    label: "Services",
    listPath: "/services",
    sectionType: "services",
  },
  portfolio: {
    label: "Portfolio",
    listPath: "/portfolio",
    sectionType: "projects",
  },
  blog: {
    label: "Blog",
    listPath: "/blog",
    sectionType: "blog_content",
  },
};

export default function DetailPage({ kind }) {
  const { slug } = useParams();
  const { sections, live, footer } = usePageContext();
  const config = pageConfig[kind];
  const section = sections.find((item) => item?.type === config.sectionType);
  const data = section?.data;

  // Live backend content only — no static fallback.
  const items = (
    kind === "blog"
      ? (Array.isArray(data?.posts) ? data.posts : [])
      : (Array.isArray(data?.items) ? data.items : [])
  ).filter((entry) => kind !== "portfolio" || String(entry?.title || "").trim());

  const item = items.find((entry) => {
    const isPublished =
      kind !== "blog" ||
      entry.published === undefined ||
      Boolean(Number(entry.published));
    return isPublished && (entry.slug || slugify(entry.title)) === slug;
  });

  if (!item) {
    return (
      <section className="container-x py-20 text-center lg:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-cyan">
          {config.label}
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold">Page not found</h1>
        <p className="mt-3 text-muted">This {config.label.toLowerCase()} detail may have been removed or is not published.</p>
        <Link to={config.listPath} className="mt-7 inline-flex items-center gap-2 text-brand-cyan hover:underline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to {config.label}
        </Link>
      </section>
    );
  }

  if (kind === "blog") {
    const publishedPosts = items.filter(
      (entry) =>
        entry.published === undefined || Boolean(Number(entry.published)),
    );
    return (
      <BlogArticlePage
        item={item}
        posts={publishedPosts}
        categories={data?.categories || []}
        sidebar={data?.sidebar}
        isLive={live}
        socials={footer?.socials || []}
      />
    );
  }

  if (kind === "service") {
    return <ServiceArticlePage item={item} services={items} />;
  }

  return (
    <ProjectArticlePage
      item={item}
      projects={items}
      listPath={config.listPath}
    />
  );
}
