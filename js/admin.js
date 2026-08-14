/* ============================================================
   Sanford HEALTH CENTRE — Admin Dashboard Script
   Auth guard + CRUD for products, events and gallery collections.
   ============================================================ */

const loginScreen = document.getElementById("loginScreen");
const adminShell = document.getElementById("adminShell");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const adminUserEmail = document.getElementById("adminUserEmail");

/* ---------- Auth ---------- */
auth.onAuthStateChanged((user) => {
  if (user) {
    loginScreen.style.display = "none";
    adminShell.style.display = "grid";
    adminUserEmail.textContent = user.email;
  } else {
    loginScreen.style.display = "grid";
    adminShell.style.display = "none";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("li-email").value.trim();
  const pass = document.getElementById("li-pass").value;
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    loginError.textContent = "Incorrect email or password.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut());

/* ---------- Toast ---------- */
const toastEl = document.getElementById("toast");
let toastTimer;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.className = "toast show" + (isError ? " error" : "");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

/* ---------- Panel switching ---------- */
const panelTitles = {
  products: ["Products", 'Everything shown in the "Shop" section of the website.'],
  events: ["Outreach events", "Everything shown in the outreach section of the website."],
  gallery: ["Gallery", "Photos shown in the gallery section of the website."]
};
document.getElementById("adminNav").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-panel]");
  if (!btn) return;
  document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const panel = btn.dataset.panel;
  document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-" + panel).classList.add("active");
  document.getElementById("panelTitle").textContent = panelTitles[panel][0];
  document.getElementById("panelSub").textContent = panelTitles[panel][1];
});

/* ---------- Generic modal + image field helpers ---------- */
function wireImageField(prefix) {
  const fileInput = document.getElementById(`${prefix}-image-file`);
  const linkInput = document.getElementById(`${prefix}-image-link`);
  const preview = document.getElementById(`${prefix}-image-preview`);
  const uploadBtn = document.getElementById(`${prefix}-upload-btn`);

  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.classList.add("show");
    linkInput.value = "";
  });
  linkInput.addEventListener("input", () => {
    if (linkInput.value.trim()) {
      preview.src = linkInput.value.trim();
      preview.classList.add("show");
      fileInput.value = "";
    }
  });
}
wireImageField("p");
wireImageField("e");
wireImageField("g");

function resetImageField(prefix, existingUrl = "") {
  document.getElementById(`${prefix}-image-file`).value = "";
  document.getElementById(`${prefix}-image-link`).value = existingUrl || "";
  const preview = document.getElementById(`${prefix}-image-preview`);
  if (existingUrl) { preview.src = existingUrl; preview.classList.add("show"); }
  else { preview.src = ""; preview.classList.remove("show"); }
  document.getElementById(`${prefix}-upload-progress`).textContent = "";
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

/* ============================================================
   PRODUCTS CRUD
   ============================================================ */
const productModal = "productModal";
const productForm = document.getElementById("productForm");
const productsTableBody = document.getElementById("productsTableBody");
let editingProductId = null;

document.getElementById("addProductBtn").addEventListener("click", () => {
  editingProductId = null;
  document.getElementById("productModalTitle").textContent = "Add product";
  productForm.reset();
  resetImageField("p");
  openModal(productModal);
});
document.getElementById("p-cancel").addEventListener("click", () => closeModal(productModal));

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = productForm.querySelector("button[type=submit]");
  saveBtn.disabled = true;
  try {
    const image = await resolveImageUrl({
      linkInput: document.getElementById("p-image-link"),
      fileInput: document.getElementById("p-image-file"),
      progressEl: document.getElementById("p-upload-progress")
    }, document.getElementById("p-image-preview").dataset.existing || "");

    const data = {
      name: document.getElementById("p-name").value.trim(),
      description: document.getElementById("p-description").value.trim(),
      price: Number(document.getElementById("p-price").value) || 0,
      tag: document.getElementById("p-tag").value.trim(),
      note: document.getElementById("p-note").value.trim(),
      image
    };

    if (editingProductId) {
      await db.collection(COLLECTIONS.products).doc(editingProductId).update(data);
      showToast("Product updated.");
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTIONS.products).add(data);
      showToast("Product added.");
    }
    closeModal(productModal);
  } catch (err) {
    showToast(err.message || "Could not save product.", true);
  } finally {
    saveBtn.disabled = false;
  }
});

