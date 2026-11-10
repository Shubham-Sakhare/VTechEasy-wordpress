import { usePageContext } from "../hooks/PageContentContext";
import HeroSlider from "../components/sections/HeroSlider";
import SectionRenderer from "../components/sections/SectionRenderer";

export default function ServicesPage() {
  const { hero, sections } = usePageContext();

  return (
    <>
      {hero?.visible !== false && hero && (
        <HeroSlider slides={hero.slides} options={hero.slider} />
      )}
      <SectionRenderer sections={sections} />
    </>
  );
}
