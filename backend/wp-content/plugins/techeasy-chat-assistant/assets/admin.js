(function () {
  "use strict";

  function cloneTemplate(id, replacements) {
    var template = document.getElementById("tea-template-" + id);
    if (!template) return null;
    var fragment = template.content.cloneNode(true);
    var walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var attributes = node.nodeType === Node.ELEMENT_NODE ? Array.from(node.attributes) : [];
      attributes.forEach(function (attribute) {
        var value = attribute.value;
        Object.keys(replacements).forEach(function (key) {
          value = value.split(key).join(String(replacements[key]));
        });
        node.setAttribute(attribute.name, value);
      });
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.nodeValue;
        Object.keys(replacements).forEach(function (key) {
          text = text.split(key).join(String(replacements[key]));
        });
        node.nodeValue = text;
      }
    }
    return fragment;
  }

  function rows(container, selector) {
    return Array.from(container.querySelectorAll(":scope > " + selector));
  }

  function reindexQuickList(list) {
    rows(list, ".tea-quick").forEach(function (row, index) {
      row.querySelectorAll("[name]").forEach(function (field) {
        field.name = field.name.replace(/settings\[quick_questions\]\[\d+\]/, "settings[quick_questions][" + index + "]");
      });
      var options = row.querySelector(".tea-options");
      if (options) {
        rows(options, ".tea-option").forEach(function (option, optionIndex) {
          option.querySelectorAll("[name]").forEach(function (field) {
            field.name = field.name.replace(/(\[options\])\[\d+\]/, "$1[" + optionIndex + "]");
          });
        });
      }
      var addOption = row.querySelector(".tea-add-option");
      if (addOption) addOption.dataset.parent = String(index);
    });
  }

  function reindexList(list) {
    if (list.dataset.list === "quick_questions") {
      reindexQuickList(list);
      return;
    }
    var selector = list.dataset.list === "faqs" ? ".tea-item" : ".tea-action";
    rows(list, selector).forEach(function (row, index) {
      row.querySelectorAll("[name]").forEach(function (field) {
        var group = list.dataset.list;
        field.name = field.name.replace(new RegExp("settings\\[" + group + "\\]\\[\\d+\\]"), "settings[" + group + "][" + index + "]");
      });
    });
  }

  function addItem(kind) {
    var listName = kind === "quick" ? "quick_questions" : kind === "faq" ? "faqs" : "actions";
    var list = document.querySelector('[data-list="' + listName + '"]');
    if (!list) return;
    var index = rows(list, kind === "quick" ? ".tea-quick" : kind === "faq" ? ".tea-item" : ".tea-action").length;
    var fragment = cloneTemplate(kind, { __INDEX__: index, __OPTION_INDEX__: 0 });
    if (!fragment) return;
    list.appendChild(fragment);
    reindexList(list);
    syncControls(list);
  }

  function syncControls(scope) {
    scope.querySelectorAll(".tea-quick > .tea-grid select[name$='[action]']").forEach(function (select) {
      var row = select.closest(".tea-quick");
      if (!row) return;
      row.querySelectorAll("[data-action-fields]").forEach(function (fields) {
        fields.hidden = fields.dataset.actionFields !== select.value;
      });
    });
    scope.querySelectorAll(".tea-option select[name$='[action]']").forEach(function (select) {
      var answer = select.closest(".tea-option").querySelector("[data-option-answer]");
      if (answer) answer.hidden = select.value === "contact";
    });
  }

  document.addEventListener("click", function (event) {
    var add = event.target.closest("[data-add]");
    if (add) {
      event.preventDefault();
      addItem(add.dataset.add);
      return;
    }
    var addOption = event.target.closest(".tea-add-option");
    if (addOption) {
      event.preventDefault();
      var quick = addOption.closest(".tea-quick");
      var optionList = quick && quick.querySelector(".tea-options");
      if (!optionList) return;
      var parentIndex = rows(quick.parentElement, ".tea-quick").indexOf(quick);
      var optionIndex = rows(optionList, ".tea-option").length;
      var fragment = cloneTemplate("option", { __INDEX__: parentIndex, __OPTION_INDEX__: optionIndex });
      if (fragment) {
        optionList.appendChild(fragment);
        reindexQuickList(quick.parentElement);
        syncControls(quick);
      }
      return;
    }
    var remove = event.target.closest(".tea-remove");
    if (remove) {
      event.preventDefault();
      var option = remove.closest(".tea-option");
      var item = option || remove.closest(".tea-item, .tea-action");
      var list = item && item.parentElement;
      if (item) item.remove();
      if (list) {
        if (list.matches(".tea-options")) reindexQuickList(list.closest(".tea-quick").parentElement);
        else reindexList(list);
      }
      return;
    }
    var mediaButton = event.target.closest(".tea-media-pick");
    if (mediaButton && window.wp && wp.media) {
      event.preventDefault();
      var input = mediaButton.parentElement.querySelector(".tea-media-url");
      var frame = wp.media({ title: "Choose image", multiple: false, library: { type: "image" } });
      frame.on("select", function () {
        var selected = frame.state().get("selection").first();
        if (selected && input) input.value = selected.toJSON().url;
      });
      frame.open();
    }
  });

  document.addEventListener("change", function (event) {
    if (event.target.matches(".tea-quick select[name$='[action]'], .tea-option select[name$='[action]']")) {
      syncControls(event.target.closest(".tea-item, .tea-quick"));
    }
  });

  var dragged = null;
  document.addEventListener("dragstart", function (event) {
    dragged = event.target.closest(".tea-item, .tea-option");
    if (dragged && event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "reorder");
      dragged.classList.add("is-dragging");
    }
  });
  document.addEventListener("dragover", function (event) {
    if (!dragged) return;
    var target = event.target.closest(".tea-item, .tea-option");
    if (!target || target === dragged || target.parentElement !== dragged.parentElement) return;
    event.preventDefault();
    var bounds = target.getBoundingClientRect();
    var after = event.clientY > bounds.top + bounds.height / 2;
    target.parentElement.insertBefore(dragged, after ? target.nextSibling : target);
  });
  document.addEventListener("dragend", function () {
    if (!dragged) return;
    dragged.classList.remove("is-dragging");
    var parent = dragged.parentElement;
    var quick = parent && parent.closest(".tea-quick");
    if (parent && parent.matches('[data-list="quick_questions"], [data-list="faqs"], [data-list="actions"]')) reindexList(parent);
    else if (quick) reindexQuickList(quick.parentElement);
    dragged = null;
  });

  document.querySelectorAll(".tea-chat-admin").forEach(syncControls);
})();
