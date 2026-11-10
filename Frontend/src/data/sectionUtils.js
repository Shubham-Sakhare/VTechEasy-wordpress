/** Pull the CTA band's data out of a page's sections (for the Layout). */
export function findCtaData(sections = []) {
  const cta = sections.find((s) => s && s.type === "cta");
  return cta ? cta.data : null;
}
