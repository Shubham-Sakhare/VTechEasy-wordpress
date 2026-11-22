import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { submitContactForm } from "../api/wordpress";
import { chatbotDefaults } from "../data/chatbotDefaults";
import { usePageContext } from "../hooks/PageContentContext";
import Icon from "./ui/Icon";
import DynIcon from "./ui/DynIcon";

const STOP_WORDS = new Set([
  "about", "after", "and", "are", "can", "does", "for", "how", "is", "it",
  "my", "our", "the", "this", "what", "when", "where", "which", "with",
  "you", "your",
]);
const BRAND_ICONS = new Set([
  "facebook", "instagram", "linkedin", "telegram", "twitter", "whatsapp", "youtube",
]);

function normalizeChatbot(value) {
  const saved = value && typeof value === "object" ? value : {};
  const prompts = Array.isArray(saved.lead_prompts) ? saved.lead_prompts : [];
  const savedContact = saved.contact_action && typeof saved.contact_action === "object"
    ? saved.contact_action
    : {};

  return {
    ...chatbotDefaults,
    ...saved,
    welcome: saved.welcome || chatbotDefaults.welcome,
    quick_questions: Array.isArray(saved.quick_questions)
      ? saved.quick_questions.filter((item) => item && typeof item === "object" && item.label)
      : chatbotDefaults.quick_questions,
    faqs: Array.isArray(saved.faqs)
      ? saved.faqs.filter((faq) => faq && typeof faq === "object" && faq.question && faq.answer)
      : chatbotDefaults.faqs,
    lead_prompts: chatbotDefaults.lead_prompts.map((prompt, index) => prompts[index] || prompt),
    fallback: { ...chatbotDefaults.fallback, ...(saved.fallback || {}) },
    handoff_keywords: saved.handoff_keywords || chatbotDefaults.handoff_keywords,
    off_topic_keywords: saved.off_topic_keywords || chatbotDefaults.off_topic_keywords,
    actions: Array.isArray(saved.actions)
      ? saved.actions.filter((action) => action && typeof action === "object")
      : chatbotDefaults.actions,
    contact_action: {
      ...chatbotDefaults.contact_action,
      ...savedContact,
      behavior: savedContact.behavior === "redirect" ? "redirect" : "chat_form",
      label: savedContact.label || chatbotDefaults.contact_action.label,
      icon: savedContact.icon || chatbotDefaults.contact_action.icon,
      redirect_url: savedContact.redirect_url || chatbotDefaults.contact_action.redirect_url,
    },
  };
}

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function matchesKeywordList(query, value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((keyword) => query.includes(keyword));
}

function makeReply(question, chatbot) {
  const query = question.trim().toLowerCase();
  if (matchesKeywordList(query, chatbot.handoff_keywords)) {
    return { text: chatbot.fallback.human, openLeadForm: true };
  }

  const queryTokens = new Set(tokens(question));
  let bestFaq = null;
  let bestScore = 0;
  for (const faq of chatbot.faqs) {
    const questionTokens = new Set(tokens(faq.question));
    const keywords = new Set(tokens(faq.keywords));
    let score = 0;
    for (const token of queryTokens) {
      if (questionTokens.has(token)) score += 2;
      else if (keywords.has(token)) score += 1;
    }
    if (score > bestScore) {
      bestFaq = faq;
      bestScore = score;
    }
  }

  if (bestFaq && bestScore > 0) {
    const link = bestFaq.link_url
      ? { label: bestFaq.link_label || "Learn more", url: bestFaq.link_url }
      : null;
    return {
      text: bestFaq.answer,
      link,
      openLeadForm: true,
    };
  }

  if (matchesKeywordList(query, chatbot.off_topic_keywords)) {
    return { text: chatbot.fallback.off_topic };
  }
  return { text: chatbot.fallback.unknown, openLeadForm: true };
}

