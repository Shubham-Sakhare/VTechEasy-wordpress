import { useState } from "react";
import { useRef } from "react";
import { submitContactForm } from "../../api/wordpress";
import Button from "../ui/Button";
import DynIcon from "../ui/DynIcon";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";
import SectionFooter from "../ui/SectionFooter";
import { isToggleOn } from "../../utils/toggle";

const EMPTY_LIST = [];
const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted outline-none transition focus:border-brand-blue/60 focus:bg-white/[0.07]";

function SectionButton({ label, url, className = "" }) {
  if (!label) return null;
  return (
    <Button
      as={url ? "a" : "button"}
      href={url || undefined}
      className={className}
    >
      {label}
    </Button>
  );
}

export function AboutStory({ data = {} }) {
  const timeline = Array.isArray(data.timeline) ? data.timeline : EMPTY_LIST;
  if (!data.title && !data.description && !data.image) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal direction="left" className="relative">
          <div className="animate-gradient absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-purple/25 to-brand-blue/20 blur-2xl" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-ink-700 shadow-2xl">
            {data.image && (
              <img
                src={data.image}
                alt={data.image_alt || ""}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-ink/35" />
            {data.image_text && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center font-display text-3xl font-semibold text-brand-cyan sm:text-4xl">
                {data.image_text}
              </div>
            )}
          </div>
        </Reveal>
        <Reveal direction="right">
          <SectionHeading
            eyebrow={data.eyebrow}
            title={data.title}
            accent={data.accent}
            description={data.description}
          />
          {timeline.length > 0 && (
            <ul className="mt-8 space-y-5">
              {timeline.map((item, index) => (
                <Reveal
                  as="li"
                  key={`${item.year}-${index}`}
                  direction="up"
                  delay={index * 100}
                  className="flex gap-4"
                >
                  <span className="font-display text-xl font-extrabold text-gradient">{item.year}</span>
                  <span className="mt-1 text-sm text-muted">{item.text}</span>
                </Reveal>
              ))}
            </ul>
          )}
          <SectionButton label={data.cta_text} url={data.cta_url} className="mt-8" />
        </Reveal>
      </div>
    </section>
  );
}

