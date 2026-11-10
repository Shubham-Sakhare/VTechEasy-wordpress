import { usePageContext } from "../hooks/PageContentContext";
import Hero from "../components/sections/Hero";
import HeroSlider from "../components/sections/HeroSlider";
import SectionRenderer from "../components/sections/SectionRenderer";

/**
 * Home renders the signature animated Hero when no WP hero is present (offline
 * look), otherwise the editable PageHero. The reusable sections below come
 * from the backend in their configured order via SectionRenderer, so adding
 * or reordering a section in WP needs no change here.
 */
export default function Home() {
  const { hero, sections, live } = usePageContext();

  return (
    <>
      {live ? (
        hero && hero.visible !== false ? (
          <HeroSlider slides={hero.slides} options={hero.slider} />
        ) : null
      ) : (
        <Hero />
      )}
      <SectionRenderer sections={sections} />
    </>
  );
}
