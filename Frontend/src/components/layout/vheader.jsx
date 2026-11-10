import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { useLayout } from "../../hooks/useLayout";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import DynIcon from "../ui/DynIcon";

/** Internal route (starts with "/") -> NavLink, otherwise a plain anchor. */
const isRoute = (url) => typeof url === "string" && url.startsWith("/");

/**
 * WordPress-driven Header. Same look as the original Header, but logo,
 * menu (with icons + sub-menus) and the CTA button all come from the
 * "VTech Layout → Header" admin screen via the REST API.
 */
export default function VHeader() {
  const { header } = useLayout();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menu = header.menu || [];
  const button = header.button || {};

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-ink/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="container-x flex h-20 items-center justify-between">
        {header.logo_image ? (
          <Link to="/" className="flex items-center">
            <img
              src={header.logo_image}
              alt={header.logo_text || "Logo"}
              className="h-10 w-auto"
            />
          </Link>
        ) : (
          <Logo />
        )}

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 lg:flex">
          {menu.map((link) => {
            const hasChildren = link.children && link.children.length > 0;
            const navCls = ({ isActive } = {}) =>
              `relative flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-brand-blue after:transition-all hover:after:w-full ${
                isActive ? "text-white after:w-full" : "text-white/80 after:w-0"
              }`;
            return (
              <li key={link.label} className="group relative">
                {isRoute(link.url) ? (
                  <NavLink to={link.url} end={link.url === "/"} className={navCls}>
                    {link.icon && <DynIcon name={link.icon} className="h-4 w-4" />}
                    {link.label}
                    {hasChildren && (
                      <FiChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                    )}
                  </NavLink>
                ) : (
                  <a href={link.url || "#"} className={navCls()}>
                    {link.icon && <DynIcon name={link.icon} className="h-4 w-4" />}
                    {link.label}
                    {hasChildren && (
                      <FiChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                    )}
                  </a>
                )}

                {hasChildren && (
                  <ul className="invisible absolute left-0 top-full z-50 min-w-48 translate-y-2 rounded-xl border border-white/10 bg-ink/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {link.children.map((child) => (
                      <li key={child.label}>
                        <a
                          href={child.url || "#"}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {child.icon && (
                            <DynIcon name={child.icon} className="h-4 w-4 text-brand-cyan" />
                          )}
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {button.label && (
            <Button
              {...(isRoute(button.url)
                ? { as: Link, to: button.url }
                : { as: "a", href: button.url || "#" })}
              icon={button.icon ? undefined : "arrowRight"}
              showIcon={!button.icon}
              className="hidden sm:inline-flex"
            >
              {button.icon && <DynIcon name={button.icon} className="h-4 w-4" />}
              {button.label}
            </Button>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
          >
            {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-ink/95 backdrop-blur-xl lg:hidden">
          <ul className="container-x flex flex-col gap-1 py-4">
            {menu.map((link) => (
              <li key={link.label}>
                {isRoute(link.url) ? (
                  <Link
                    to={link.url}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
                  >
                    {link.icon && <DynIcon name={link.icon} className="h-4 w-4" />}
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.url || "#"}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
                  >
                    {link.icon && <DynIcon name={link.icon} className="h-4 w-4" />}
                    {link.label}
                  </a>
                )}
                {link.children && link.children.length > 0 && (
                  <ul className="ml-4 border-l border-white/10 pl-2">
                    {link.children.map((child) => (
                      <li key={child.label}>
                        <a
                          href={child.url || "#"}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          {child.icon && <DynIcon name={child.icon} className="h-4 w-4 text-brand-cyan" />}
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {button.label && (
              <li className="px-3 pt-2">
                <Button
                  {...(isRoute(button.url)
                    ? { as: Link, to: button.url }
                    : { as: "a", href: button.url || "#" })}
                  onClick={() => setOpen(false)}
                  className="w-full justify-center"
                >
                  {button.icon && <DynIcon name={button.icon} className="h-4 w-4" />}
                  {button.label}
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
