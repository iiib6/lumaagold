/* =============================================================
   شركة اللمعة الذهبية — سكربت الصفحة الواحدة
   اللغة · القائمة · الظهور بالتمرير · شريط الصور · تكبير الصور
   ============================================================= */
(function () {
  "use strict";

  var KEY = "lumaa_lang";

  /* ------------------------------- اللغة --------------------------------- */
  function setLang(lang) {
    var el = document.documentElement;
    el.setAttribute("lang", lang);
    el.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    document.querySelectorAll("[data-ar]").forEach(function (n) {
      var v = n.getAttribute("data-" + lang);
      if (v !== null) n.textContent = v;
    });
    document.querySelectorAll("[data-ar-aria]").forEach(function (n) {
      var v = n.getAttribute("data-" + lang + "-aria");
      if (v !== null) n.setAttribute("aria-label", v);
    });

    var t = document.body.getAttribute("data-title-" + lang);
    if (t) document.title = t;

    var d = document.body.getAttribute("data-desc-" + lang);
    var meta = document.querySelector('meta[name="description"]');
    if (d && meta) meta.setAttribute("content", d);

    document.querySelectorAll(".lang").forEach(function (b) {
      b.textContent = lang === "ar" ? "EN" : "ع";
    });

    try { localStorage.setItem(KEY, lang); } catch (e) {}
    window.LANG = lang;
  }

  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    setLang(saved === "en" ? "en" : "ar");
    document.querySelectorAll(".lang").forEach(function (b) {
      b.addEventListener("click", function () { setLang(window.LANG === "ar" ? "en" : "ar"); });
    });
  }

  /* ----------------------------- القائمة والجزيرة ------------------------- */
  function initNav() {
    var burger = document.querySelector(".burger");
    var sheet = document.querySelector(".sheet");
    var island = document.querySelector(".island");

    if (burger && sheet) {
      var toggle = function (open) {
        burger.classList.toggle("on", open);
        sheet.classList.toggle("on", open);
        burger.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      };
      burger.addEventListener("click", function () { toggle(!sheet.classList.contains("on")); });
      sheet.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { toggle(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sheet.classList.contains("on")) toggle(false);
      });
    }

    if (island) {
      var onScroll = function () { island.classList.toggle("stuck", window.scrollY > 40); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ------------------------- تعليم القسم الحالي بالقائمة ------------------- */
  function initSpy() {
    var links = [].slice.call(document.querySelectorAll('.menu a[href^="#"]'));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var el = document.querySelector(a.getAttribute("href"));
      if (el) { map[el.id] = a; targets.push(el); }
    });

    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("on"); });
        if (map[r.target.id]) map[r.target.id].classList.add("on");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    targets.forEach(function (t) { io.observe(t); });
  }

  /* --------------------------- بديل الصور الناقصة -------------------------- */
  var MARK = '<img src="assets/logo/mark-mono-light.svg" alt="" aria-hidden="true">';

  function guard(img) {
    var swap = function () {
      if (img.dataset.done) return;
      img.dataset.done = "1";
      var file = (img.getAttribute("src") || "").split("/").pop();
      var box = document.createElement("div");
      box.className = "ph";
      box.innerHTML = MARK +
        '<b data-ar="بانتظار الصورة" data-en="Image pending">' +
        (window.LANG === "en" ? "Image pending" : "بانتظار الصورة") +
        "</b><small>" + file + "</small>";
      if (img.parentNode) img.parentNode.replaceChild(box, img);
    };
    img.addEventListener("error", swap);
    if (img.complete && img.naturalWidth === 0) swap();
  }

  function initImages(scope) {
    (scope || document).querySelectorAll("img[data-guard]").forEach(guard);
  }

  /* ----------------------------- الظهور بالتمرير --------------------------- */
  function initRise(scope) {
    var els = (scope || document).querySelectorAll(".rise:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (r.isIntersecting) { r.target.classList.add("in"); io.unobserve(r.target); }
      });
    }, { threshold: .1, rootMargin: "0px 0px -60px 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ------------------------------ شريط الصور ------------------------------- */
  var CATS = {
    shop:        { ar: "🏬 صور المحل والواجهة", en: "Showroom & Exterior" },
    merchandise: { ar: "✨ البضاعة والمصوغات", en: "Merchandise & Jewelry" },
    jewelry:     { ar: "✨ البضاعة والمصوغات", en: "Merchandise & Jewelry" },
    gold:        { ar: "✨ البضاعة والمصوغات", en: "Merchandise & Jewelry" },
    company:     { ar: "🏬 صور المحل والواجهة", en: "Showroom & Exterior" }
  };
  function cat(c, l) { return (CATS[c] && CATS[c][l]) || c; }

  var G = { items: [], i: 0 };

  /* ملاحظة: بدون loading="lazy" هنا عن قصد — الصور داخل شريط متحرك تدخل وتطلع
     من الشاشة باستمرار، فالتحميل الكسول يخلي المتصفح يفك تشفيرها كل دورة ويتقطّع الشريط. */
  function cell(x) {
    return '<figure class="shot" data-i="' + x._i + '" tabindex="0" role="button">' +
      '<img src="' + x.src + '" alt="' + x.ar + '" decoding="async" data-guard>' +
      '<figcaption data-ar="' + x.ar + '" data-en="' + x.en + '">' + x.ar + "</figcaption>" +
      "</figure>";
  }

  /* ---------------------- 1. شبكة صور المحل (ثابتة) ---------------------- */
  function renderShopGrid(allItems) {
    var host = document.getElementById("shop-grid");
    if (!host) return;

    var shopItems = allItems.filter(function(x) {
      return (x.cat === "shop" || x.cat === "company");
    });

    if (!shopItems.length) shopItems = allItems;

    host.innerHTML = shopItems.map(function(item) {
      return '<figure class="shop-card ' + (item.tall ? 'tall' : '') + '" data-i="' + item._i + '" tabindex="0" role="button">' +
        '<img src="' + item.src + '" alt="' + item.ar + '" loading="lazy" data-guard>' +
        '<figcaption data-ar="' + item.ar + '" data-en="' + item.en + '">' + item.ar + '</figcaption>' +
        '</figure>';
    }).join("");

    host.querySelectorAll(".shop-card").forEach(function(f) {
      f.addEventListener("click", function() { open(+f.dataset.i); });
      f.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(+f.dataset.i); }
      });
    });

    initImages(host);
  }

  /* ------------------- 2. شريط صور البضاعة (شريط مفرد وقالب مرتب) ------------------ */
  function renderMerchandiseMarquee(allItems) {
    var host = document.querySelector("[data-marquee-merchandise]");
    if (!host) return;

    var merchandiseItems = allItems.filter(function(x) {
      return (x.cat === "merchandise" || x.cat === "jewelry" || x.cat === "gold");
    });

    if (!merchandiseItems.length) merchandiseItems = allItems;

    var cellsA = merchandiseItems.map(cell).join("");
    var repeatTimes = (merchandiseItems.length < 5) ? 6 : 4;
    var trackContent = "";
    for (var r = 0; r < repeatTimes; r++) {
      trackContent += cellsA;
    }

    // شريط واحد مفرد هادئ وأنظر للعين ومستمر دون انقطاع
    host.innerHTML =
      '<div class="mq" style="--dur:100s"><div class="mq__track">' + trackContent + "</div></div>";

    host.querySelectorAll(".shot").forEach(function (f) {
      f.addEventListener("click", function () { open(+f.dataset.i); });
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(+f.dataset.i); }
      });
    });

    initImages(host);
  }

  function initGallerySections() {
    var allItems = getGalleryItems();
    allItems.forEach(function(x, i) { x._i = i; });
    G.items = allItems;

    renderShopGrid(allItems);
    renderMerchandiseMarquee(allItems);
  }

  function fetchCloudData() {
    fetch('/api/data?t=' + Date.now())
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data) return;
        var updated = false;

        if (Array.isArray(data.items) && data.items.length > 0) {
          localStorage.setItem("lumaa_gallery_items", JSON.stringify(data.items));
          updated = true;
        }

        if (data.config && typeof data.config === "object") {
          localStorage.setItem("lumaa_site_config", JSON.stringify(data.config));
          applyDynamicConfig();
        }

        if (updated) {
          initGallerySections();
        }
      })
      .catch(function(err) {
        console.log("API fetch note:", err);
      });
  }

  function getGalleryItems() {
    try {
      var saved = localStorage.getItem("lumaa_gallery_items");
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return (window.GALLERY_ITEMS || []).slice();
  }

  function applyDynamicConfig() {
    try {
      var saved = localStorage.getItem("lumaa_site_config");
      if (!saved) return;
      var cfg = JSON.parse(saved);

      if (cfg.phone) {
        document.querySelectorAll("[data-cfg='phone']").forEach(function(el) {
          el.textContent = cfg.phone;
        });
        document.querySelectorAll("a[href^='tel:']").forEach(function(el) {
          el.href = "tel:" + cfg.phone.replace(/\s+/g, '');
        });
      }

      if (cfg.whatsapp) {
        document.querySelectorAll("[data-cfg='whatsapp']").forEach(function(el) {
          el.textContent = cfg.whatsapp;
        });
        document.querySelectorAll("a[href*='wa.me']").forEach(function(el) {
          var clean = cfg.whatsapp.replace(/[^\d]/g, '');
          el.href = "https://wa.me/" + clean;
        });
      }

      if (cfg.email) {
        document.querySelectorAll("[data-cfg='email']").forEach(function(el) {
          el.textContent = cfg.email;
        });
        document.querySelectorAll("a[href^='mailto:']").forEach(function(el) {
          el.href = "mailto:" + cfg.email;
        });
      }

      if (cfg.instagram) {
        document.querySelectorAll("[data-cfg='instagram']").forEach(function(el) {
          el.textContent = cfg.instagram;
        });
        document.querySelectorAll("a[href*='instagram.com']").forEach(function(el) {
          var handle = cfg.instagram.replace('@', '');
          el.href = "https://instagram.com/" + handle;
        });
      }

      if (cfg.address_ar) {
        document.querySelectorAll("[data-cfg='address_ar']").forEach(function(el) {
          el.setAttribute("data-ar", cfg.address_ar);
          if (window.LANG === "ar") el.textContent = cfg.address_ar;
        });
      }

      if (cfg.hero_slogan_ar) {
        document.querySelectorAll("[data-cfg='hero_slogan']").forEach(function(el) {
          el.setAttribute("data-ar", cfg.hero_slogan_ar);
          if (window.LANG === "ar") el.textContent = cfg.hero_slogan_ar;
        });
      }

      if (cfg.hero_image) {
        var heroImg = document.querySelector(".hero__shot img");
        if (heroImg) heroImg.src = cfg.hero_image;
      }
    } catch (e) {}
  }

  function initMarquee() {
    var host = document.querySelector("[data-marquee]");
    if (!host) return;

    var items = getGalleryItems();
    items.forEach(function (x, i) { x._i = i; });
    G.items = items;

    // صفّان بسرعتين واتجاهين مختلفين حتى ما يبين التكرار
    var a = items;
    var b = items.slice().reverse();
    var cellsA = a.map(cell).join("");
    var cellsB = b.map(cell).join("");

    host.innerHTML =
      '<div class="mq" style="--dur:74s"><div class="mq__track">' + cellsA + cellsA + "</div></div>" +
      '<div class="mq mq--rev" style="--dur:92s"><div class="mq__track">' + cellsB + cellsB + "</div></div>";

    host.querySelectorAll(".shot").forEach(function (f) {
      f.addEventListener("click", function () { open(+f.dataset.i); });
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(+f.dataset.i); }
      });
    });

    initImages(host);
    setLang(window.LANG || "ar");
  }

  /* ------------------------------- التكبير --------------------------------- */
  function box() {
    var el = document.querySelector(".lb");
    if (el) return el;

    el = document.createElement("div");
    el.className = "lb";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<button class="lb__x" data-a="x" data-ar-aria="إغلاق" data-en-aria="Close" aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button class="lb__p" data-a="p" data-ar-aria="السابق" data-en-aria="Previous" aria-label="السابق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<button class="lb__n" data-a="n" data-ar-aria="التالي" data-en-aria="Next" aria-label="التالي"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
      '<img alt=""><div class="lb__cap"></div>';
    document.body.appendChild(el);

    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]");
      if (b) {
        var a = b.getAttribute("data-a");
        if (a === "x") close();
        if (a === "p") step(-1);
        if (a === "n") step(1);
        return;
      }
      if (e.target === el) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!el.classList.contains("on")) return;
      var rtl = document.documentElement.dir === "rtl";
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
    });
    return el;
  }

  function open(i) {
    var el = box();
    G.i = i;
    paint();
    el.classList.add("on");
    document.body.style.overflow = "hidden";
  }

  function close() {
    var el = document.querySelector(".lb");
    if (el) el.classList.remove("on");
    document.body.style.overflow = "";
  }

  function step(d) {
    G.i = (G.i + d + G.items.length) % G.items.length;
    paint();
  }

  function paint() {
    var x = G.items[G.i];
    if (!x) return;
    var el = document.querySelector(".lb");
    var l = window.LANG || "ar";
    el.querySelector("img").src = x.src;
    el.querySelector("img").alt = x[l] || x.ar;
    el.querySelector(".lb__cap").textContent = (x[l] || x.ar) + " · " + cat(x.cat, l);
  }

  /* -------------------------------- تشغيل ---------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyDynamicConfig();
    initLang();
    initNav();
    initGallerySections();
    initImages();
    initRise();
    initSpy();
    fetchCloudData();
  });
})();
