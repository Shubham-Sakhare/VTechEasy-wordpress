(function () {
  "use strict";

  var roots = document.querySelectorAll(".tea-chat-root");
  if (!roots.length) return;

  roots.forEach(function (root, rootIndex) {
    var configUrl = root.dataset.configUrl;
    var leadsUrl = root.dataset.leadsUrl;
    var storageKey = "tea-chat-session:" + window.location.origin + ":" + rootIndex;
    var config = null;
    var messages = [];
    var path = [];
    var lead = { service: "", name: "", email: "", mobile: "", interest: "", message: "" };
    var leadStep = "";
    var typing = false;
    var opened = false;
    var nextId = 1;
    var replyTimer = null;

    root.innerHTML = [
      '<button class="tea-launcher" type="button" aria-label="Open chat assistant" aria-expanded="false">💬</button>',
      '<section class="tea-window" aria-label="Chat assistant" hidden>',
      '  <header class="tea-header"><div class="tea-brand"><img class="tea-avatar" alt="" hidden><div><strong class="tea-bot-name">Chat Assistant</strong><small>Here to help with your project</small></div></div>',
      '  <div class="tea-header-buttons"><button type="button" class="tea-restart" aria-label="Restart chat" title="Restart chat">↻</button><button type="button" class="tea-close" aria-label="Close chat">×</button></div></header>',
      '  <main class="tea-messages" role="log" aria-live="polite"></main>',
      '  <div class="tea-contact-links" aria-label="Contact links"></div>',
      '  <form class="tea-input-form"><input class="tea-text-input" type="text" maxlength="1000" autocomplete="off" aria-label="Message the assistant"><button class="tea-send" type="submit" aria-label="Send message">➤</button><button class="tea-skip" type="button" hidden>Skip</button></form>',
      '  <div class="tea-submit-area"></div>',
      '</section>',
    ].join("");

    var launcher = root.querySelector(".tea-launcher");
    var panel = root.querySelector(".tea-window");
    var messagesNode = root.querySelector(".tea-messages");
    var form = root.querySelector(".tea-input-form");
    var input = root.querySelector(".tea-text-input");
    var skipButton = root.querySelector(".tea-skip");
    var submitArea = root.querySelector(".tea-submit-area");

    function saveSession() {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ messages: messages, path: path, lead: lead, leadStep: leadStep }));
      } catch (error) {
        console.warn("Chat session could not be saved.", error);
      }
    }

    function addMessage(sender, text, feature) {
      messages.push({ id: nextId++, sender: sender, text: text, feature: feature || null });
      if (messages.length > 80) messages = messages.slice(-80);
      saveSession();
      render();
    }

    function botReply(text, feature) {
      window.clearTimeout(replyTimer);
      typing = true;
      render();
      replyTimer = window.setTimeout(function () {
        typing = false;
        addMessage("bot", text, feature);
      }, 600);
    }

    function faqById(id) {
      return config.faqs.find(function (faq) { return faq.id === id; });
    }

    function safeUrl(url) {
      if (typeof url !== "string" || !url.trim() || url.indexOf("//") === 0) return "";
      if (url.charAt(0) === "/" || url.charAt(0) === "#") return url;
      try {
        var parsed = new URL(url, window.location.origin);
        return ["https:", "http:", "mailto:", "tel:"].indexOf(parsed.protocol) !== -1 ? url : "";
      } catch (error) {
        return "";
      }
    }

    function relatedButtons(ids) {
      return (Array.isArray(ids) ? ids : []).map(function (id) {
        var faq = faqById(id);
        return faq ? { label: faq.question, action: "related", id: faq.id } : null;
      }).filter(Boolean);
    }

    function showFaq(faq, userText) {
      if (!faq) return;
      if (userText) addMessage("user", userText);
      path.push(faq.question);
      botReply(faq.answer, { type: "answer", buttons: relatedButtons(faq.related_ids) });
    }

    function showTopic(topic) {
      addMessage("user", topic.label);
      path.push(topic.label);
      lead.service = topic.label;
      if (topic.action === "contact") {
        startLead(topic.label);
        return;
      }
      if (topic.action === "answer") {
        showFaq(faqById(topic.answer_id));
        return;
      }
      var buttons = (topic.options || []).map(function (option) {
        return { label: option.label, action: option.action === "contact" ? "contact" : "option", option: option, topic: topic };
      });
      botReply(topic.intro || ("What would you like to know about " + topic.label + "?"), { type: "choices", buttons: buttons });
    }

    function showOption(topic, option, remaining) {
      if (option.action === "contact") {
        path.push(option.label);
        addMessage("user", option.label);
        startLead(topic.label);
        return;
      }
      addMessage("user", option.label);
      path.push(option.label);
      var buttons = relatedButtons(option.related_ids);
      (remaining || []).forEach(function (other) {
        buttons.push({ label: other.label, action: other.action === "contact" ? "contact" : "option", option: other, topic: topic });
      });
      buttons.push({ label: "← Back to services", action: "back" });
      botReply(option.answer, { type: "answer", buttons: buttons });
    }

    function matchFaq(text) {
      var query = text.toLowerCase();
      var best = null;
      var score = 0;
      config.faqs.forEach(function (faq) {
        var keywords = String(faq.keywords || "").split(",").map(function (item) { return item.trim().toLowerCase(); }).filter(Boolean);
        var matches = keywords.filter(function (keyword) { return query.indexOf(keyword) !== -1 || keyword.indexOf(query) !== -1; });
        if (matches.length > score) {
          score = matches.length;
          best = faq;
        }
      });
      return best;
    }

    function askLead(step) {
      leadStep = step;
      saveSession();
      if (step === "service") {
        botReply(config.lead_questions.service, { type: "lead-service", selected: lead.service });
      } else if (step === "interest") {
        botReply(config.lead_questions.interest, { type: "lead-interest" });
      } else if (step === "submit") {
        botReply("Your details are ready. Send your enquiry when you are ready.", { type: "lead-submit" });
      } else {
        botReply(config.lead_questions[step], { type: "lead-input", field: step });
      }
    }

    function startLead(service) {
      lead = { service: service || "", name: "", email: "", mobile: "", interest: "", message: "" };
      askLead("service");
    }

    function chooseService(service) {
      addMessage("user", service);
      lead.service = service;
      askLead("name");
    }

    function chooseInterest(interest) {
      addMessage("user", interest);
      lead.interest = interest;
      askLead("message");
    }

    function isValidMobile(value) {
      var compact = value.replace(/[\s().-]/g, "");
      return /^(?:\+91)?[6-9][0-9]{9}$/.test(compact);
    }

    function submitText(value) {
      var text = value.trim();
      if (!text || typing) return;
      addMessage("user", text);
      if (leadStep === "name") {
        lead.name = text.slice(0, 190);
        askLead("email");
      } else if (leadStep === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
          botReply("Please enter a valid email address.", { type: "lead-input", field: "email" });
          return;
        }
        lead.email = text.slice(0, 190);
        askLead("mobile");
      } else if (leadStep === "mobile") {
        if (!isValidMobile(text)) {
          botReply("Please enter a valid 10-digit mobile number, optionally with +91.", { type: "lead-input", field: "mobile" });
          return;
        }
        lead.mobile = text.replace(/[\s().-]/g, "");
        askLead("interest");
      } else if (leadStep === "message") {
        lead.message = text.slice(0, 5000);
        askLead("submit");
      } else {
        var faq = matchFaq(text);
        if (faq) {
          path.push(text);
          botReply(faq.answer, { type: "answer", buttons: relatedButtons(faq.related_ids) });
        } else {
          botReply(config.fallback);
          window.setTimeout(function () { startLead(lead.service); }, 650);
        }
      }
    }

    function sendLead() {
      if (!lead.service || !lead.name || !lead.email || !lead.mobile || !lead.interest) return;
      submitArea.textContent = "Sending...";
      fetch(leadsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          service: lead.service,
          interest: lead.interest,
          message: lead.message,
          chat_path: path,
          website: "",
        }),
      }).then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.message || "Your enquiry could not be sent.");
          return data;
        });
      }).then(function (data) {
        leadStep = "";
        var message = "Thank you, " + lead.name + "! Your enquiry has been sent. Our team will contact you within 24 hours.";
        if (data.email_sent === false || data.webhook_sent === false) message += " A notification could not be delivered, so please also contact us using the links below.";
        botReply(message);
      }).catch(function (error) {
        botReply(error.message || "Your enquiry could not be sent. Please try again.");
      }).finally(function () {
        render();
      });
    }

    function runButton(button, message) {
      if (typing) return;
      if (message && message.feature) {
        message.feature = null;
        saveSession();
      }
      if (button.action === "topic") {
        var topic = config.quick_questions.find(function (item) { return item.id === button.id; });
        if (topic) showTopic(topic);
      } else if (button.action === "option") {
        var siblingOptions = button.topic.options.filter(function (item) { return item.id !== button.option.id; });
        showOption(button.topic, button.option, siblingOptions);
      } else if (button.action === "related") {
        showFaq(faqById(button.id), button.label);
      } else if (button.action === "back") {
        addMessage("user", "Back to services");
        botReply("What would you like help with?", { type: "topics" });
      } else if (button.action === "contact") {
        addMessage("user", button.label);
        startLead(button.topic ? button.topic.label : lead.service);
      } else if (button.action === "help-yes") {
        addMessage("user", "Yes");
        botReply("Great, glad I could help! 😊 Want a free quote?", { type: "quote" });
      } else if (button.action === "help-no") {
        addMessage("user", "No");
        addMessage("bot", "Sorry I couldn't fully help. Please share your details and our team will contact you shortly.");
        startLead(lead.service);
      } else if (button.action === "quote") {
        addMessage("user", "Get a Free Quote");
        startLead(lead.service);
      } else if (button.action === "no-thanks") {
        addMessage("user", "No, thanks");
        botReply("No problem. You can reach us through the contact links below.");
      } else if (button.action === "lead-service") {
        chooseService(button.value);
      } else if (button.action === "lead-interest") {
        chooseInterest(button.value);
      } else if (button.action === "submit") {
        sendLead();
      }
    }

    function createButton(label, action, message, value, extra) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tea-chip";
      button.textContent = label;
      button.addEventListener("click", function () {
        runButton(Object.assign({ label: label, action: action, value: value }, extra || {}), message);
      });
      return button;
    }

    function appendButtons(container, buttons, message) {
      if (!buttons || !buttons.length) return;
      var group = document.createElement("div");
      group.className = "tea-chips";
      buttons.forEach(function (button) {
        group.appendChild(createButton(button.label, button.action, message, button.value, button));
      });
      container.appendChild(group);
    }

    function renderFeature(container, message) {
      var feature = message.feature;
      if (!feature) return;
      if (feature.type === "topics") {
        appendButtons(container, config.quick_questions.map(function (item) {
          return { label: item.label, action: "topic", id: item.id };
        }), message);
      } else if (feature.type === "choices" || feature.type === "answer") {
        appendButtons(container, feature.buttons, message);
        if (feature.type === "answer") {
          appendButtons(container, [
            { label: "Yes", action: "help-yes" },
            { label: "No", action: "help-no" },
          ], message);
          var helpful = document.createElement("p");
          helpful.className = "tea-helpful-label";
          helpful.textContent = "Was this helpful?";
          container.appendChild(helpful);
        }
      } else if (feature.type === "quote") {
        appendButtons(container, [
          { label: "Get a Free Quote", action: "quote" },
          { label: "No, thanks", action: "no-thanks" },
        ], message);
      } else if (feature.type === "lead-service") {
        var services = config.quick_questions.filter(function (item) { return item.action !== "contact"; }).map(function (item) {
          return { label: item.label + (item.label === feature.selected ? " (selected)" : ""), action: "lead-service", value: item.label };
        });
        services.push({ label: "Other", action: "lead-service", value: "Other" });
        appendButtons(container, services, message);
      } else if (feature.type === "lead-interest") {
        appendButtons(container, ["Price", "Services", "Timeline", "Support", "Other"].map(function (value) {
          return { label: value, action: "lead-interest", value: value };
        }), message);
      } else if (feature.type === "fallback") {
        var contact = document.createElement("button");
        contact.type = "button";
        contact.className = "tea-chip";
        contact.textContent = "Share my details";
        contact.addEventListener("click", function () { startLead(lead.service); });
        container.appendChild(contact);
      } else if (feature.type === "lead-submit") {
        var send = createButton("Send Enquiry", "submit", message);
        send.classList.add("tea-primary-chip");
        container.appendChild(send);
      }
    }

    function renderMessages() {
      messagesNode.textContent = "";
      messages.forEach(function (message) {
        var row = document.createElement("div");
        row.className = "tea-message-row " + (message.sender === "user" ? "is-user" : "is-bot");
        var bubble = document.createElement("div");
        bubble.className = "tea-bubble";
        var text = document.createElement("p");
        text.textContent = message.text;
        bubble.appendChild(text);
        renderFeature(bubble, message);
        row.appendChild(bubble);
        messagesNode.appendChild(row);
      });
      if (typing) {
        var indicator = document.createElement("div");
        indicator.className = "tea-typing";
        indicator.setAttribute("role", "status");
        indicator.textContent = "Typing...";
        messagesNode.appendChild(indicator);
      }
      messagesNode.scrollTop = messagesNode.scrollHeight;
    }

    function renderContactLinks() {
      var links = root.querySelector(".tea-contact-links");
      links.textContent = "";
      (config.actions || []).forEach(function (action) {
        var url = safeUrl(action.url);
        if (!url || !action.label) return;
        var anchor = document.createElement("a");
        anchor.className = "tea-contact-link";
        anchor.href = url;
        anchor.setAttribute("aria-label", action.label);
        anchor.title = action.label;
        if (/^https?:/i.test(url)) {
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
        }
        var iconUrl = safeUrl(action.icon_url);
        if (iconUrl) {
          var image = document.createElement("img");
          image.src = iconUrl;
          image.alt = "";
          anchor.appendChild(image);
        } else {
          anchor.textContent = action.icon === "whatsapp" ? "☏" : action.icon === "instagram" ? "◎" : action.icon === "contact" ? "✉" : "↗";
        }
        var label = document.createElement("span");
        label.textContent = action.label;
        anchor.appendChild(label);
        links.appendChild(anchor);
      });
    }

    function render() {
      if (!config) return;
      root.style.setProperty("--tea-primary", config.primary_color || "#2563eb");
      root.classList.toggle("tea-position-left", config.position === "left");
      root.querySelector(".tea-bot-name").textContent = config.bot_name || "Chat Assistant";
      var avatar = root.querySelector(".tea-avatar");
      if (config.avatar) {
        avatar.src = safeUrl(config.avatar);
        avatar.hidden = !avatar.src;
      }
      launcher.setAttribute("aria-expanded", opened ? "true" : "false");
      panel.hidden = !opened;
      renderMessages();
      renderContactLinks();
      input.placeholder = leadStep === "name" ? "Your name..." :
        leadStep === "email" ? "Your email..." :
        leadStep === "mobile" ? "Your mobile number..." :
        leadStep === "message" ? "Message (optional)..." : "Ask about our services...";
      input.disabled = typing || leadStep === "service" || leadStep === "interest" || leadStep === "submit";
      input.setAttribute("aria-label", input.placeholder);
      skipButton.hidden = leadStep !== "message";
      submitArea.textContent = "";
      if (leadStep === "submit") {
        var submit = document.createElement("button");
        submit.type = "button";
        submit.className = "tea-submit";
        submit.textContent = "Send Enquiry";
        submit.disabled = typing;
        submit.addEventListener("click", sendLead);
        submitArea.appendChild(submit);
      }
    }

    launcher.addEventListener("click", function () {
      opened = !opened;
      render();
      if (opened) input.focus();
    });
    root.querySelector(".tea-close").addEventListener("click", function () {
      opened = false;
      render();
    });
    root.querySelector(".tea-restart").addEventListener("click", function () {
      window.clearTimeout(replyTimer);
      messages = [{ id: nextId++, sender: "bot", text: config.welcome, feature: { type: "topics" } }];
      path = [];
      lead = { service: "", name: "", email: "", mobile: "", interest: "", message: "" };
      leadStep = "";
      typing = false;
      saveSession();
      render();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value;
      input.value = "";
      submitText(value);
    });
    skipButton.addEventListener("click", function () {
      if (leadStep !== "message") return;
      addMessage("user", "Skip");
      lead.message = "";
      askLead("submit");
    });

    fetch(configUrl, { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("Chat settings could not be loaded.");
        return response.json();
      })
      .then(function (data) {
        config = data;
        try {
          var saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
          if (saved && Array.isArray(saved.messages)) {
            messages = saved.messages;
            path = Array.isArray(saved.path) ? saved.path : [];
            lead = saved.lead || lead;
            leadStep = saved.leadStep || "";
            nextId = messages.reduce(function (max, message) { return Math.max(max, message.id || 0); }, 0) + 1;
          }
        } catch (error) {
          console.warn("Saved chat session could not be restored.", error);
        }
        if (!messages.length) messages = [{ id: nextId++, sender: "bot", text: config.welcome, feature: { type: "topics" } }];
        render();
      })
      .catch(function (error) {
        config = {
          bot_name: "Tech Easy Assistant",
          welcome: "Chat is temporarily unavailable. Please try again shortly.",
          quick_questions: [],
          faqs: [],
          actions: [],
          primary_color: "#2563eb",
          position: "right",
          lead_questions: {},
          fallback: "I'm not sure about that. Please contact our team.",
        };
        messages = [{ id: nextId++, sender: "bot", text: error.message, feature: null }];
        render();
      });
  });
})();
