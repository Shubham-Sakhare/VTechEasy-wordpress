import { createContext, useContext } from "react";

/**
 * Holds the current route's page content ({ hero, sections, loading, live })
 * loaded once by the Layout and consumed by the page + the footer CTA.
 */
export const PageContentContext = createContext({
  hero: null,
  sections: [],
  loading: false,
  live: false,
  enabled: false,
});

export function usePageContext() {
  return useContext(PageContentContext);
}
