import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiChevronDown, FiArrowUpRight } from "react-icons/fi";
import { useLayout } from "../../hooks/useLayout";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import DynIcon from "../ui/DynIcon";

const isRoute = (url) => typeof url === "string" && url.startsWith("/");

/* ─────────────────────────────────────────────
   MobileNavItem — sub-component so hooks are
   called at the top level of a component, not
   inside a .map() callback.
───────────────────────────────────────────── */
function MobileNavItem({ link, idx, pathname, onClose }) {
  const [subOpen, setSubOpen] = useState(false);
  const hasChildren = link.children?.length > 0;
  const isCurrentPage =
    pathname === link.url ||
    (link.url && link.url !== "/" && pathname.startsWith(link.url));

  return (
    <li
      className="animate-slide-up"
      style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
    >
      {hasChildren ? (
        <>
          <button
            type="button"
            onClick={() => setSubOpen((v) => !v)}
            className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
              isCurrentPage
                ? "border-brand-blue/20 bg-brand-blue/10 text-white"
                : "border-transparent text-white/70 hover:border-white/8 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              {link.icon && <DynIcon name={link.icon} className="h-4 w-4 text-brand-cyan" />}
              {link.label}
            </span>
            <FiChevronDown
              className={`h-4 w-4 transition-transform duration-250 ${subOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              subOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <ul className="ml-4 mt-1.5 flex flex-col gap-0.5 border-l-2 border-brand-blue/20 pl-4">
              {link.children.map((child) => (
                <li key={child.label}>
                  <a
                    href={child.url || "#"}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-all duration-200 hover:bg-white/5 hover:text-white"
                  >
                    {child.icon && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-cyan">
                        <DynIcon name={child.icon} className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : isRoute(link.url) ? (
        <Link
          to={link.url}
          onClick={onClose}
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
            isCurrentPage
              ? "border-brand-blue/20 bg-brand-blue/10 text-white"
              : "border-transparent text-white/70 hover:border-white/8 hover:bg-white/5 hover:text-white"
          }`}
        >
          {link.icon && <DynIcon name={link.icon} className="h-4 w-4 text-brand-cyan" />}
          {link.label}
          {isCurrentPage && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-blue" />
          )}
        </Link>
      ) : (
        <a
          href={link.url || "#"}
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-2xl border border-transparent px-4 py-3.5 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/8 hover:bg-white/5 hover:text-white"
        >
          {link.icon && <DynIcon name={link.icon} className="h-4 w-4 text-brand-cyan" />}
          {link.label}
        </a>
      )}
    </li>
  );
}

