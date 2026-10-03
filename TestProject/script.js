"use strict";

/* ---------- Config & state ---------- */
const BASE_PRICE = 29;
const MAX_ENGRAVING = 18;
const VARIANTS = {
  small:  { label: "500 ml", bodyHeight: 230, extra: 0 },
  medium: { label: "750 ml", bodyHeight: 290, extra: 6 },
  large:  { label: "1 L",    bodyHeight: 340, extra: 12 },
};
const COLORS = {
  ocean: ["#2a8a94", "#145058"], slate: ["#5b6878", "#2c3440"], sand: ["#dcc89b", "#b39a68"],
  aurora: ["#7b5cff", "#19c7a5"], gold: ["#f0c85a", "#8a5f12"], rose: ["#e8a29a", "#a4524a"],
};
const DEFAULT_DESIGN = { color: "ocean", variant: "medium", finish: "matte", engraving: "", foil: false, shimmer: false };

let design = { ...DEFAULT_DESIGN };
let isPremium = false;
let cart = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const money = (value) => `$${value.toFixed(2)}`;

const bottleSvg = $("#bottleSvg"), bottleBody = $("#bottleBody"), engravingText = $("#engravingText");
const cartZone = $("#cartZone"), productCard = $("#productCard"), preview = $("#preview");

/* ---------- Toast ---------- */
let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------- Rendering the preview ---------- */
function currentPrice() { return BASE_PRICE + VARIANTS[design.variant].extra; }

function renderDesign() {
  const [c1, c2] = COLORS[design.color];
  document.documentElement.style.setProperty("--c1", c1);
  document.documentElement.style.setProperty("--c2", c2);

  const { bodyHeight } = VARIANTS[design.variant];
  bottleBody.setAttribute("height", bodyHeight);
  $("#shine").setAttribute("height", bodyHeight);
  $("#gloss").setAttribute("height", bodyHeight - 30);
  const middle = 58 + bodyHeight / 2;
  engravingText.setAttribute("transform", `rotate(-90 100 ${middle})`);
  engravingText.setAttribute("y", middle + 5);
  engravingText.setAttribute("x", 100);
  engravingText.textContent = design.engraving;

  bottleSvg.classList.toggle("glossy", design.finish === "glossy");
  bottleSvg.classList.toggle("foil", design.foil);
  bottleSvg.classList.toggle("shimmer", design.shimmer);

  $("#productName").textContent = design.engraving ? `Tidewell Flask – ${design.engraving}` : "Tidewell Flask";
  $("#productPrice").textContent = money(currentPrice());

  $$(".swatch").forEach((swatch) => swatch.setAttribute("aria-pressed", swatch.dataset.color === design.color));
  const length = design.engraving.length;
  const counter = $("#engravingCounter");
  counter.textContent = `${length} / ${MAX_ENGRAVING}`;
  counter.classList.toggle("warn", length >= MAX_ENGRAVING);
}

/* ---------- Free customization controls ---------- */
$("#freeColors").addEventListener("click", (event) => {
  const swatch = event.target.closest(".swatch");
  if (swatch) { design.color = swatch.dataset.color; renderDesign(); }
});
$("#variantSelect").addEventListener("change", (event) => { design.variant = event.target.value; renderDesign(); });
$$('input[name="finish"]').forEach((radio) =>
  radio.addEventListener("change", () => { design.finish = radio.value; renderDesign(); }));

$("#engravingInput").addEventListener("input", (event) => {
  design.engraving = event.target.value;
  $("#engravingError").textContent = "";
  event.target.classList.remove("invalid");
  if (design.engraving.length >= MAX_ENGRAVING) {
    $("#engravingError").textContent = `Limit reached: ${MAX_ENGRAVING} characters maximum.`;
  }
  renderDesign();
});

/* ---------- Description protection ---------- */
["copy", "cut"].forEach((action) =>
  $("#productDescription").addEventListener(action, (event) => {
    event.preventDefault();
    showToast("The product description is protected and cannot be copied or cut.");
  }));

/* ---------- Interactive preview (pointer) ---------- */
preview.addEventListener("pointerenter", () => preview.classList.add("active"));
preview.addEventListener("pointermove", (event) => {
  const box = preview.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const y = (event.clientY - box.top) / box.height;
  $("#tilt").style.transform = `rotateY(${(x - 0.5) * 30}deg) rotateX(${(0.5 - y) * 30}deg)`;
  preview.style.setProperty("--gx", `${x * 100}%`);
  preview.style.setProperty("--gy", `${y * 100}%`);
});
preview.addEventListener("pointerleave", () => {
  preview.classList.remove("active");
  $("#tilt").style.transform = "rotateY(0) rotateX(0)";
  $("#hoverTag").textContent = "Move over the bottle";
});
bottleSvg.addEventListener("mouseover", (event) => {
  const part = event.target.closest("[data-part]");
  $("#hoverTag").textContent = part ? `Hovering: ${part.dataset.part}` : "Move over the bottle";
});