db.collection(COLLECTIONS.products).orderBy("createdAt", "desc").onSnapshot((snap) => {
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!rows.length) {
    productsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#7a8985;">No products yet — click "Add product" to create one.</td></tr>`;
    return;
  }
  productsTableBody.innerHTML = rows.map(p => `
    <tr>
      <td><img class="admin-thumb" src="${p.image || 'https://picsum.photos/seed/' + p.id + '/100/100'}" alt=""></td>
      <td><strong>${p.name || ""}</strong></td>
      <td>${p.tag || "—"}</td>
      <td>${p.price ? "UGX " + Number(p.price).toLocaleString() : "—"}</td>
      <td class="row-actions">
        <button class="edit-btn" data-edit="${p.id}">Edit</button>
        <button class="delete-btn" data-delete="${p.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  productsTableBody.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => {
    const p = rows.find(r => r.id === btn.dataset.edit);
    editingProductId = p.id;
    document.getElementById("productModalTitle").textContent = "Edit product";
    document.getElementById("p-name").value = p.name || "";
    document.getElementById("p-description").value = p.description || "";
    document.getElementById("p-price").value = p.price || "";
    document.getElementById("p-tag").value = p.tag || "";
    document.getElementById("p-note").value = p.note || "";
    resetImageField("p", p.image || "");
    document.getElementById("p-image-preview").dataset.existing = p.image || "";
    openModal(productModal);
  }));

  productsTableBody.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await db.collection(COLLECTIONS.products).doc(btn.dataset.delete).delete();
      showToast("Product deleted.");
    } catch (err) { showToast("Could not delete product.", true); }
  }));
}, (err) => {
  productsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#C0433A;">Could not load products. Check Firebase setup.</td></tr>`;
});

/* ============================================================
   EVENTS CRUD
   ============================================================ */
const eventModal = "eventModal";
const eventForm = document.getElementById("eventForm");
const eventsTableBody = document.getElementById("eventsTableBody");
let editingEventId = null;

document.getElementById("addEventBtn").addEventListener("click", () => {
  editingEventId = null;
  document.getElementById("eventModalTitle").textContent = "Add event";
  eventForm.reset();
  resetImageField("e");
  openModal(eventModal);
});
document.getElementById("e-cancel").addEventListener("click", () => closeModal(eventModal));

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = eventForm.querySelector("button[type=submit]");
  saveBtn.disabled = true;
  try {
    const image = await resolveImageUrl({
      linkInput: document.getElementById("e-image-link"),
      fileInput: document.getElementById("e-image-file"),
      progressEl: document.getElementById("e-upload-progress")
    }, document.getElementById("e-image-preview").dataset.existing || "");

    const data = {
      title: document.getElementById("e-title").value.trim(),
      description: document.getElementById("e-description").value.trim(),
      date: document.getElementById("e-date").value,
      location: document.getElementById("e-location").value.trim(),
      tag: document.getElementById("e-tag").value.trim(),
      image
    };

    if (editingEventId) {
      await db.collection(COLLECTIONS.events).doc(editingEventId).update(data);
      showToast("Event updated.");
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTIONS.events).add(data);
      showToast("Event added.");
    }
    closeModal(eventModal);
  } catch (err) {
    showToast(err.message || "Could not save event.", true);
  } finally {
    saveBtn.disabled = false;
  }
});