/* ─────────────────────────────────────────────
   Main Header
───────────────────────────────────────────── */
export default function VHeader() {
  const { header } = useLayout();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const progressBarRef = useRef(null);
  const dropdownTimeout = useRef(null);

  /* ── Scroll: sticky style + reading progress bar (DOM-direct, no extra renders) ── */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (progressBarRef.current) {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0;
        progressBarRef.current.style.width = `${pct}%`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close mobile menu + dropdown on route change ── */
  useEffect(() => {
    // Route-change sync: intentionally resetting UI state — not a cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenDropdown(null);
  }, [pathname]);

  /* ── Keyboard: close dropdown on Escape ── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpenDropdown(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDropdownEnter = (label) => {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };
  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  const menu = header.menu || [];
  const button = header.button || {};

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-ink/82 shadow-[0_1px_0_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      {/* ── Top reading-progress bar ── */}
      <div
        ref={progressBarRef}
        aria-hidden="true"
        className="absolute left-0 top-0 h-[2px] w-0 origin-left bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink"
        style={{ transition: "none" }}
      />

      {/* ── Bottom border glow (scrolled only) ── */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(45,124,255,0.4) 30%, rgba(168,85,247,0.4) 70%, transparent 100%)",
        }}
      />

      {/* ══════════ DESKTOP NAVBAR ══════════ */}
      <nav className="container-x flex h-[72px] items-center justify-between gap-6">

        {/* ── Logo ── */}
        <div
          className={`shrink-0 transition-all duration-500 ${
            scrolled ? "[filter:drop-shadow(0_0_14px_rgba(45,124,255,0.4))]" : ""
          }`}
        >
          {header.logo_image ? (
            <Link to="/" className="flex items-center">
              <img
                src={header.logo_image}
                alt={header.logo_text || "Logo"}
                className="h-9 w-auto transition-transform duration-300 hover:scale-105"
              />
            </Link>
          ) : (
            <Logo />
          )}
        </div>

        {/* ── Centre pill navigation ── */}
        <div className="relative hidden lg:block">
          {/* Pill container background */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 ${
              scrolled
                ? "border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "border border-transparent"
            }`}
          />

          <ul className="relative flex items-center gap-0.5 px-2 py-1.5">
            {menu.map((link) => {
              const hasChildren = link.children?.length > 0;
              const isOpen = openDropdown === link.label;
              const isActive =
                pathname === link.url ||
                (link.url && link.url !== "/" && pathname.startsWith(link.url));

              const linkCls = [
                "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium select-none",
                "transition-all duration-200",
                isActive
                  ? "text-white"
                  : "text-white/60 hover:text-white",
              ].join(" ");

              return (
                <li
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => hasChildren && handleDropdownEnter(link.label)}
                  onMouseLeave={() => hasChildren && handleDropdownLeave()}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full bg-white/9 ring-1 ring-white/10"
                    />
                  )}

                  {isRoute(link.url) ? (
                    <NavLink to={link.url} end={link.url === "/"} className={linkCls}>
                      {link.icon && <DynIcon name={link.icon} className="h-3.5 w-3.5" />}
                      {link.label}
                      {hasChildren && (
                        <FiChevronDown
                          className={`h-3 w-3 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`}
                        />
                      )}
                      {/* Active dot */}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-blue"
                          style={{ boxShadow: "0 0 6px 2px rgba(45,124,255,0.7)" }}
                        />
                      )}
                    </NavLink>
                  ) : (
                    <a href={link.url || "#"} className={linkCls}>
                      {link.icon && <DynIcon name={link.icon} className="h-3.5 w-3.5" />}
                      {link.label}
                      {hasChildren && (
                        <FiChevronDown
                          className={`h-3 w-3 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`}
                        />
                      )}
                    </a>
                  )}

                  {/* ── Dropdown ── */}
                  {hasChildren && (
                    <div
                      className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200 ${
                        isOpen
                          ? "visible translate-y-0 opacity-100"
                          : "invisible translate-y-2 opacity-0 pointer-events-none"
                      }`}
                    >
                      <div className="relative min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-ink/96 p-2 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
                        {/* Top glow strip */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-px left-6 right-6 h-px rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(45,124,255,0.6), rgba(168,85,247,0.5), transparent)",
                          }}
                        />
                        {link.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.url || "#"}
                            className="group/dd flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/65 transition-all duration-200 hover:bg-white/6 hover:text-white"
                          >
                            <span className="flex items-center gap-2.5">
                              {child.icon ? (
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-blue/15 bg-brand-blue/8 text-brand-cyan transition-colors duration-200 group/dd-hover:bg-brand-blue/15">
                                  <DynIcon name={child.icon} className="h-3.5 w-3.5" />
                                </span>
                              ) : null}
                              {child.label}
                            </span>
                            <FiArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-200 group/dd-hover:opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── Right: CTA button + hamburger ── */}
        <div className="flex shrink-0 items-center gap-3">
          {button.label && (
            <Button
              {...(isRoute(button.url)
                ? { as: Link, to: button.url }
                : { as: "a", href: button.url || "#" })}
              icon={button.icon ? undefined : "arrowRight"}
              showIcon={!button.icon}
              className="hidden lg:inline-flex"
            >
              {button.icon && <DynIcon name={button.icon} className="h-4 w-4" />}
              {button.label}
            </Button>
          )}

          {/* Animated hamburger button */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className={`relative grid h-11 w-11 place-items-center rounded-2xl border transition-all duration-300 lg:hidden ${
              open
                ? "border-brand-blue/40 bg-brand-blue/10 text-white"
                : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/8 hover:text-white"
            }`}
          >
            {/* Three-line → X morphing burger */}
            <span className="relative flex h-5 w-5 flex-col items-center justify-center gap-[5px]">
              <span
                className={`block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${
                  open ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] rounded-full bg-current transition-all duration-300 ${
                  open ? "w-0 opacity-0" : "w-5"
                }`}
              />
              <span
                className={`block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 origin-center ${
                  open ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* ══════════ MOBILE DRAWER ══════════ */}
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`overflow-hidden transition-all duration-400 ease-in-out lg:hidden ${
          open ? "max-h-[calc(100vh-72px)] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-ink/97 backdrop-blur-3xl">
          {/* Top gradient accent line */}
          <div
            aria-hidden="true"
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(45,124,255,0.5) 30%, rgba(168,85,247,0.5) 70%, transparent 100%)",
            }}
          />

          <div className="container-x py-5">
            <ul className="flex flex-col gap-1">
              {menu.map((link, idx) => (
                <MobileNavItem
                  key={link.label}
                  link={link}
                  idx={idx}
                  pathname={pathname}
                  onClose={() => setOpen(false)}
                />
              ))}
            </ul>

            {/* Mobile CTA */}
            {button.label && (
              <div
                className="mt-5 animate-slide-up"
                style={{
                  animationDelay: `${menu.length * 40 + 40}ms`,
                  animationFillMode: "both",
                }}
              >
                <Button
                  {...(isRoute(button.url)
                    ? { as: Link, to: button.url }
                    : { as: "a", href: button.url || "#" })}
                  onClick={() => setOpen(false)}
                  className="w-full justify-center py-4 text-base"
                >
                  {button.icon && <DynIcon name={button.icon} className="h-5 w-5" />}
                  {button.label}
                </Button>
              </div>
            )}

            {/* Quick contact strip */}
            <div
              className="mt-5 flex items-center justify-center gap-6 border-t border-white/6 pt-5 animate-slide-up"
              style={{
                animationDelay: `${menu.length * 40 + 80}ms`,
                animationFillMode: "both",
              }}
            >
              <a
                href="tel:+919096337434"
                className="flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                +91 90963 37434
              </a>
              <a
                href="mailto:info@vtecheasy.in"
                className="flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
                info@vtecheasy.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