/* ---------- Drag and drop to cart ---------- */
productCard.addEventListener("dragstart", (event) => {
  event.dataTransfer.setData("text/plain", "tidewell-flask");
  event.dataTransfer.effectAllowed = "copy";
  productCard.classList.add("dragging");
});
productCard.addEventListener("dragend", () => productCard.classList.remove("dragging"));
cartZone.addEventListener("dragenter", (event) => { event.preventDefault(); cartZone.classList.add("drag-over"); });
cartZone.addEventListener("dragover", (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; });
cartZone.addEventListener("dragleave", (event) => {
  if (!cartZone.contains(event.relatedTarget)) cartZone.classList.remove("drag-over");
});
cartZone.addEventListener("drop", (event) => {
  event.preventDefault();
  cartZone.classList.remove("drag-over");
  if (event.dataTransfer.getData("text/plain") === "tidewell-flask") addToCart();
});

function addToCart() {
  cart.push({
    label: `${VARIANTS[design.variant].label} ${design.color}${design.engraving ? ` – "${design.engraving}"` : ""}`,
    price: currentPrice(),
  });
  renderCart();
  cartZone.classList.remove("dropped");
  void cartZone.offsetWidth; // restart animation
  cartZone.classList.add("dropped");
  showToast("Added to cart. Your custom flask is on its way!");
}

function renderCart() {
  $("#cartList").innerHTML = "";
  cart.forEach((item) => {
    const row = document.createElement("li");
    row.innerHTML = "<span></span><strong></strong>";
    row.firstChild.textContent = item.label;
    row.lastChild.textContent = money(item.price);
    $("#cartList").appendChild(row);
  });
  $("#cartEmpty").hidden = cart.length > 0;
  $("#cartCount").textContent = cart.length;
  $("#cartTotal").textContent = money(cart.reduce((sum, item) => sum + item.price, 0));
}

/* ---------- Main form: validation, submit, reset ---------- */
$("#customForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#engravingInput");
  const name = input.value.trim();
  const message = $("#formMessage");
  message.className = "message";
  if (!name) return fail("Enter a name to engrave before adding to cart.");
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return fail("Use only letters, numbers, spaces, . ' or -.");
  design.engraving = name;
  renderDesign();
  addToCart();
  message.textContent = "Design saved and added to your cart.";
  message.classList.add("ok");

  function fail(text) {
    $("#engravingError").textContent = text;
    input.classList.add("invalid");
    input.focus();
  }
});

$("#customForm").addEventListener("reset", () => {
  design = { ...DEFAULT_DESIGN };
  $("#variantSelect").value = "medium";
  $("#foilToggle").checked = false;
  $("#shimmerToggle").checked = false;
  $("#formMessage").textContent = "";
  $("#engravingError").textContent = "";
  $("#engravingInput").classList.remove("invalid");
  $("#lockMessage").hidden = true;
  renderDesign();
  showToast("Design reset to defaults.");
});

/* ---------- Premium lock ---------- */
function guardPremium(event, featureName) {
  if (isPremium) return true;
  event.preventDefault();
  event.stopPropagation();
  $("#lockText").textContent = `${featureName} is a premium feature. Upgrade to unlock it.`;
  $("#lockMessage").hidden = false;
  const target = event.currentTarget;
  target.classList.remove("shake");
  void target.offsetWidth;
  target.classList.add("shake");
  return false;
}
$("#premiumColors").addEventListener("click", (event) => {
  const swatch = event.target.closest(".swatch");
  if (!swatch || !guardPremium(event, "This premium color")) return;
  design.color = swatch.dataset.color;
  renderDesign();
});
$("#foilToggle").parentElement.addEventListener("click", (event) => {
  if (!guardPremium(event, "Gold foil engraving")) return;
}, true);
$("#shimmerToggle").parentElement.addEventListener("click", (event) => {
  if (!guardPremium(event, "The shimmer effect")) return;
}, true);
$("#foilToggle").addEventListener("change", (event) => { design.foil = event.target.checked; renderDesign(); });
$("#shimmerToggle").addEventListener("change", (event) => { design.shimmer = event.target.checked; renderDesign(); });

