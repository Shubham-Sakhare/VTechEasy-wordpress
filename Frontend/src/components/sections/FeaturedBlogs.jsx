import { Link } from "react-router-dom";
import { useRef } from "react";
import Icon from "../ui/Icon";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";
import Reveal from "../ui/Reveal";
import { slugify } from "../../utils/slug";

export default function FeaturedBlogs({ data }) {
  const cardsRef = useRef(null);
  const posts = Array.isArray(data?.items) ? data.items : [];
  if (!posts.length) return null;

  const scrollCards = (direction) =>
    cardsRef.current?.scrollBy({
      left: direction * cardsRef.current.clientWidth,
      behavior: "smooth",
    });

  return (
    <section className="py-20 lg:py-28">
      <div className="container-x">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {data.image && (
            <img
              src={data.image}
              alt={data.title || "Featured articles"}
              className="mb-6 h-16 w-16 rounded-2xl object-cover"
              loading="lazy"
            />
          )}
          <SectionHeading
            align="center"
            eyebrow={data.eyebrow}
            title={data.title}
            description={data.description}
          />
        </Reveal>

        <div ref={cardsRef} className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {posts.map((post, index) => {
            const category = Array.isArray(post.categories)
              ? post.categories[0]
              : post.categories;
            return (
              <Reveal
                as="article"
                key={post.slug || post.title}
                direction="up"
                delay={(index % 3) * 100}
                className="group card w-[calc((100%-3rem)/3)] min-w-[calc((100%-3rem)/3)] snap-start overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-white/15 hover:shadow-[0_30px_70px_-25px_rgba(45,124,255,0.5)] max-md:w-[80%] max-md:min-w-[80%] max-sm:w-[88%] max-sm:min-w-[88%]"
              >
                <Link
                  to={`/blog/${post.slug || slugify(post.title)}`}
                  className="block"
                >
                  {post.image && (
                    <div className="relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title || ""}
                        className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {category && (
                        <span className="absolute left-3 top-3 rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white shadow">
                          {category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-base font-semibold leading-snug transition-colors group-hover:text-brand-cyan">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-muted">
                      {post.date && (
                        <span className="flex items-center gap-1.5">
                          <Icon name="calendar" className="h-3.5 w-3.5" />
                          {post.date}
                        </span>
                      )}
                      {post.read && (
                        <span className="flex items-center gap-1.5">
                          <Icon name="clock" className="h-3.5 w-3.5" />
                          {post.read}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-brand-cyan">
                        Read article
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <SectionFooter
          showViewAll={isToggleOn(data?.cta)}
          label={data?.cta_text || "View All Articles"}
          url={data?.cta_url || "/blog"}
          icon={data?.cta_icon}
          showArrows={posts.length > 3}
          onPrev={() => scrollCards(-1)}
          onNext={() => scrollCards(1)}
          arrowLabel="blog cards"
        />
      </div>
    </section>
  );
}
