// Renders a react-icons/fi (Feather) icon from the kebab-case name chosen
// in the WordPress admin icon picker (e.g. "arrow-right" -> FiArrowRight).
// Falls back gracefully to null when no icon is set or the name is unknown.
import * as FiIcons from "react-icons/fi";

/** "arrow-right" -> "FiArrowRight" */
function toFiName(name) {
  const pascal = String(name)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `Fi${pascal}`;
}

export default function DynIcon({ name, className = "", ...props }) {
  if (!name) return null;
  const Cmp = FiIcons[toFiName(name)];
  if (!Cmp) return null;
  return <Cmp className={className} {...props} />;
}