/* ---------- Payment dialog ---------- */
const payDialog = $("#payDialog");
const views = { form: $("#payView"), processing: $("#processingView"), success: $("#successView") };
function showView(name) { Object.entries(views).forEach(([key, el]) => (el.hidden = key !== name)); }

$$("[data-open-pay]").forEach((button) =>
  button.addEventListener("click", () => { showView("form"); payDialog.showModal(); }));
$("#closePay").addEventListener("click", () => payDialog.close());
$("#doneBtn").addEventListener("click", () => { payDialog.close(); $("#premium").scrollIntoView(); });

$("#cardNumber").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});
$("#cardExpiry").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
  event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
});
$("#cardCvv").addEventListener("input", (event) => { event.target.value = event.target.value.replace(/\D/g, ""); });

function validatePayment() {
  const errors = {};
  const name = $("#cardName").value.trim();
  const number = $("#cardNumber").value.replace(/\s/g, "");
  const expiry = $("#cardExpiry").value;
  const cvv = $("#cardCvv").value;

  if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(name)) errors.cardName = "Enter the name as shown on the card (letters only).";
  if (!/^\d{16}$/.test(number)) errors.cardNumber = "Card number must have 16 digits.";
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match || +match[1] < 1 || +match[1] > 12) errors.cardExpiry = "Use the format MM/YY with a valid month.";
  else {
    const now = new Date();
    const expiresAt = new Date(2000 + +match[2], +match[1], 1); // first day after expiry month
    if (expiresAt <= now) errors.cardExpiry = "This card has expired.";
  }
  if (!/^\d{3,4}$/.test(cvv)) errors.cardCvv = "CVV must be 3 or 4 digits.";

  ["cardName", "cardNumber", "cardExpiry", "cardCvv"].forEach((id) => {
    $(`[data-error-for="${id}"]`).textContent = errors[id] || "";
    $(`#${id}`).classList.toggle("invalid", Boolean(errors[id]));
  });
  return Object.keys(errors).length === 0;
}

$("#payForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validatePayment()) return;
  showView("processing");
  $("#payForm").reset(); // card data is never kept
  setTimeout(() => { activatePremium(); showView("success"); playSuccessAnimation(); }, 2000);
});
$("#payForm").addEventListener("reset", () => {
  $$("#payForm .error").forEach((el) => (el.textContent = ""));
  $$("#payForm input").forEach((el) => el.classList.remove("invalid"));
});

function activatePremium() {
  isPremium = true;
  document.body.dataset.tier = "premium";
  $("#statusText").textContent = "Premium User";
  $("#lockMessage").hidden = true;
  showToast("Premium activated. All features unlocked.");
}

/* ---------- Lottie success animation (inline data, no network needed) ---------- */
const strokeGroup = (shape, trimStart, trimEnd) => ({
  ty: "gr", nm: "g", it: [shape,
    { ty: "st", c: { a: 0, k: [0.11, 0.48, 0.33, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 7 }, lc: 2, lj: 2 },
    { ty: "tm", s: { a: 0, k: 0 }, o: { a: 0, k: 0 }, m: 1,
      e: { a: 1, k: [{ t: trimStart, s: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } }, { t: trimEnd, s: [100] }] } },
    { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }],
});
const lottieLayer = (index, shapeGroup) => ({
  ddd: 0, ind: index, ty: 4, nm: `layer${index}`, sr: 1, ao: 0, ip: 0, op: 60, st: 0, bm: 0,
  ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
  shapes: [shapeGroup],
});
const SUCCESS_ANIMATION = {
  v: "5.7.0", fr: 30, ip: 0, op: 60, w: 100, h: 100, nm: "success", ddd: 0, assets: [],
  layers: [
    lottieLayer(1, strokeGroup({ ty: "sh", ks: { a: 0, k: { i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-20, 2], [-6, 16], [22, -14]], c: false } } }, 25, 45)),
    lottieLayer(2, strokeGroup({ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [80, 80] }, d: 1 }, 0, 30)),
  ],
};

function playSuccessAnimation() {
  const box = $("#lottieBox");
  box.innerHTML = "";
  if (typeof lottie === "undefined") { box.textContent = "✔"; return; } // offline fallback
  lottie.loadAnimation({ container: box, renderer: "svg", loop: false, autoplay: true, animationData: SUCCESS_ANIMATION });
}

/* ---------- Reset whole demo ---------- */
$("#resetAll").addEventListener("click", () => {
  isPremium = false;
  document.body.dataset.tier = "free";
  $("#statusText").textContent = "Free User";
  cart = [];
  renderCart();
  $("#customForm").reset();
  showToast("Demo reset: Free User, empty cart.");
});

/* ---------- Init ---------- */
renderDesign();
renderCart();