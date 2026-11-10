import { useEffect } from "react";
import { usePageContext } from "../hooks/PageContentContext";
import HeroSlider from "../components/sections/HeroSlider";
import SectionRenderer from "../components/sections/SectionRenderer";

export default function ContactPage() {
  const { hero, sections } = usePageContext();

  useEffect(() => {
    if (window.location.hash !== "#contact-form") return;
    window.requestAnimationFrame(() => {
      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  return (
    <>
      {hero?.visible !== false && hero && (
        <HeroSlider slides={hero.slides} options={hero.slider} />
      )}
      <SectionRenderer sections={sections} />
    </>
  );
}
