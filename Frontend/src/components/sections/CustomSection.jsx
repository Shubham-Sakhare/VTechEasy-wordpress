import SectionHeading from "../ui/SectionHeading";
import Icon from "../ui/Icon";
import DynIcon from "../ui/DynIcon";
import Button from "../ui/Button";
import Reveal from "../ui/Reveal";

// Gradient fallbacks for item icons (same palette as the Services cards).
const COLORS = [
  "from-brand-blue to-brand-cyan",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-orange-400 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-brand-purple to-indigo-500",
];

/**
 * Generic renderer for admin-created ("custom") sections.
 *
 * The backend gives every custom section the same schema, so one component can
 * render them all. Kick-started in the WordPress Sections screen, filled in
 * from any page's menu.
 */
export default function CustomSection({ data = {} }) {
  const customFields = Array.isArray(data._custom_fields) ? data._custom_fields : null;
  if (customFields) {
    return <ConfiguredCustomSection data={data} fields={customFields} />;
  }

  const { eyebrow, title, description, image, body, items = [] } = data;
  const list = Array.isArray(items) ? items : [];

  // Nothing meaningful to render — don't leave an empty gap on the page.
  if (!title && !description && !body && !image && list.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28">
      <div className="container-x">
        {(eyebrow || title || description) && (
          <Reveal direction="up" className="mx-auto max-w-3xl text-center">
            <SectionHeading
              align="center"
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
          </Reveal>
        )}

        {image && (
          <Reveal
            direction="up"
            className="mt-10 overflow-hidden rounded-2xl border border-white/5 card-glow"
          >
            <img src={image} alt={title || ""} className="h-auto w-full object-cover" />
          </Reveal>
        )}

        {body && (
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted sm:text-base">
            {body}
          </p>
        )}

        {list.length > 0 && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item, i) => (
              <Reveal
                key={item.title || i}
                direction="up"
                delay={i * 90}
                className="group card card-glow p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 hover:shadow-[0_30px_60px_-25px_rgba(45,124,255,0.5)]"
              >
                <span
                  className={`mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${
                    item.color || COLORS[i % COLORS.length]
                  } text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
                >
                  <Icon name={item.icon} className="h-6 w-6" />
                </span>
                {item.title && (
                  <h3 className="text-lg font-semibold transition-colors group-hover:text-brand-cyan">
                    {item.title}
                  </h3>
                )}
                {item.desc && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ConfiguredCustomSection({ data, fields }) {
  const visibleFields = fields.filter((field) => {
    const value = data[field.key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== "";
  });
  if (!visibleFields.length) return null;

  const headingField = visibleFields.find((field) => field.type === "title");
  const descriptionField = visibleFields.find((field) => field.type === "textarea");
  const remaining = visibleFields.filter((field) => field !== headingField && field !== descriptionField);

  function renderField(field, index) {
    const value = data[field.key];
    if (value === undefined || value === null || value === "") return null;
    const key = field.key || `field-${index}`;

    if (field.type === "image") {
      return (
        <Reveal key={key} direction="up" className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-white/10 card-glow">
          <img src={value} alt={field.placeholder || field.label || ""} className="h-auto max-h-[36rem] w-full object-cover" loading="lazy" />
        </Reveal>
      );
    }

    if (field.type === "icon") {
      return (
        <Reveal key={key} direction="up" className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
          <DynIcon name={value} className="h-8 w-8" />
        </Reveal>
      );
    }

    if (field.type === "button" && typeof value === "object") {
      if (!value.label) return null;
      return (
        <Reveal key={key} direction="up" className="mt-8 flex justify-center">
          {value.url ? (
            <Button as="a" href={value.url} showIcon={false}>
              {value.icon && <DynIcon name={value.icon} className="h-4 w-4" />}
              {value.label}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold text-white">
              {value.icon && <DynIcon name={value.icon} className="h-4 w-4" />}
              {value.label}
            </span>
          )}
        </Reveal>
      );
    }

    if (field.type === "links" && Array.isArray(value)) {
      return (
        <div key={key} className="mx-auto mt-8 flex flex-wrap justify-center gap-3">
          {value.filter((link) => link.label).map((link, linkIndex) => (
            <a
              key={`${key}-${linkIndex}`}
              href={link.url || "#"}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-brand-cyan/50 hover:text-brand-cyan"
            >
              {link.label}
              <Icon name="arrowRight" className="h-4 w-4" />
            </a>
          ))}
        </div>
      );
    }

    if (field.type === "items" && Array.isArray(value)) {
      return (
        <div key={key} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, itemIndex) => (
            <Reveal
              as="article"
              key={`${key}-${itemIndex}`}
              direction="up"
              delay={itemIndex * 80}
              className="group card card-glow overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15"
            >
              {item.image && <img src={item.image} alt={item.title || ""} className="-mx-6 -mt-6 mb-5 aspect-[16/9] w-[calc(100%+3rem)] object-cover" loading="lazy" />}
              {item.icon && (
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan text-white shadow-lg">
                  <DynIcon name={item.icon} className="h-6 w-6" />
                </span>
              )}
              {item.title && <h3 className="text-lg font-semibold transition-colors group-hover:text-brand-cyan">{item.title}</h3>}
              {item.description && <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>}
              {item.button_text && item.button_url && (
                <a href={item.button_url} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan hover:underline">
                  {item.button_text}<Icon name="arrowRight" className="h-4 w-4" />
                </a>
              )}
            </Reveal>
          ))}
        </div>
      );
    }

    if (field.type === "richtext") {
      return (
        <div key={key} className="prose prose-invert mx-auto mt-7 max-w-3xl text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: value }} />
      );
    }

    if (field.type === "url") {
      return (
        <p key={key} className="mt-5 text-center">
          <a href={value} className="inline-flex items-center gap-2 text-brand-cyan hover:underline">
            {field.label || value}<Icon name="external" className="h-4 w-4" />
          </a>
        </p>
      );
    }

    if (field.type === "email") {
      return (
        <p key={key} className="mt-5 text-center">
          <a href={`mailto:${value}`} className="text-brand-cyan hover:underline">{value}</a>
        </p>
      );
    }

    return (
      <Reveal key={key} direction="up" className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-muted sm:text-base">
        {value}
      </Reveal>
    );
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container-x">
        {(headingField || descriptionField) && (
          <Reveal direction="up" className="mx-auto max-w-3xl text-center">
            <SectionHeading
              align="center"
              title={headingField ? data[headingField.key] : ""}
              description={descriptionField ? data[descriptionField.key] : ""}
            />
          </Reveal>
        )}
        <div className="mx-auto max-w-6xl">
          {remaining.map(renderField)}
        </div>
      </div>
    </section>
  );
}