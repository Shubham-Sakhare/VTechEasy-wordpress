import { useEffect, useState } from "react";
import { isApiConfigured } from "../api/wordpress";

/**
 * Generic data hook that uses local dummy data only when WordPress is not
 * configured. With a configured API, data remains empty until it loads.
 *
 * @param {() => Promise<any>} fetcher  async function hitting the WP API
 * @param {any} fallback                dummy data used when API is off or fails
 */
export function useWordpressData(fetcher, fallback) {
  const enabled = isApiConfigured && typeof fetcher === "function";
  const [data, setData] = useState(enabled ? null : fallback);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Nothing to fetch: the dummy fallback is already the initial state.
    if (!enabled) return;

    let active = true;

    fetcher()
      .then((result) => {
        if (!active) return;
        setData(result ?? fallback);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setData(null);
        setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, enabled };
}