function getActionUrl(action, lead) {
  const url = String(action.url || "");
  const isWhatsApp = /whatsapp/i.test(`${action.label || ""} ${action.icon || ""}`);
  if (!isWhatsApp || !lead || !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(url) || /[?&]text=/i.test(url)) {
    return url;
  }
  const message = `Hi, I just submitted an enquiry to Tech Easy.\nName: ${lead.name}\nProject: ${lead.project}\nContact: ${lead.contact}\nRequirements: ${lead.details}`;
  return `${url}${url.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}`;
}

function ConfigIcon({ name, className = "" }) {
  if (!name) return <Icon name="link" className={className} />;
  if (/^(https?:\/\/|\/)/i.test(name)) {
    return <img src={name} alt="" aria-hidden="true" className={`h-5 w-5 object-contain ${className}`} />;
  }
  if (BRAND_ICONS.has(name)) return <Icon name={name} className={className} />;
  return <DynIcon name={name} className={className} />;
}

function isInternalUrl(url) {
  return typeof url === "string" && (url.startsWith("/") || url.startsWith("#"));
}

function isNewTabUrl(url) {
  return /^https?:\/\//i.test(url);
}

function MessageLink({ link, onNavigate }) {
  if (!link?.url) return null;
  const className = "mt-2 inline-flex items-center gap-1 font-semibold text-brand-cyan hover:underline";
  if (isInternalUrl(link.url)) {
    return <Link to={link.url} onClick={onNavigate} className={className}>{link.label}</Link>;
  }
  return (
    <a
      href={link.url}
      target={isNewTabUrl(link.url) ? "_blank" : undefined}
      rel={isNewTabUrl(link.url) ? "noopener noreferrer" : undefined}
      className={className}
    >
      {link.label}
    </a>
  );
}

