import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePageContext } from "../hooks/PageContentContext";
import HeroSlider from "../components/sections/HeroSlider";
import SectionRenderer from "../components/sections/SectionRenderer";

export default function ContactPage() {
  const { hero, sections } = usePageContext();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash !== "#contact-form") return;
    window.requestAnimationFrame(() => {
      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
    });
  }, [hash]);

  return (
    <>
      {hero?.visible !== false && hero && (
        <HeroSlider slides={hero.slides} options={hero.slider} />
      )}
      <SectionRenderer sections={sections} />
    </>
  );
}
