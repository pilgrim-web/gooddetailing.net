(() => {
  const state = {
    lang: localStorage.getItem("lang") || "en",
    site: null
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const setText = (sel, value) => {
    const el = qs(sel);
    if (el) el.textContent = value;
  };

  const setTextAll = (sel, value) => {
    qsa(sel).forEach((el) => {
      el.textContent = value;
    });
  };

  const setMeta = (id, content) => {
    const el = document.getElementById(id);
    if (el && content) el.setAttribute("content", content);
  };

  const setHtmlLang = (lang) => {
    document.documentElement.setAttribute("lang", lang);
  };

  const normalizeLines = (value) =>
    String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const getDictValue = (dict, path) =>
    path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), dict);

  const renderI18n = () => {
    const dict = (window.I18N && window.I18N[state.lang]) || window.I18N?.en || {};
    qsa("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = key ? getDictValue(dict, key) : "";
      if (value == null) return;
      el.textContent = value;
    });

    qsa("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      const value = key ? getDictValue(dict, key) : "";
      if (value == null) return;
      el.setAttribute("aria-label", value);
    });
  };

  const renderContent = () => {
    if (!state.site) return;
    const data = state.site;
    const lang = state.lang;

    setTextAll("[data-field='businessName']", data.businessName);
    setText("[data-field='heroHeadline']", data.heroHeadline?.[lang] || "");
    setText("[data-field='heroSubheadline']", data.heroSubheadline?.[lang] || "");
    setText("[data-field='aboutStory']", data.aboutStory?.[lang] || "");
    setText("[data-field='visionStatement']", data.visionStatement?.[lang] || "");

    const servicesWrap = qs("#services-grid");
    if (servicesWrap) {
      servicesWrap.innerHTML = "";
      (data.services || []).forEach((service) => {
        const card = document.createElement("article");
        card.className = "service-card reveal";

        const title = document.createElement("h3");
        title.textContent = service.title?.[lang] || "";

        const price = document.createElement("div");
        price.className = "service-price";
        price.textContent = service.price || "";

        const list = document.createElement("ul");
        normalizeLines(service.bullets?.[lang]).forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        });

        card.append(title, price, list);
        servicesWrap.appendChild(card);
      });
    }

    setText("[data-field='contactCeo']", data.contact?.ceo || "");
    setTextAll("[data-field='contactPhone']", data.contact?.phone || "");

    const addressWraps = qsa("[data-field='addressLines']");
    addressWraps.forEach((addressWrap) => {
      addressWrap.innerHTML = "";
      (data.contact?.addressLines || []).forEach((item) => {
        const line = typeof item === "string" ? item : item?.line;
        if (!line) return;
        const p = document.createElement("p");
        p.textContent = line;
        addressWrap.appendChild(p);
      });
    });

    const stripeLink = qs("#stripe-link");
    if (stripeLink) {
      stripeLink.href = data.stripePaymentLink || "#";
    }

    if (data.seo) {
      document.title = data.seo.title || document.title;
      setMeta("meta-description", data.seo.description);
      setMeta("og-title", data.seo.title);
      setMeta("og-description", data.seo.description);
      setMeta("twitter-title", data.seo.title);
      setMeta("twitter-description", data.seo.description);
    }

    const ld = qs("#jsonld");
    if (ld) {
      const addressLines = (data.contact?.addressLines || []).map((item) =>
        typeof item === "string" ? item : item?.line
      );
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: data.businessName,
        telephone: data.contact?.phone || "",
        address: {
          "@type": "PostalAddress",
          streetAddress: addressLines[0] || "",
          addressLocality: addressLines[1] || ""
        }
      };
      ld.textContent = JSON.stringify(jsonLd);
    }

    renderI18n();
    setHtmlLang(lang);
    refreshReveal();
  };

  const refreshReveal = () => {
    const items = qsa(".reveal");
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((item) => observer.observe(item));
  };

  const updateActiveNav = () => {
    const links = qsa(".nav-link");
    const sections = qsa("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            links.forEach((link) => {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${id}`
              );
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const initLangMenu = () => {
    const trigger = qs("#lang-trigger");
    const menu = qs("#lang-menu");
    if (!trigger || !menu) return;

    const setExpanded = (value) => {
      trigger.setAttribute("aria-expanded", value ? "true" : "false");
      menu.classList.toggle("open", value);
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = menu.classList.contains("open");
      setExpanded(!isOpen);
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target) && !trigger.contains(event.target)) {
        setExpanded(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setExpanded(false);
    });

    qsa("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextLang = btn.getAttribute("data-lang");
        if (!nextLang) return;
        state.lang = nextLang;
        localStorage.setItem("lang", nextLang);
        setExpanded(false);
        renderContent();
      });
    });
  };

  const initSmoothScroll = () => {
    qsa("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href.length < 2) return;
        const target = qs(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const init = async () => {
    try {
      const res = await fetch("content/site.json", { cache: "no-store" });
      state.site = await res.json();
      renderContent();
    } catch (err) {
      console.error("Failed to load content", err);
    }

    initLangMenu();
    initSmoothScroll();
    updateActiveNav();
    const yearEl = qs("#footer-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  document.addEventListener("DOMContentLoaded", init);
})();

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".modal.active").forEach((modal) => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  });
});
