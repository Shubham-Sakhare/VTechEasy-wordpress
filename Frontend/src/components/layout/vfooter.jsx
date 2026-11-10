import { Link } from "react-router-dom";
import { useLayout } from "../../hooks/useLayout";
import Icon from "../ui/Icon";
import DynIcon from "../ui/DynIcon";
import Logo from "../ui/Logo";
import Reveal from "../ui/Reveal";

/** Internal route (starts with "/") -> Link, otherwise a plain anchor. */
const isRoute = (url) => typeof url === "string" && url.startsWith("/");

/**
 * WordPress-driven Footer. Same look as the original Footer, but tagline,
 * link columns, contact details, social icons and legal links all come
 * from the "VTech Layout → Footer" admin screen via the REST API.
 */
export default function VFooter() {
  const { footer } = useLayout();

  const contact = footer.contact || {};
  const contactRows = [
    { icon: "mapPin", value: contact.address },
    { icon: "phone", value: contact.phone },
    { icon: "mail", value: contact.email },
    { icon: "clock", value: contact.hours },
  ].filter((row) => row.value);

  const columns = footer.columns || [];
  const socials = footer.socials || [];
  const legal = footer.legal || [];

  return (
    <footer className="border-t border-white/10 bg-ink-800/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <Reveal direction="up" delay={0}>
          {footer.logo_image ? (
            <Link to="/" className="inline-flex items-center">
              <img
                src={footer.logo_image}
                alt={footer.logo_text || "Logo"}
                className="h-10 w-auto"
              />
            </Link>
          ) : (
            <Logo />
          )}
          <p className="mt-4 max-w-xs text-sm text-muted">{footer.tagline}</p>
          <div className="mt-5 flex gap-3">
            {socials.map((s, i) => (
              <a
                key={`${s.icon}-${i}`}
                href={s.url || "#"}
                aria-label={s.icon}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue hover:text-white"
              >
                <DynIcon name={s.icon} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </Reveal>

        {/* Link columns */}
        {columns.map((col, idx) => (
          <Reveal key={`${col.title}-${idx}`} direction="up" delay={100 + idx * 100}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {(col.links || []).map((link, li) => (
                <li key={`${link.label}-${li}`}>
                  {isRoute(link.url) ? (
                    <Link
                      to={link.url}
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.url || "#"}
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}

        {/* Contact */}
        <Reveal direction="up" delay={300}>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
            {contact.title}
          </h4>
          <ul className="mt-4 space-y-3">
            {contactRows.map((row) => (
              <li key={row.value} className="flex items-start gap-3 text-sm text-muted">
                <Icon name={row.icon} className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted sm:flex-row">
          <p>{footer.copyright}</p>
          <ul className="flex gap-5">
            {legal.map((l, i) => (
              <li key={`${l.label}-${i}`}>
                <a href={l.url || "#"} className="transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
