import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./ui/Icon";
import DynIcon from "./ui/DynIcon";

const RAW_API_BASE = (import.meta.env.VITE_WP_API_URL || "").replace(/\/+$/, "").replace(/\/wp-json$/, "");
const REST_MODE = String(import.meta.env.VITE_WP_REST_MODE || "query").toLowerCase();
const API_BASE = import.meta.env.DEV && RAW_API_BASE ? "/wp-proxy" : RAW_API_BASE;
const STORAGE_KEY = "techeasy-guided-chat-v1";
const FLOW_SESSION_KEY = "techeasy-guided-chat-session-v1";
const INTERESTS = ["Price", "Services", "Timeline", "Support", "Other"];
const EMPTY_LEAD = { service: "", name: "", email: "", mobile: "", interest: "", message: "" };
const DEFAULT_CONFIG = {
  welcome: "Hi! 👋 I'm the Tech Easy AI assistant. How can I help you today?",
  bot_name: "Tech Easy Assistant",
  avatar: "",
  primary_color: "#2563eb",
  position: "right",
  quick_questions: [],
  faqs: [],
  lead_questions: {
    service: "Which service are you interested in?",
    name: "May I know your name?",
    email: "What is your email address?",
    mobile: "What is your mobile number?",
    interest: "What do you want to know about?",
    message: "Please share a short message about your project. This is optional.",
  },
  fallback: "I'm not sure about that. Please share your details and our team will contact you shortly.",
  actions: [
    { id: "whatsapp", icon: "whatsapp", label: "WhatsApp", url: "https://wa.me/919096337434" },
    { id: "instagram", icon: "instagram", label: "Instagram", url: "https://www.instagram.com/vtecheasy/?hl=en" },
    { id: "contact", icon: "contact", label: "Contact", url: "/contact#contact-form" },
  ],
};

function apiUrl(route) {
  const base = API_BASE || window.location.origin;
  const path = `/techeasy-chat/v1/${route}`;
  if (REST_MODE === "path") return `${base}/wp-json${path}`;
  const url = new URL(`${base}/`, base.startsWith("/") ? window.location.origin : undefined);
  url.searchParams.set("rest_route", path);
  return url.toString();
}

function normalizeConfig(value) {
  const saved = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    quick_questions: Array.isArray(saved.quick_questions) ? saved.quick_questions : [],
    faqs: Array.isArray(saved.faqs) ? saved.faqs : [],
    lead_questions: { ...DEFAULT_CONFIG.lead_questions, ...(saved.lead_questions || {}) },
    actions: Array.isArray(saved.actions) ? saved.actions : DEFAULT_CONFIG.actions,
  };
}

function ConfigIcon({ action }) {
  if (action.icon_url) {
    return <img src={action.icon_url} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />;
  }
  if (action.icon === "whatsapp" || action.icon === "instagram" || action.icon === "contact") {
    return <Icon name={action.icon === "contact" ? "mail" : action.icon} className="h-5 w-5" />;
  }
  return <DynIcon name={action.icon || "link"} className="h-5 w-5" />;
}

function MessageLink({ link, onNavigate }) {
  if (!link?.url) return null;
  const className = "mt-2 inline-flex items-center gap-1 font-semibold text-cyan-300 hover:underline";
  if (link.url.startsWith("/") || link.url.startsWith("#")) {
    return <Link to={link.url} onClick={onNavigate} className={className}>{link.label}</Link>;
  }
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  );
}

function isValidMobile(value) {
  return /^(?:\+91)?[6-9]\d{9}$/.test(value.replace(/[\s().-]/g, ""));
}

function makeTopicButtons(config) {
  return config.quick_questions.map((topic) => ({
    label: topic.label,
    action: "topic",
    topicId: topic.id,
  }));
}

