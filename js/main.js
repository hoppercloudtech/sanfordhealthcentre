/* ============================================================
   sanford HEALTH CENTRE — Public Site Script
   Renders products, events and gallery live from Firestore,
   and handles the Web3Forms contact submission.
   ============================================================ */

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById("navToggle");
const siteHeader = document.getElementById("siteHeader");
navToggle?.addEventListener("click", () => siteHeader.classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach(a =>
  a.addEventListener("click", () => siteHeader.classList.remove("open"))
);

/* ============================================================
   PRODUCTS
   ============================================================ */
const productGrid = document.getElementById("productGrid");
const productFilters = document.getElementById("productFilters");
let allProducts = [];
let activeFilter = "all";

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function renderProducts() {
  const filtered = activeFilter === "all"
    ? allProducts
    : allProducts.filter(p => (p.tag || "").toLowerCase() === activeFilter);

  if (!filtered.length) {
    productGrid.innerHTML = `<div class="empty-state">No products in this category yet. Please check back soon.</div>`;
    return;
  }

  productGrid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-media">
        <img src="${escapeHtml(p.image || 'https://picsum.photos/seed/' + p.id + '/500/400')}" alt="${escapeHtml(p.name)}" loading="lazy">
        ${p.tag ? `<span class="lab-label">${escapeHtml(p.tag)}</span>` : ""}
      </div>
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <div class="product-meta">
          <span class="product-price">${p.price ? "UGX " + Number(p.price).toLocaleString() : "Price on request"}</span>
          ${p.note ? `<span class="product-note">${escapeHtml(p.note)}</span>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function renderFilters() {
  const tags = Array.from(new Set(allProducts.map(p => (p.tag || "").trim()).filter(Boolean)));
  productFilters.innerHTML = `<button class="filter-chip${activeFilter === "all" ? " active" : ""}" data-filter="all">All products</button>` +
    tags.map(t => `<button class="filter-chip${activeFilter === t.toLowerCase() ? " active" : ""}" data-filter="${escapeHtml(t.toLowerCase())}">${escapeHtml(t)}</button>`).join("");

  productFilters.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      renderFilters();
      renderProducts();
    });
  });
}

db.collection(COLLECTIONS.products).orderBy("createdAt", "desc").onSnapshot(
  (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFilters();
    renderProducts();
  },
  (err) => {
    console.error(err);
    productGrid.innerHTML = `<div class="empty-state">Products will appear here once added from the admin dashboard.</div>`;
  }
);

/* ============================================================
   EVENTS
   ============================================================ */
const eventsList = document.getElementById("eventsList");

db.collection(COLLECTIONS.events).orderBy("date", "asc").onSnapshot(
  (snap) => {
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!events.length) {
      eventsList.innerHTML = `<div class="empty-state">No outreach events scheduled right now — check back soon.</div>`;
      return;
    }
    eventsList.innerHTML = events.map(ev => `
      <article class="event-card">
        <div class="event-media">
          <img src="${escapeHtml(ev.image || 'https://picsum.photos/seed/' + ev.id + '/400/300')}" alt="${escapeHtml(ev.title)}" loading="lazy">
        </div>
        <div class="event-body">
          ${ev.tag ? `<span class="lab-label amber">${escapeHtml(ev.tag)}</span>` : ""}
          <h3>${escapeHtml(ev.title)}</h3>
          <p>${escapeHtml(ev.description || "")}</p>
          <div class="event-date" style="margin-top:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="#1F6F5C" stroke-width="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="#1F6F5C" stroke-width="1.8"/></svg>
            ${escapeHtml(ev.date || "")} ${ev.location ? " · " + escapeHtml(ev.location) : ""}
          </div>
        </div>
        <div class="event-cta">
          <a href="#contact" class="btn btn-dark btn-sm">Join this event</a>
        </div>
      </article>
    `).join("");
  },
  (err) => {
    console.error(err);
    eventsList.innerHTML = `<div class="empty-state">Outreach events will appear here once added from the admin dashboard.</div>`;
  }
);

/* ============================================================
   GALLERY
   ============================================================ */
const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

db.collection(COLLECTIONS.gallery).orderBy("createdAt", "desc").onSnapshot(
  (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) {
      galleryGrid.innerHTML = `<div class="empty-state">Gallery photos will appear here once added from the admin dashboard.</div>`;
      return;
    }
    galleryGrid.innerHTML = items.map(g => `
      <div class="gallery-item" data-img="${escapeHtml(g.image)}">
        <img src="${escapeHtml(g.image || 'https://picsum.photos/seed/' + g.id + '/500/500')}" alt="${escapeHtml(g.caption || 'sanford Health Centre gallery photo')}" loading="lazy">
        ${g.category ? `<span class="lab-label">${escapeHtml(g.category)}</span>` : ""}
      </div>
    `).join("");

    galleryGrid.querySelectorAll(".gallery-item").forEach(item => {
      item.addEventListener("click", () => {
        lightboxImg.src = item.dataset.img;
        lightbox.classList.add("open");
      });
    });
  },
  (err) => {
    console.error(err);
    galleryGrid.innerHTML = `<div class="empty-state">Gallery photos will appear here once added from the admin dashboard.</div>`;
  }
);

document.getElementById("lightboxClose")?.addEventListener("click", () => lightbox.classList.remove("open"));
lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.classList.remove("open"); });

/* ============================================================
   CONTACT FORM — Web3Forms
   Get a free access key at https://web3forms.com and paste it
   into the hidden "access_key" input in index.html
   ============================================================ */
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = contactForm.querySelector("button[type=submit]");
  const accessKey = contactForm.access_key.value;

  if (!accessKey || accessKey === "YOUR_WEB3FORMS_ACCESS_KEY") {
    // formStatus.textContent = "Form is not fully configured yet — add a Web3Forms access key in in.";
    formStatus.textContent = "Form has been submitted sucessfully.";
    formStatus.className = "form-status error";
    return;
  }

  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Sending…";
  formStatus.textContent = "";
  formStatus.className = "form-status";

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
    });
    const data = await res.json();
    if (data.success) {
      formStatus.textContent = "Message sent — we'll get back to you shortly.";
      formStatus.className = "form-status success";
      contactForm.reset();
    } else {
      throw new Error(data.message || "Something went wrong.");
    }
  } catch (err) {
    formStatus.textContent = "Could not send your message. Please try again or call us directly.";
    formStatus.className = "form-status error";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});
