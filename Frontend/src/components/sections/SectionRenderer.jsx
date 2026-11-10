import Services from "./Services";
import Process from "./Process";
import Projects from "./Projects";
import CaseStudy from "./CaseStudy";
import Testimonials from "./Testimonials";
import FeaturedBlogs from "./FeaturedBlogs";
import TeamSection from "./TeamSection";
import CustomSection from "./CustomSection";
import {
  AboutBanner,
  AboutPillars,
  AboutStory,
  AboutTeam,
  AboutWhy,
  ContactContent,
  PricingContent,
} from "./ManagedSections";

/**
 * Maps a backend section `type` (the registry id) to its React component.
 * The `cta` type is intentionally excluded here because the CTA band is
 * rendered by the Layout just above the footer, not inline in the page body.
 *
 * Any type not listed (i.e. a section created from the WordPress Sections
 * screen) falls back to the generic <CustomSection />.
 */
const REGISTRY = {
  services: Services,
  process: Process,
  projects: Projects,
  case_study: CaseStudy,
  testimonials: Testimonials,
  team: TeamSection,
  featured_blogs: FeaturedBlogs,
  about_story: AboutStory,
  about_pillars: AboutPillars,
  about_team: AboutTeam,
  about_why: AboutWhy,
  about_banner: AboutBanner,
  pricing_content: PricingContent,
  contact_content: ContactContent,
};

/**
 * Render the ordered list of reusable sections for a page.
 *
 * @param {Array<{type:string, order:number, data:object, is_parent?:boolean}>} sections
 */
export default function SectionRenderer({ sections = [] }) {
  return (
    <>
      {sections
        .filter((s) => s && s.type !== "cta")
        .map((s, i) => {
          const Cmp = REGISTRY[s.type] || CustomSection;
          return (
            <Cmp
              key={`${s.type}-${i}`}
              data={s.data}
              page={s.page}
              isParent={s.is_parent ?? s.isParent ?? true}
            />
          );
        })}
    </>
  );
}