export default function ChatWidget() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [messages, setMessages] = useState([]);
  const [path, setPath] = useState([]);
  const [lead, setLead] = useState(EMPTY_LEAD);
  const [leadStep, setLeadStep] = useState("");
  const [question, setQuestion] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState("");
  const scrollRef = useRef(null);
  const nextId = useRef(1);
  const replyTimer = useRef(null);
  const flowSessionId = useRef("");

  useEffect(() => {
    let active = true;
    fetch(apiUrl("config"), { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Chat settings could not be loaded.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        const loaded = normalizeConfig(data);
        setConfig(loaded);
        setIsTyping(false);
        try {
          const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
          if (saved && Array.isArray(saved.messages) && saved.messages.length) {
            setMessages(saved.messages);
            setPath(Array.isArray(saved.path) ? saved.path : []);
            setLead({ ...EMPTY_LEAD, ...(saved.lead || {}) });
            setLeadStep(typeof saved.leadStep === "string" ? saved.leadStep : "");
            nextId.current = saved.messages.reduce((max, message) => Math.max(max, message.id || 0), 0) + 1;
            return;
          }
        } catch (error) {
          console.warn("Saved chat session could not be restored.", error);
        }
        setMessages([{
          id: nextId.current++,
          sender: "bot",
          text: loaded.welcome,
          feature: { type: "buttons", buttons: makeTopicButtons(loaded) },
        }]);
      })
      .catch((error) => {
        if (!active) return;
        setIsTyping(false);
        setApiError(error instanceof Error ? error.message : "The chat service is unavailable.");
        setMessages([{
          id: nextId.current++,
          sender: "bot",
          text: "Chat is temporarily unavailable. Please try again later or use the contact links below.",
        }]);
      });
    return () => {
      active = false;
      window.clearTimeout(replyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, path, lead, leadStep }));
    } catch (error) {
      console.warn("Chat session could not be saved.", error);
    }
  }, [messages, path, lead, leadStep]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isOpen, leadStep]);

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  function addMessage(sender, text, feature) {
    setMessages((current) => [...current, {
      id: nextId.current++,
      sender,
      text,
      ...(feature ? { feature } : {}),
    }].slice(-80));
  }

  function getFlowSessionId() {
    if (flowSessionId.current) return flowSessionId.current;
    try {
      flowSessionId.current = sessionStorage.getItem(FLOW_SESSION_KEY) || "";
    } catch (error) {
      flowSessionId.current = "";
    }
    if (!flowSessionId.current) {
      flowSessionId.current = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `tea-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      try {
        sessionStorage.setItem(FLOW_SESSION_KEY, flowSessionId.current);
      } catch (error) {
        console.warn("Chat flow session could not be saved.", error);
      }
    }
    return flowSessionId.current;
  }

  async function requestFlow(payload) {
    const response = await fetch(apiUrl("flow"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, session_id: getFlowSessionId() }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || "The chat flow could not be loaded.");
    return result;
  }

  function replyAfterTyping(text, feature) {
    window.clearTimeout(replyTimer.current);
    setIsTyping(true);
    replyTimer.current = window.setTimeout(() => {
      setIsTyping(false);
      addMessage("bot", text, feature);
    }, 600);
  }

  function findFaq(id) {
    return config.faqs.find((faq) => faq.id === id);
  }

  function relatedButtons(ids) {
    return (Array.isArray(ids) ? ids : [])
      .map((id) => findFaq(id))
      .filter(Boolean)
      .map((faq) => ({ label: faq.question, action: "related", faqId: faq.id }));
  }

  function answerFaq(faq, userText) {
    if (!faq) {
      replyAfterTyping(config.fallback, { type: "fallback" });
      return;
    }
    if (userText) addMessage("user", userText);
    setPath((current) => [...current, faq.question].slice(-60));
    replyAfterTyping(faq.answer, {
      type: "answer",
      buttons: relatedButtons(faq.related_ids),
      helpful: true,
    });
  }

  function startLead(service = lead.service) {
    const emptyLead = { ...EMPTY_LEAD, service: service || "" };
    setLead(emptyLead);
    setLeadStep("service");
    replyAfterTyping(config.lead_questions.service, { type: "lead-service", selected: emptyLead.service });
  }

  function askLead(step, nextLead = lead) {
    setLeadStep(step);
    const feature = step === "service"
      ? { type: "lead-service", selected: nextLead.service }
      : step === "interest"
        ? { type: "lead-interest" }
        : step === "submit"
          ? { type: "lead-submit" }
          : null;
    const text = step === "submit"
      ? "Your details are ready. Send your enquiry when you are ready."
      : config.lead_questions[step];
    replyAfterTyping(text || "Please provide the requested information.", feature);
  }

  function chooseService(service) {
    addMessage("user", service);
    const nextLead = { ...lead, service };
    setLead(nextLead);
    askLead("name", nextLead);
    setPath((current) => [...current, `Service: ${service}`].slice(-60));
  }

  function chooseInterest(interest) {
    addMessage("user", interest);
    const nextLead = { ...lead, interest };
    setLead(nextLead);
    askLead("message", nextLead);
    setPath((current) => [...current, `Interest: ${interest}`].slice(-60));
  }

  async function showTopic(topic) {
    addMessage("user", topic.label);
    setPath((current) => [...current, topic.label].slice(-60));
    setLead((current) => ({ ...current, service: topic.label }));
    if (topic.action === "contact") {
      startLead(topic.label);
      return;
    }
    if (topic.action === "answer") {
      answerFaq(findFaq(topic.answer_id));
      return;
    }
    setIsTyping(true);
    try {
      const flow = await requestFlow({ action: "topic", topic_id: topic.id });
      replyAfterTyping(flow.intro || topic.intro || `What would you like to know about ${topic.label}?`, {
        type: "buttons",
        topicLabel: flow.topic_label,
        visitedCount: flow.visited_count,
        totalCount: flow.total_options,
        buttons: flow.options.map((option) => ({
          label: option.label,
          action: option.action === "contact" ? "contact" : "option",
          optionId: option.id,
          topicId: topic.id,
        })),
      });
    } catch (error) {
      setIsTyping(false);
      replyAfterTyping(error instanceof Error ? error.message : "The chat flow could not be loaded.");
    }
  }

  async function showOption(topic, option) {
    addMessage("user", option.label);
    setPath((current) => [...current, option.label].slice(-60));
    setIsTyping(true);
    try {
      const flow = await requestFlow({ action: "option", topic_id: topic.id, option_id: option.id });
      if (flow.option_action === "contact") {
        setIsTyping(false);
        startLead(topic.label);
        return;
      }
      const remaining = flow.remaining.map((item) => ({
        label: item.label,
        action: item.action === "contact" ? "contact" : "option",
        optionId: item.id,
        topicId: topic.id,
      }));
      const related = (flow.related || []).map((item) => ({
        label: item.question,
        action: "related",
        faqId: item.id,
      }));
      replyAfterTyping(flow.answer, {
        type: "guided-answer",
        topicLabel: flow.topic_label,
        visitedCount: flow.visited_count,
        totalCount: flow.total_options,
        buttons: [...related, ...remaining, { label: "← Back to services", action: "back" }],
        helpful: true,
      });
    } catch (error) {
      setIsTyping(false);
      replyAfterTyping(error instanceof Error ? error.message : "The chat flow could not be loaded.");
    }
  }

  function matchFaq(text) {
    const query = text.toLowerCase();
    let best = null;
    let bestScore = 0;
    config.faqs.forEach((faq) => {
      const keywords = String(faq.keywords || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
      const matches = keywords.filter((keyword) => query.includes(keyword) || keyword.includes(query));
      if (matches.length > bestScore) {
        best = faq;
        bestScore = matches.length;
      }
    });
    return best;
  }

  function handleText(value = question) {
    const text = value.trim().slice(0, 1000);
    if (!text || isTyping || isSending || leadStep === "service" || leadStep === "interest" || leadStep === "submit") return;
    setQuestion("");
    addMessage("user", text);
    if (leadStep === "name") {
      const nextLead = { ...lead, name: text.slice(0, 190) };
      setLead(nextLead);
      askLead("email", nextLead);
      return;
    }
    if (leadStep === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        replyAfterTyping("Please enter a valid email address.");
        return;
      }
      const nextLead = { ...lead, email: text.slice(0, 190) };
      setLead(nextLead);
      askLead("mobile", nextLead);
      return;
    }
    if (leadStep === "mobile") {
      if (!isValidMobile(text)) {
        replyAfterTyping("Please enter a valid 10-digit mobile number, optionally with +91.");
        return;
      }
      const nextLead = { ...lead, mobile: text.replace(/[\s().-]/g, "") };
      setLead(nextLead);
      askLead("interest", nextLead);
      return;
    }
    if (leadStep === "message") {
      const nextLead = { ...lead, message: text.slice(0, 5000) };
      setLead(nextLead);
      askLead("submit", nextLead);
      return;
    }
    const faq = matchFaq(text);
    if (faq) {
      setPath((current) => [...current, text].slice(-60));
      answerFaq(faq);
    } else {
      replyAfterTyping(config.fallback);
      window.setTimeout(() => startLead(lead.service), 650);
    }
  }

  function runButton(button, messageId) {
    if (isTyping || isSending) return;
    if (messageId) {
      setMessages((current) => current.map((message) => (
        message.id === messageId ? { ...message, feature: null } : message
      )));
    }
    if (button.action === "topic") {
      const topic = config.quick_questions.find((item) => item.id === button.topicId);
      if (topic) showTopic(topic);
    } else if (button.action === "option") {
      const topic = config.quick_questions.find((item) => item.id === button.topicId);
      const option = topic?.options?.find((item) => item.id === button.optionId);
      if (topic && option) showOption(topic, option);
    } else if (button.action === "related") {
      const faq = findFaq(button.faqId);
      if (faq) answerFaq(faq, button.label);
    } else if (button.action === "contact") {
      addMessage("user", button.label);
      const topic = config.quick_questions.find((item) => item.id === button.topicId);
      startLead(topic?.label || lead.service);
    } else if (button.action === "back") {
      addMessage("user", "Back to services");
      replyAfterTyping("What would you like help with?", {
        type: "buttons",
        buttons: makeTopicButtons(config),
      });
    } else if (button.action === "help-yes") {
      addMessage("user", "Yes");
      replyAfterTyping("Great, glad I could help! 😊 Want a free quote?", { type: "quote" });
    } else if (button.action === "help-no") {
      addMessage("user", "No");
      addMessage("bot", "Sorry I couldn't fully help. Please share your details and our team will contact you shortly.");
      startLead(lead.service);
    } else if (button.action === "quote") {
      addMessage("user", "Get a Free Quote");
      startLead(lead.service);
    } else if (button.action === "no-thanks") {
      addMessage("user", "No, thanks");
      replyAfterTyping("No problem. You can reach us through the contact links below.");
    } else if (button.action === "lead-service") {
      chooseService(button.value);
    } else if (button.action === "lead-interest") {
      chooseInterest(button.value);
    } else if (button.action === "fallback-contact") {
      startLead(lead.service);
    }
  }

  async function sendLead() {
    if (isSending || !lead.name || !lead.email || !lead.mobile || !lead.service || !lead.interest) return;
    setIsSending(true);
    try {
      const response = await fetch(apiUrl("leads"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, chat_path: path, website: "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Your enquiry could not be sent.");
      setLeadStep("");
      let text = `Thank you, ${lead.name}! Your enquiry has been sent. Our team will contact you within 24 hours.`;
      if (result.email_sent === false || result.webhook_sent === false) {
        text += " A notification could not be delivered, so please also contact us using the links below.";
      }
      addMessage("bot", text);
    } catch (error) {
      addMessage("bot", error instanceof Error ? error.message : "Your enquiry could not be sent. Please try again.", {
        type: "lead-submit",
      });
    } finally {
      setIsSending(false);
    }
  }

  function restartChat() {
    window.clearTimeout(replyTimer.current);
    const welcome = {
      id: nextId.current++,
      sender: "bot",
      text: config.welcome,
      feature: { type: "buttons", buttons: makeTopicButtons(config) },
    };
    setMessages([welcome]);
    setPath([]);
    setLead({ ...EMPTY_LEAD });
    setLeadStep("");
    setQuestion("");
    setIsTyping(false);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(FLOW_SESSION_KEY);
    flowSessionId.current = "";
  }

  const positionClass = config.position === "left" ? "left-5 items-start" : "right-5 items-end";

  return (
    <div
      className={`fixed bottom-5 z-[100] flex flex-col ${positionClass}`}
      style={{ "--chat-primary": config.primary_color || "#2563eb" }}
    >
      {isOpen && (
        <section
          aria-label={`${config.bot_name || "Chat assistant"} conversation`}
          className="mb-3 flex max-h-[min(78vh,44rem)] w-[min(25rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101323] text-white shadow-2xl shadow-black/50 max-sm:fixed max-sm:inset-0 max-sm:mb-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:rounded-none"
        >
          <header className="flex items-center justify-between bg-[linear-gradient(115deg,var(--chat-primary),#6d28d9)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {config.avatar && <img src={config.avatar} alt="" className="h-10 w-10 rounded-full border border-white/30 object-cover" />}
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">{config.bot_name || "Tech Easy Assistant"}</h2>
                <p className="text-xs text-white/75">Here to help with your project</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={restartChat} className="rounded-full p-2 text-lg hover:bg-white/15" aria-label="Restart chat" title="Restart chat">↻</button>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-lg hover:bg-white/15" aria-label="Close chat">×</button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-36 flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.sender === "user"
                    ? "rounded-br-sm bg-[var(--chat-primary)] text-white"
                    : "rounded-bl-sm border border-white/10 bg-white/[0.05] text-white/90"
                }`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.link && <MessageLink link={message.link} onNavigate={() => setIsOpen(false)} />}
                  {message.feature?.topicLabel && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-white/55">
                        <span>{message.feature.topicLabel}</span>
                        {typeof message.feature.visitedCount === "number" && typeof message.feature.totalCount === "number" && (
                          <span>{message.feature.visitedCount}/{message.feature.totalCount} viewed</span>
                        )}
                      </div>
                      {typeof message.feature.visitedCount === "number" && typeof message.feature.totalCount === "number" && (
                        <div className="h-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-cyan-300 transition-all"
                            style={{ width: `${message.feature.totalCount ? (message.feature.visitedCount / message.feature.totalCount) * 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {message.feature?.buttons?.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {message.feature.buttons.map((button, index) => (
                        <button
                          key={`${button.action}-${button.label}-${index}`}
                          type="button"
                          disabled={isTyping || isSending}
                          onClick={() => runButton(button, message.id)}
                          className="rounded-xl border border-white/15 px-3 py-2.5 text-left text-xs leading-snug text-white/90 transition hover:-translate-y-px hover:border-cyan-300/70 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {button.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.feature?.helpful && (
                    <div className="mt-3">
                      <p className="mb-2 text-[11px] text-white/60">Was this helpful?</p>
                      <div className="flex gap-2">
                        {[
                          { label: "Yes", action: "help-yes" },
                          { label: "No", action: "help-no" },
                        ].map((button) => (
                          <button
                            key={button.action}
                            type="button"
                            disabled={isTyping || isSending}
                            onClick={() => runButton(button, message.id)}
                            className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-cyan-300/70 disabled:opacity-50"
                          >
                            {button.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.feature?.type === "quote" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => runButton({ action: "quote" }, message.id)} className="rounded-full bg-[var(--chat-primary)] px-3 py-2 text-xs font-semibold">Get a Free Quote</button>
                      <button type="button" onClick={() => runButton({ action: "no-thanks" }, message.id)} className="rounded-full border border-white/15 px-3 py-2 text-xs">No, thanks</button>
                    </div>
                  )}
                  {message.feature?.type === "lead-service" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {config.quick_questions.filter((topic) => topic.action !== "contact").map((topic) => (
                        <button key={topic.id} type="button" onClick={() => runButton({ action: "lead-service", value: topic.label }, message.id)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-cyan-300/70">
                          {topic.label}{topic.label === message.feature.selected ? " (selected)" : ""}
                        </button>
                      ))}
                      <button type="button" onClick={() => runButton({ action: "lead-service", value: "Other" }, message.id)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-cyan-300/70">Other</button>
                    </div>
                  )}
                  {message.feature?.type === "lead-interest" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {INTERESTS.map((interest) => (
                        <button key={interest} type="button" onClick={() => runButton({ action: "lead-interest", value: interest }, message.id)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-cyan-300/70">{interest}</button>
                      ))}
                    </div>
                  )}
                  {message.feature?.type === "fallback" && (
                    <button type="button" onClick={() => runButton({ action: "fallback-contact" }, message.id)} className="mt-3 rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-cyan-300/70">Share my details</button>
                  )}
                  {message.feature?.type === "lead-submit" && (
                    <button type="button" disabled={isSending} onClick={sendLead} className="mt-3 rounded-full bg-[var(--chat-primary)] px-4 py-2 text-xs font-semibold disabled:opacity-60">
                      {isSending ? "Sending..." : "Send Enquiry"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start"><div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white/65" role="status">Typing...</div></div>
            )}
          </div>

          <div className="flex shrink-0 justify-center gap-2 border-t border-white/10 bg-white/[0.025] px-2 py-2" aria-label="Contact links">
            {config.actions.filter((action) => action?.url && action?.label).map((action) => {
              const internal = action.url.startsWith("/") || action.url.startsWith("#");
              const className = "flex max-w-[33%] items-center gap-1.5 rounded-lg border border-white/15 px-2 py-1.5 text-[10px] text-white/85 hover:border-cyan-300/60";
              const content = <><ConfigIcon action={action} /><span className="truncate">{action.label}</span></>;
              return internal ? (
                <Link key={action.id || action.label} to={action.url} onClick={() => setIsOpen(false)} className={className}>{content}</Link>
              ) : (
                <a
                  key={action.id || action.label}
                  href={action.url}
                  target={/^https?:\/\//i.test(action.url) ? "_blank" : undefined}
                  rel={/^https?:\/\//i.test(action.url) ? "noopener noreferrer" : undefined}
                  className={className}
                >
                  {content}
                </a>
              );
            })}
          </div>

          <div className="border-t border-white/10 p-3">
            <p className="mb-2 text-[10px] leading-relaxed text-white/55">
              By chatting, you agree to our{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
            </p>
            {apiError && <p role="alert" className="mb-2 text-xs text-rose-300">{apiError}</p>}
            {leadStep === "message" && (
              <button type="button" disabled={isTyping} onClick={() => { setQuestion(""); askLead("submit", { ...lead, message: "" }); }} className="mb-2 text-xs text-cyan-200 underline disabled:opacity-50">
                Skip message
              </button>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (leadStep === "message" && !question.trim()) {
                  askLead("submit", { ...lead, message: "" });
                } else {
                  handleText();
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={leadStep === "message" ? 5000 : 1000}
                placeholder={
                  leadStep === "name" ? "Your name..." :
                    leadStep === "email" ? "Your email..." :
                      leadStep === "mobile" ? "Your mobile number..." :
                        leadStep === "message" ? "Message (optional)..." : "Ask about our services..."
                }
                aria-label={leadStep ? `Enter ${leadStep}` : "Ask the assistant a question"}
                disabled={isTyping || isSending || ["service", "interest", "submit"].includes(leadStep)}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() && leadStep !== "message" || isTyping || isSending || ["service", "interest", "submit"].includes(leadStep)}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--chat-primary)] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="send" className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(135deg,var(--chat-primary),#6d28d9)] text-white shadow-xl shadow-black/40 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        {isOpen ? <Icon name="minus" className="h-5 w-5" /> : <Icon name="message-circle" className="h-6 w-6" />}
      </button>
    </div>
  );
}