db.collection(COLLECTIONS.events).orderBy("date", "asc").onSnapshot((snap) => {
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!rows.length) {
    eventsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#7a8985;">No events yet — click "Add event" to create one.</td></tr>`;
    return;
  }
  eventsTableBody.innerHTML = rows.map(ev => `
    <tr>
      <td><img class="admin-thumb" src="${ev.image || 'https://picsum.photos/seed/' + ev.id + '/100/100'}" alt=""></td>
      <td><strong>${ev.title || ""}</strong></td>
      <td>${ev.tag || "—"}</td>
      <td>${fmtDate(ev.date)}</td>
      <td class="row-actions">
        <button class="edit-btn" data-edit="${ev.id}">Edit</button>
        <button class="delete-btn" data-delete="${ev.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  eventsTableBody.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => {
    const ev = rows.find(r => r.id === btn.dataset.edit);
    editingEventId = ev.id;
    document.getElementById("eventModalTitle").textContent = "Edit event";
    document.getElementById("e-title").value = ev.title || "";
    document.getElementById("e-description").value = ev.description || "";
    document.getElementById("e-date").value = ev.date || "";
    document.getElementById("e-location").value = ev.location || "";
    document.getElementById("e-tag").value = ev.tag || "";
    resetImageField("e", ev.image || "");
    document.getElementById("e-image-preview").dataset.existing = ev.image || "";
    openModal(eventModal);
  }));

  eventsTableBody.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await db.collection(COLLECTIONS.events).doc(btn.dataset.delete).delete();
      showToast("Event deleted.");
    } catch (err) { showToast("Could not delete event.", true); }
  }));
}, (err) => {
  eventsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#C0433A;">Could not load events. Check Firebase setup.</td></tr>`;
});

/* ============================================================
   GALLERY CRUD
   ============================================================ */
const galleryModal = "galleryModal";
const galleryForm = document.getElementById("galleryForm");
const galleryTableBody = document.getElementById("galleryTableBody");
let editingGalleryId = null;

document.getElementById("addGalleryBtn").addEventListener("click", () => {
  editingGalleryId = null;
  document.getElementById("galleryModalTitle").textContent = "Add photo";
  galleryForm.reset();
  resetImageField("g");
  openModal(galleryModal);
});
document.getElementById("g-cancel").addEventListener("click", () => closeModal(galleryModal));

galleryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = galleryForm.querySelector("button[type=submit]");
  saveBtn.disabled = true;
  try {
    const image = await resolveImageUrl({
      linkInput: document.getElementById("g-image-link"),
      fileInput: document.getElementById("g-image-file"),
      progressEl: document.getElementById("g-upload-progress")
    }, document.getElementById("g-image-preview").dataset.existing || "");

    if (!image) throw new Error("Please add an image link or upload a photo.");

    const data = {
      caption: document.getElementById("g-caption").value.trim(),
      category: document.getElementById("g-category").value.trim(),
      image
    };

    if (editingGalleryId) {
      await db.collection(COLLECTIONS.gallery).doc(editingGalleryId).update(data);
      showToast("Photo updated.");
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTIONS.gallery).add(data);
      showToast("Photo added.");
    }
    closeModal(galleryModal);
  } catch (err) {
    showToast(err.message || "Could not save photo.", true);
  } finally {
    saveBtn.disabled = false;
  }
});

db.collection(COLLECTIONS.gallery).orderBy("createdAt", "desc").onSnapshot((snap) => {
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!rows.length) {
    galleryTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#7a8985;">No photos yet — click "Add photo" to create one.</td></tr>`;
    return;
  }
  galleryTableBody.innerHTML = rows.map(g => `
    <tr>
      <td><img class="admin-thumb" src="${g.image || ''}" alt=""></td>
      <td>${g.caption || "—"}</td>
      <td>${g.category || "—"}</td>
      <td class="row-actions">
        <button class="edit-btn" data-edit="${g.id}">Edit</button>
        <button class="delete-btn" data-delete="${g.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  galleryTableBody.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => {
    const g = rows.find(r => r.id === btn.dataset.edit);
    editingGalleryId = g.id;
    document.getElementById("galleryModalTitle").textContent = "Edit photo";
    document.getElementById("g-caption").value = g.caption || "";
    document.getElementById("g-category").value = g.category || "";
    resetImageField("g", g.image || "");
    document.getElementById("g-image-preview").dataset.existing = g.image || "";
    openModal(galleryModal);
  }));

  galleryTableBody.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    try {
      await db.collection(COLLECTIONS.gallery).doc(btn.dataset.delete).delete();
      showToast("Photo deleted.");
    } catch (err) { showToast("Could not delete photo.", true); }
  }));
}, (err) => {
  galleryTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#C0433A;">Could not load gallery. Check Firebase setup.</td></tr>`;
});

/* Close modals on overlay click */
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });
});
