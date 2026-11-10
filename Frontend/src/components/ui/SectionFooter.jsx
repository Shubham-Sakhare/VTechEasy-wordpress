import { Link } from "react-router-dom";
import Button from "./Button";
import Icon from "./Icon";
import DynIcon from "./DynIcon";

/**
 * Shared footer row for card sections: a "View All" button on the left and the
 * previous/next scroll arrows on the right, kept on one line.
 *
 * - `showViewAll`  whether to render the View All button
 * - `label`        button text
 * - `url`          button link ("/..." uses in-app routing, else opens a tab)
 * - `icon`         kebab-case icon name from the WP icon picker (optional)
 * - `showArrows`   whether to render the scroll arrows
 * - `onPrev` / `onNext`  arrow click handlers
 * - `arrowLabel`   accessible label prefix for the arrows (e.g. "service cards")
 */
export default function SectionFooter({
  showViewAll = false,
  label = "",
  url = "",
  icon = "",
  showArrows = false,
  onPrev,
  onNext,
  arrowLabel = "cards",
  className = "",
}) {
  if (!showViewAll && !showArrows) return null;

  const iconEl = icon ? (
    <DynIcon
      name={icon}
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
    />
  ) : null;

  const isInternal = String(url || "").startsWith("/");

  const viewAllButton = !showViewAll ? null : isInternal ? (
    <Button as={Link} to={url || "#"} variant="outline" showIcon={false}>
      {label}
      {iconEl}
    </Button>
  ) : (
    <Button
      as="a"
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      showIcon={false}
    >
      {label}
      {iconEl}
    </Button>
  );

  return (
    <div className={`mt-10 flex items-center justify-between gap-4 ${className}`}>
      <div>{viewAllButton}</div>
      {showArrows && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label={`Previous ${arrowLabel}`}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition hover:border-brand-cyan hover:text-brand-cyan"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={`Next ${arrowLabel}`}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition hover:border-brand-cyan hover:text-brand-cyan"
          >
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