export default function ChatWidget() {
  const { footer, chatbot: savedChatbot } = usePageContext();
  const chatbot = normalizeChatbot(savedChatbot);
  const contact = footer?.contact || {};
  const contactAction = chatbot.contact_action;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [leadStep, setLeadStep] = useState(null);
  const [lead, setLead] = useState({ name: "", project: "", contact: "", details: "" });
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadStatus, setLeadStatus] = useState({ state: "idle", message: "" });
  const [submittedLead, setSubmittedLead] = useState(null);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: 0, sender: "bot", text: chatbot.welcome, openLeadForm: false },
  ]);
  const scrollRef = useRef(null);
  const nextId = useRef(1);
  const replyTimer = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if ("Escape" === event.key) setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, leadStep, leadStatus, showContactOptions]);

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  function addMessage(sender, text, options = {}) {
    setMessages((current) => [...current, {
      id: nextId.current++,
      sender,
      text,
      ...options,
    }]);
  }

  function replyAfterTyping(text, options = {}) {
    window.clearTimeout(replyTimer.current);
    setIsTyping(true);
    replyTimer.current = window.setTimeout(() => {
      addMessage("bot", text, options);
      setIsTyping(false);
    }, 350);
  }

  function startLeadCapture() {
    if (leadStep !== null || leadStatus.state === "sending") return;
    setLead({ name: "", project: "", contact: "", details: "" });
    setLeadConsent(false);
    setLeadStatus({ state: "idle", message: "" });
    setSubmittedLead(null);
    setShowContactOptions(false);
    setLeadStep(0);
    addMessage("bot", chatbot.lead_prompts[0]);
  }

  function activateContactAction() {
    if (contactAction.behavior === "redirect") {
      const url = contactAction.redirect_url;
      setOpen(false);
      if (isInternalUrl(url)) {
        navigate(url);
      } else if (isNewTabUrl(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(url);
      }
      return;
    }
    if (leadStep === null) startLeadCapture();
    else setShowContactOptions(false);
  }

  function sendLeadAnswer(value) {
    if (leadStep === 2 && !isValidContact(value)) {
      replyAfterTyping("Please enter a valid phone number or email address so our team can reach you.");
      return;
    }

    const keys = ["name", "project", "contact", "details"];
    const updatedLead = {
      ...lead,
      [keys[leadStep]]: value.trim().slice(0, leadStep === 3 ? 1000 : 254),
    };
    setLead(updatedLead);
    setLeadStatus({ state: "idle", message: "" });

    if (leadStep < keys.length - 1) {
      const nextStep = leadStep + 1;
      setLeadStep(nextStep);
      replyAfterTyping(chatbot.lead_prompts[nextStep]);
      return;
    }

    setLeadStep(4);
    replyAfterTyping(
      "Thank you. Before I send this to our team, please confirm that we may use these details to contact you.",
    );
  }

  function handleQuestion(value = question, quickAction = "question") {
    const text = value.trim().slice(0, 500);
    if (!text || isTyping || leadStep === 4) return;
    addMessage("user", text);
    setQuestion("");

    if (leadStep !== null) {
      sendLeadAnswer(text);
      return;
    }
    if ("contact" === quickAction) {
      activateContactAction();
      return;
    }
    const reply = makeReply(text, chatbot);
    replyAfterTyping(reply.text, {
      link: reply.link,
      openLeadForm: reply.openLeadForm,
    });
  }

  async function submitLead() {
    if (!leadConsent || leadStatus.state === "sending") return;
    setLeadStatus({ state: "sending", message: "" });
    setSubmittedLead(lead);
    try {
      const result = await submitContactForm({
        source: "chat_assistant",
        name: lead.name,
        project: lead.project,
        contact: lead.contact,
        details: lead.details,
        consent: true,
        website: "",
      });
      setLeadStatus({ state: "success", message: "" });
      setLeadStep(null);
      addMessage(
        "bot",
        `Thank you, ${lead.name}! Our team will contact you within 24 hours. Is there anything else I can help you with? 😊`,
      );
      if (result?.message && import.meta.env.DEV) {
        console.info("[Chat] Enquiry sent:", result.message);
      }
    } catch (error) {
      setLeadStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Your enquiry could not be sent. Please try again.",
      });
    } finally {
      setShowContactOptions(true);
    }
  }

  const activeActions = chatbot.actions.filter((action) => action?.label && action?.icon && action?.url);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end">
      {open && (
        <section
          aria-label="Tech Easy assistant chat"
          className="mb-3 flex max-h-[min(76vh,42rem)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/50"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-white">Tech Easy Assistant</h2>
              <p className="text-xs text-white/80">Here to help with your project</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-white/90 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Close chat"
            >
              <Icon name="minus" className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="min-h-36 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${"user" === message.sender ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  "user" === message.sender
                    ? "rounded-br-sm bg-brand-blue text-white"
                    : "rounded-bl-sm border border-white/10 bg-white/[0.05] text-white/90"
                }`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <MessageLink link={message.link} onNavigate={() => setOpen(false)} />
                  {message.openLeadForm && (
                    <button
                      type="button"
                      onClick={activateContactAction}
                      className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-cyan hover:underline"
                    >
                      {contactAction.label} <ConfigIcon name={contactAction.icon} className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white/70" role="status">
                  Typing...
                </div>
              </div>
            )}

            {messages.length === 1 && leadStep === null && chatbot.quick_questions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chatbot.quick_questions.map((item, index) => (
                  <button
                    key={`${item.label}-${index}`}
                    type="button"
                    onClick={() => handleQuestion(item.question || item.label, item.action)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-left text-xs text-white/80 hover:border-brand-cyan/50 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            {leadStep === 4 && (
              <div className="mb-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <label className="flex items-start gap-2 text-xs leading-relaxed text-white/75">
                  <input
                    type="checkbox"
                    checked={leadConsent}
                    onChange={(event) => setLeadConsent(event.target.checked)}
                    className="mt-0.5 accent-brand-blue"
                  />
                  <span>
                    I agree to share my enquiry with Tech Easy and have read the{" "}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-cyan underline">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
                {leadStatus.message && <p role="alert" className="text-xs text-rose-300">{leadStatus.message}</p>}
                <button
                  type="button"
                  onClick={submitLead}
                  disabled={!leadConsent || leadStatus.state === "sending"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leadStatus.state === "sending" ? "Sending..." : "Send enquiry"}
                  <Icon name="send" className="h-4 w-4" />
                </button>
              </div>
            )}

            {showContactOptions && (
              <div className="mb-3 flex flex-wrap justify-center gap-3" aria-label="Other ways to contact Tech Easy">
                {activeActions.map((action, index) => {
                  const url = getActionUrl(action, submittedLead);
                  const linkClass = "flex min-w-20 flex-col items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-[11px] text-white/80 hover:bg-white/10";
                  const content = (
                    <>
                      <ConfigIcon name={action.icon} className="h-5 w-5" />
                      {action.label}
                    </>
                  );
                  return isInternalUrl(url) ? (
                    <Link key={`${action.label}-${index}`} to={url} onClick={() => setOpen(false)} className={linkClass}>
                      {content}
                    </Link>
                  ) : (
                    <a
                      key={`${action.label}-${index}`}
                      href={url}
                      target={isNewTabUrl(url) ? "_blank" : undefined}
                      rel={isNewTabUrl(url) ? "noopener noreferrer" : undefined}
                      className={linkClass}
                    >
                      {content}
                    </a>
                  );
                })}

                {contactAction.behavior === "redirect" ? (
                  isInternalUrl(contactAction.redirect_url) ? (
                    <Link
                      to={contactAction.redirect_url}
                      onClick={() => setOpen(false)}
                      className="flex min-w-20 flex-col items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      <ConfigIcon name={contactAction.icon} className="h-5 w-5" />
                      {contactAction.label}
                    </Link>
                  ) : (
                    <a
                      href={contactAction.redirect_url}
                      target={isNewTabUrl(contactAction.redirect_url) ? "_blank" : undefined}
                      rel={isNewTabUrl(contactAction.redirect_url) ? "noopener noreferrer" : undefined}
                      className="flex min-w-20 flex-col items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      <ConfigIcon name={contactAction.icon} className="h-5 w-5" />
                      {contactAction.label}
                    </a>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={activateContactAction}
                    className="flex min-w-20 flex-col items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-[11px] text-white/80 hover:bg-white/10"
                  >
                    <ConfigIcon name={contactAction.icon} className="h-5 w-5" />
                    {contactAction.label}
                  </button>
                )}
              </div>
            )}

            <p className="mb-2 text-[11px] leading-relaxed text-white/55">
              By chatting, you agree to our{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/80">
                Privacy Policy
              </a>.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleQuestion();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={leadStep === 3 ? 1000 : 500}
                placeholder={leadStep === 4 ? "Please confirm above to send" : leadStep !== null ? "Type your answer..." : "Ask about our services..."}
                aria-label={leadStep !== null ? "Answer the assistant" : "Ask the assistant a question"}
                disabled={isTyping || leadStep === 4}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand-cyan/50 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() || isTyping || leadStep === 4}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-blue text-white transition hover:bg-brand-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="send" className="h-4 w-4" />
              </button>
            </form>
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="mt-2 block text-center text-xs text-white/60 hover:text-white">
                {contact.email}
              </a>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((visible) => !visible)}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
        className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-xl shadow-brand-blue/30 ring-1 ring-white/20 transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
      >
        <Icon name={open ? "minus" : "message"} className="h-6 w-6" />
      </button>
    </div>
  );
}

function isValidContact(value) {
  const contact = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return true;
  const digits = contact.replace(/\D/g, "");
  return /^[+()\d.\-\s]+$/.test(contact) && digits.length >= 7 && digits.length <= 15;
}