export function AboutPillars({ data = {} }) {
  const values = data.values || {};
  const pillars = [
    data.mission,
    data.vision,
    values.title || values.items?.length ? { ...values, list: values.items?.map((item) => item.text).filter(Boolean) } : null,
  ].filter(Boolean);
  if (!pillars.length) return null;

  const hasHeading = Boolean(
    data.eyebrow || data.title || data.title_accent || data.description || data.image
  );

  return (
    <section className="py-10 lg:py-16">
      <div className="container-x">
        {hasHeading && (
          <Reveal className="mx-auto mb-12 flex max-w-3xl flex-col items-center text-center">
            {data.image && (
              <img
                src={data.image}
                alt={data.title || "Section image"}
                className="mb-6 h-16 w-16 rounded-2xl object-cover"
                loading="lazy"
              />
            )}
            <SectionHeading
              align="center"
              eyebrow={data.eyebrow}
              title={data.title}
              accent={data.title_accent}
              description={data.description}
            />
          </Reveal>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => (
          <Reveal
            as="article"
            key={pillar.title || index}
            direction="up"
            delay={index * 120}
            className="card card-glow p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15"
          >
            <span className={`mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${pillar.color || "from-brand-blue to-brand-cyan"} text-white shadow-lg`}>
              <Icon name={pillar.icon} className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-semibold">{pillar.title}</h3>
            {pillar.desc && <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.desc}</p>}
            {pillar.list?.length > 0 && (
              <ul className="mt-4 space-y-2.5">
                {pillar.list.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/85">
                    <Icon name="check" className="h-4 w-4 shrink-0 text-brand-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutTeam({ data = {}, isParent = true }) {
  const teamScrollRef = useRef(null);
  const members = Array.isArray(data.members) ? data.members : EMPTY_LIST;
  if (!data.title && !members.length) return null;

  // Other pages show the featured members (already filtered by the backend)
  // in an arrow-scrolled row — three visible at a time — with no scrollbar.
  const scroll = !isParent;

  const scrollTeam = (direction) => {
    const container = teamScrollRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * container.clientWidth, behavior: "smooth" });
  };

  const memberCard = (member, index, inScroll) => (
    <Reveal
      as="article"
      key={`${member.name}-${index}`}
      direction="up"
      delay={index * 90}
      className={`group card overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 ${
        inScroll
          ? "w-[calc((100%-3rem)/3)] min-w-[calc((100%-3rem)/3)] flex-none snap-start max-md:w-[80%] max-md:min-w-[80%] max-sm:w-[88%] max-sm:min-w-[88%]"
          : ""
      }`}
    >
      {member.avatar && (
        <div className="relative overflow-hidden">
          <img
            src={member.avatar}
            alt={member.name || ""}
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-80" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold">{member.name}</h3>
        <p className="text-xs text-brand-cyan">{member.role}</p>
        {member.bio && <p className="mt-2 text-xs leading-relaxed text-muted">{member.bio}</p>}
        {member.socials?.length > 0 && (
          <div className="mt-3 flex gap-2 text-white/60">
            {member.socials.map((social, socialIndex) => (
              <a
                key={`${social.icon}-${socialIndex}`}
                href={social.url || "#"}
                aria-label={member.name ? `${member.name} social profile` : social.icon}
                className="transition-colors hover:text-white"
              >
                <DynIcon name={social.icon} className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );

  // On secondary pages: a centered heading with a 3-per-row scrollable strip.
  if (scroll) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container-x">
          <Reveal className="mx-auto max-w-3xl text-center">
            <SectionHeading
              align="center"
              eyebrow={data.eyebrow}
              title={data.title}
              accent={data.accent}
              description={data.description}
            />
          </Reveal>

          <div
            ref={teamScrollRef}
            className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {members.map((member, index) => memberCard(member, index, true))}
          </div>

          <SectionFooter
            showViewAll={isToggleOn(data.cta_visible ?? Boolean(data.cta))}
            label={data.cta || "Meet Our Team"}
            url={data.cta_url || "/about"}
            icon={data.cta_icon}
            showArrows={members.length > 3}
            onPrev={() => scrollTeam(-1)}
            onNext={() => scrollTeam(1)}
            arrowLabel="team members"
          />
        </div>
      </section>
    );
  }

  // Parent page: the original left heading + full member grid.
  return (
    <section className="py-16 lg:py-24">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_2fr] lg:items-end">
          <Reveal direction="left">
            <SectionHeading
              eyebrow={data.eyebrow}
              title={data.title}
              accent={data.accent}
              description={data.description}
            />
            <SectionButton label={data.cta} url={data.cta_url} className="mt-7" />
          </Reveal>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {members.map((member, index) => memberCard(member, index, false))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutWhy({ data = {} }) {
  const stats = Array.isArray(data.stats) ? data.stats : EMPTY_LIST;
  if (!data.title && !data.description && !data.image) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {data.image && (
          <Reveal direction="left" className="relative">
            <div className="animate-gradient absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-blue/20 to-brand-purple/25 blur-2xl" />
            <img src={data.image} alt={data.title || ""} className="w-full rounded-2xl border border-white/10 shadow-2xl" loading="lazy" />
          </Reveal>
        )}
        <Reveal direction="right">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} accent={data.accent} description={data.description} />
          <SectionButton label={data.cta} url={data.cta_url} className="mt-7" />
          {stats.length > 0 && (
            <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <Reveal key={`${stat.label}-${index}`} direction="up" delay={index * 80} className="card p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg btn-gradient text-white">
                    <Icon name={stat.icon} className="h-4 w-4" />
                  </span>
                  <div className="mt-3 text-gradient font-display text-xl font-extrabold">{stat.value}</div>
                  <div className="text-xs text-muted">{stat.label}</div>
                </Reveal>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function AboutBanner({ data = {} }) {
  if (!data.title && !data.description) return null;
  return (
    <section className="py-10 lg:py-16">
      <div className="container-x">
        <Reveal direction="scale" className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-ink-700 to-ink-600 p-8 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-brand-purple/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-1/3 h-40 w-40 rounded-full bg-brand-blue/20 blur-3xl" />
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {data.eyebrow && <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">{data.eyebrow}</span>}
              <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                {data.title} {data.accent && <span className="text-gradient">{data.accent}</span>}
              </h2>
              {data.description && <p className="mt-2 max-w-md text-sm text-muted">{data.description}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <SectionButton label={data.primary_label} url={data.primary_url} />
              <SectionButton label={data.secondary_label} url={data.secondary_url} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function PricingContent({ data = {} }) {
  const plans = Array.isArray(data.plans) ? data.plans : EMPTY_LIST;
  if (!data.title && !plans.length) return null;

  return (
    <section className="py-12 lg:py-20">
      <div className="container-x">
        <Reveal>
          <SectionHeading eyebrow={data.eyebrow} title={data.title} accent={data.accent} description={data.description} align="center" />
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const features = Array.isArray(plan.features) ? plan.features : EMPTY_LIST;
            return (
              <Reveal
                as="article"
                key={`${plan.name}-${index}`}
                direction="up"
                delay={index * 120}
                className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                  plan.featured
                    ? "border-transparent bg-gradient-to-b from-brand-blue/15 to-brand-purple/10 ring-1 ring-brand-blue/40 shadow-[0_30px_80px_-30px_rgba(45,124,255,0.6)]"
                    : "card card-glow"
                }`}
              >
                {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full btn-gradient px-4 py-1 text-xs font-semibold text-white shadow">{data.popular_label}</span>}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.desc}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold text-gradient">{plan.price}</span>
                  <span className="mb-1 text-sm text-muted">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {features.map((feature, featureIndex) => (
                    <li key={`${feature.text || feature}-${featureIndex}`} className="flex items-start gap-2.5 text-sm text-white/85">
                      <Icon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                      {feature.text || feature}
                    </li>
                  ))}
                </ul>
                <Button as={plan.cta_url ? "a" : "button"} href={plan.cta_url || undefined} icon={plan.cta_icon || "arrowRight"} variant={plan.featured ? "gradient" : "outline"} className="mt-7 w-full justify-center">
                  {plan.cta}
                </Button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ContactContent({ data = {} }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [formStatus, setFormStatus] = useState({ state: "idle", message: "" });
  const info = data.info || {};
  const form = data.form || {};
  const office = data.office || {};
  const faq = data.faq || {};
  const channels = Array.isArray(info.channels) ? info.channels : EMPTY_LIST;
  const services = Array.isArray(form.services) ? form.services : EMPTY_LIST;
  const officeFeatures = Array.isArray(office.features) ? office.features : EMPTY_LIST;
  const faqItems = Array.isArray(faq.items) ? faq.items : EMPTY_LIST;
  const formFields = Array.isArray(form.fields)
    ? form.fields
    : [
        { key: "name", label: form.name_label || "Your Name", type: "text", placeholder: form.name_placeholder, required: true },
        { key: "email", label: form.email_label || "Email Address", type: "email", placeholder: form.email_placeholder, required: true },
        { key: "phone", label: form.phone_label || "Phone Number", type: "tel", placeholder: form.phone_placeholder, required: true },
        ...(services.length
          ? [{
              key: "service",
              label: form.service_label || "Service",
              type: "select",
              placeholder: form.service_placeholder,
              options: services.map((service) => service.name),
            }]
          : []),
        { key: "details", label: form.details_label || "Project Details", type: "textarea", placeholder: form.details_placeholder },
      ];

  async function handleContactSubmit(event) {
    event.preventDefault();
    setFormStatus({ state: "loading", message: "" });
    const formElement = event.currentTarget;
    const values = new FormData(formElement);
    const fields = {};
    const payload = new FormData();

    try {
      formFields.forEach((field) => {
        if (["image", "pdf", "file"].includes(field.type)) {
          const uploads = values.getAll(field.key).filter((file) => file instanceof File && file.size > 0);
          uploads.forEach((file) => {
            payload.append(`upload_${field.key}${field.multiple ? "[]" : ""}`, file);
          });
          return;
        }
        if (field.type === "checkboxes") {
          fields[field.key] = values.getAll(field.key);
        } else if (field.type === "checkbox") {
          fields[field.key] = values.get(field.key) ? "1" : "";
        } else {
          fields[field.key] = values.get(field.key) || "";
        }
      });
      fields.website = values.get("website") || "";
      payload.append("fields", JSON.stringify(fields));

      const result = await submitContactForm(payload);
      formElement.reset();
      setFormStatus({ state: "success", message: result.message });
    } catch (error) {
      setFormStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Your message could not be sent. Please try again.",
      });
    }
  }

  return (
    <>
      {(info.title || channels.length || form.title) && (
        <section id="contact-form" className="py-12 lg:py-20">
          <div className="container-x grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            {(info.title || channels.length > 0) && (
              <Reveal direction="left" className="card card-glow p-7 sm:p-8">
                <SectionHeading eyebrow={info.eyebrow} title={info.title} description={info.description} />
                <ul className="mt-7 space-y-4">
                  {channels.map((channel, index) => (
                    <Reveal key={`${channel.title}-${index}`} as="li" direction="up" delay={index * 90} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan text-white shadow-lg">
                        <Icon name={channel.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{channel.title}</span>
                        <span className="block truncate text-sm text-white/85">{channel.value}</span>
                        {channel.sub && <span className="block text-xs text-muted">{channel.sub}</span>}
                      </span>
                    </Reveal>
                  ))}
                </ul>
              </Reveal>
            )}
            {form.title && formFields.length > 0 && (
              <Reveal direction="right" className="card card-glow p-7 sm:p-8">
                <SectionHeading eyebrow={form.eyebrow} title={form.title} description={form.description} />
                <form onSubmit={handleContactSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
                  {formFields.map((field, index) => {
                    const fieldKey = String(field.key || `field_${index}`).toLowerCase().replace(/[^a-z0-9_]/g, "");
                    if (!fieldKey || !/^[a-z][a-z0-9_]{0,39}$/.test(fieldKey)) return null;
                    const type = ["text", "textarea", "email", "tel", "number", "url", "select", "radio", "checkbox", "checkboxes", "date", "time", "datetime-local", "image", "pdf", "file"].includes(field.type)
                      ? field.type
                      : "text";
                    const options = Array.isArray(field.options)
                      ? field.options
                      : typeof field.options === "string"
                        ? field.options.split(/\r?\n/).map((option) => option.trim()).filter(Boolean)
                        : [];
                    const wide = ["textarea", "radio", "checkboxes", "image", "pdf", "file"].includes(type);
                    const required = Boolean(field.required);
                    const inputClass = `${INPUT_CLASS}${wide ? " sm:col-span-2" : ""}`;
                    const accept = type === "image"
                      ? "image/jpeg,image/png,image/gif,image/webp"
                      : type === "pdf"
                        ? "application/pdf,.pdf"
                        : field.file_types === "images"
                          ? "image/jpeg,image/png,image/gif,image/webp"
                          : field.file_types === "all"
                            ? ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/jpeg,image/png,image/gif,image/webp"
                            : ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx";
                    const label = (
                      <span className="mb-1.5 block text-sm text-white/80">
                        {field.label || field.key} {required && <span className="text-brand-pink">*</span>}
                      </span>
                    );

                    if (type === "radio" || type === "checkboxes") {
                      return (
                        <fieldset key={fieldKey} className={`block ${wide ? "sm:col-span-2" : ""}`}>
                          <legend className="mb-1.5 text-sm text-white/80">
                            {field.label || field.key} {required && <span className="text-brand-pink">*</span>}
                          </legend>
                          <div className="flex flex-wrap gap-3">
                            {options.map((option, optionIndex) => (
                              <label key={`${fieldKey}-${optionIndex}`} className="inline-flex items-center gap-2 text-sm text-white/80">
                                <input
                                  name={fieldKey}
                                  type={type === "radio" ? "radio" : "checkbox"}
                                  value={option}
                                  required={required && type === "radio" && optionIndex === 0}
                                  className="h-4 w-4 accent-brand-blue"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      );
                    }

                    let control;
                    if (type === "textarea") {
                      control = <textarea name={fieldKey} rows={4} maxLength={12000} required={required} placeholder={field.placeholder || ""} className={`${INPUT_CLASS} resize-none`} />;
                    } else if (type === "select") {
                      control = (
                        <select name={fieldKey} required={required} className={`${INPUT_CLASS} appearance-none`} defaultValue="">
                          <option value="">{field.placeholder || "Choose an option"}</option>
                          {options.map((option, optionIndex) => (
                            <option key={`${fieldKey}-${optionIndex}`} value={option} className="bg-ink-700">{option}</option>
                          ))}
                        </select>
                      );
                    } else if (["image", "pdf", "file"].includes(type)) {
                      control = <input name={fieldKey} type="file" required={required} multiple={Boolean(field.multiple)} accept={accept} className={`${INPUT_CLASS} file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white`} />;
                    } else if (type === "checkbox") {
                      control = (
                        <span className="flex items-center gap-2">
                          <input name={fieldKey} type="checkbox" required={required} value="1" className="h-4 w-4 accent-brand-blue" />
                          <span className="text-sm text-white/80">{field.placeholder || field.label}</span>
                        </span>
                      );
                    } else {
                      control = <input name={fieldKey} type={type} required={required} maxLength={type === "email" ? 254 : 12000} placeholder={field.placeholder || ""} className={inputClass} />;
                    }

                    return (
                      <label key={fieldKey} className={`block ${wide ? "sm:col-span-2" : ""}`}>
                        {label}
                        {control}
                      </label>
                    );
                  })}
                  <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                    <label htmlFor="contact-website">Leave this field empty</label>
                    <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>
                  {(form.terms_text || form.privacy_text) && (
                    <label className="flex items-start gap-2 text-xs text-muted sm:col-span-2">
                      <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-blue" />
                      <span>
                        {form.terms_text && <><a href={form.terms_url || "#"} className="text-brand-cyan hover:underline">{form.terms_text}</a>{form.privacy_text && " and "}</>}
                        {form.privacy_text && <a href={form.privacy_url || "#"} className="text-brand-cyan hover:underline">{form.privacy_text}</a>}
                      </span>
                    </label>
                  )}
                  <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                    <Button type="submit" icon="send" disabled={formStatus.state === "loading"}>
                      {formStatus.state === "loading" ? "Sending..." : form.submit_label}
                    </Button>
                    {form.privacy_notice && (
                      <span className="flex items-center gap-2 text-xs text-muted">
                        <Icon name="shield" className="h-4 w-4 text-brand-cyan" />
                        {form.privacy_notice}
                      </span>
                    )}
                  </div>
                  {formStatus.message && (
                    <p
                      className={`sm:col-span-2 text-sm ${formStatus.state === "error" ? "text-brand-pink" : "text-brand-cyan"}`}
                      role={formStatus.state === "error" ? "alert" : "status"}
                      aria-live="polite"
                    >
                      {formStatus.message}
                    </p>
                  )}
                </form>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {(office.title || office.image || office.map_image) && (
        <section className="py-12 lg:py-20">
          <div className="container-x grid gap-6 overflow-hidden rounded-3xl border border-white/10 bg-ink-700/60 lg:grid-cols-3">
            {office.map_image && (
              <div className="relative min-h-64 bg-ink-800">
                <img src={office.map_image} alt={office.address || ""} className="h-full w-full object-cover opacity-80" loading="lazy" />
                {office.address && <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-medium backdrop-blur">{office.address}</span>}
              </div>
            )}
            <div className="flex flex-col justify-center p-7 sm:p-8">
              {office.eyebrow && <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">{office.eyebrow}</span>}
              <h2 className="mt-2 font-display text-2xl font-extrabold">{office.title}</h2>
              {office.description && <p className="mt-2 text-sm text-muted">{office.description}</p>}
              {officeFeatures.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {officeFeatures.map((feature, index) => (
                    <div key={`${feature.title}-${index}`} className="card p-3 text-center">
                      <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg btn-gradient text-white"><Icon name={feature.icon} className="h-4 w-4" /></span>
                      <div className="mt-2 text-xs font-semibold">{feature.title}</div>
                      <div className="text-[11px] text-muted">{feature.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {office.image && (
              <div className="relative min-h-64">
                <img src={office.image} alt={office.title || ""} className="h-full w-full object-cover" loading="lazy" />
                {office.cta && <a href={office.cta_url || "#"} className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-ink/80 px-4 py-2 text-xs font-medium backdrop-blur transition hover:bg-ink"><Icon name="play" className="h-4 w-4" />{office.cta}</a>}
              </div>
            )}
          </div>
        </section>
      )}

      {(faq.title || faqItems.length > 0) && (
        <section className="py-12 lg:py-20">
          <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal direction="left">
              <SectionHeading eyebrow={faq.eyebrow} title={faq.title} accent={faq.accent} description={faq.description} />
              <SectionButton label={faq.cta} url={faq.cta_url} className="mt-7" />
            </Reveal>
            <div className="space-y-3">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <Reveal key={`${item.q}-${index}`} direction="up" delay={index * 80} className="card overflow-hidden">
                    <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left" aria-expanded={isOpen}>
                      <span className="text-sm font-medium">{item.q}</span>
                      <Icon name={isOpen ? "minus" : "plus"} className="h-4 w-4 shrink-0 text-brand-cyan" />
                    </button>
                    <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.a}</p></div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
