/**
 * Tribal Mart — Jury Presentation generator
 *
 * Run:  node docs/generate_jury_ppt.js
 * Output: docs/Tribal-Mart-Jury-Presentation.pptx
 *
 * Theme: Warm Terracotta — dominant tribal palette.
 */

const pptxgen = require("pptxgenjs");
const path = require("path");

// ── Palette (Warm Terracotta, tribal-inspired) ─────────
const ACCENT       = "C0552C"; // terracotta
const ACCENT_DARK  = "8E3B1A";
const OCHRE        = "D99441";
const OCHRE_DARK   = "B07020";
const INDIGO       = "2E3A59";
const FOREST       = "4A6A3A";
const CREAM        = "FAF6F0";
const BG_SOFT      = "F3ECE1";
const FG           = "1A1410";
const FG_MID       = "5B4E44";
const FG_LIGHT     = "8C7D70";
const BORDER       = "D8CCBA";
const WHITE        = "FFFFFF";

// Fonts
const FONT_HEAD = "Georgia";
const FONT_BODY = "Calibri";

const pres = new pptxgen();
pres.author = "Tribal Mart";
pres.company = "Tribal Mart";
pres.title = "Tribal Mart — Jury Presentation";
pres.subject = "Four-portal marketplace for India's tribal cooperatives";
pres.layout = "LAYOUT_WIDE";          // 13.333 x 7.5 inches

const SW = 13.333; // slide width
const SH = 7.5;    // slide height

// ── Helper: footer band on content slides ────────────
function addFooter(slide, pageLabel) {
  slide.addShape("rect", {
    x: 0, y: SH - 0.35, w: SW, h: 0.04,
    fill: { color: BORDER }, line: { type: "none" },
  });
  slide.addText("TRIBAL MART", {
    x: 0.5, y: SH - 0.32, w: 4, h: 0.28,
    fontFace: FONT_HEAD, fontSize: 9, bold: true, color: ACCENT,
    valign: "middle",
  });
  slide.addText(pageLabel || "", {
    x: SW - 4, y: SH - 0.32, w: 3.5, h: 0.28,
    fontFace: FONT_BODY, fontSize: 9, color: FG_LIGHT,
    align: "right", valign: "middle", italic: true,
  });
}

// ── Helper: top-right small tag chip ─────────────────
function addTag(slide, text, color = ACCENT) {
  slide.addShape("roundRect", {
    x: SW - 2.4, y: 0.55, w: 1.9, h: 0.32,
    fill: { color: color }, line: { type: "none" }, rectRadius: 0.16,
  });
  slide.addText(text, {
    x: SW - 2.4, y: 0.55, w: 1.9, h: 0.32,
    fontFace: FONT_HEAD, fontSize: 10, bold: true, color: WHITE,
    align: "center", valign: "middle", charSpacing: 2,
  });
}

// ────────────────────────────────────────────────────────
// SLIDE 1 — COVER
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: FG };

  // Big terracotta block left
  s.addShape("rect", {
    x: 0, y: 0, w: 5.5, h: SH,
    fill: { color: ACCENT }, line: { type: "none" },
  });
  // Ochre stripe
  s.addShape("rect", {
    x: 0, y: SH - 0.85, w: 5.5, h: 0.25,
    fill: { color: OCHRE }, line: { type: "none" },
  });

  // Diamond motif pattern (rotated squares)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = 0.4 + col * 1.3;
      const cy = 0.8 + row * 0.85;
      s.addShape("diamond", {
        x: cx, y: cy, w: 0.35, h: 0.35,
        fill: { color: ACCENT_DARK }, line: { type: "none" },
        transparency: 70,
      });
    }
  }

  // Title
  s.addText("Tribal\nMart", {
    x: 6, y: 1.2, w: 6.8, h: 2.6,
    fontFace: FONT_HEAD, fontSize: 80, bold: true, color: WHITE,
    valign: "top",
  });

  // Italic tagline
  s.addText("Where India's tribal craft meets\nconscious commerce.", {
    x: 6, y: 3.8, w: 6.8, h: 1,
    fontFace: FONT_HEAD, fontSize: 22, italic: true, color: OCHRE,
    valign: "top",
  });

  // Sub-line
  s.addText("A four-portal marketplace with an Agent-assisted listing workflow and Hindi/English instant switch — built for the cooperatives who actually craft the goods sold here.", {
    x: 6, y: 5.0, w: 6.8, h: 1.4,
    fontFace: FONT_BODY, fontSize: 14, color: "DDDDDD",
    valign: "top",
  });

  // Bottom meta strip
  s.addShape("line", { x: 6, y: 6.5, w: 4, h: 0, line: { color: ACCENT, width: 3 } });
  s.addText("Jury Presentation  ·  v1.0  ·  2026", {
    x: 6, y: 6.6, w: 6.8, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: OCHRE,
    charSpacing: 4,
  });
}

// ────────────────────────────────────────────────────────
// SLIDE 2 — THE PROBLEM
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "01  ·  THE PROBLEM", FG);

  s.addText("Tribal artisans are\ncut off from the\ndigital market.", {
    x: 0.7, y: 1.0, w: 7.5, h: 3.0,
    fontFace: FONT_HEAD, fontSize: 48, bold: true, color: FG, valign: "top",
  });

  s.addText("Most marketplaces have two sides — buyer and seller. But India's tribal cooperatives often don't fit the seller role. Many craftspeople are older, speak only their local language, and have never opened a digital storefront.", {
    x: 0.7, y: 4.1, w: 7.2, h: 1.8,
    fontFace: FONT_BODY, fontSize: 16, color: FG_MID, valign: "top",
  });

  // Right-side stat callouts
  const stats = [
    { num: "104M+", label: "Tribal population in India", color: ACCENT },
    { num: "70%", label: "of artisans don't sell online", color: OCHRE_DARK },
    { num: "8 of 10", label: "lose income to middlemen", color: INDIGO },
  ];
  stats.forEach((stat, i) => {
    const y = 1.2 + i * 1.85;
    s.addShape("roundRect", {
      x: 8.7, y, w: 4.2, h: 1.55,
      fill: { color: BG_SOFT }, line: { color: BORDER, width: 0.5 },
      rectRadius: 0.12,
    });
    s.addText(stat.num, {
      x: 9.0, y: y + 0.1, w: 3.5, h: 0.85,
      fontFace: FONT_HEAD, fontSize: 40, bold: true, color: stat.color, valign: "middle",
    });
    s.addText(stat.label, {
      x: 9.0, y: y + 0.95, w: 3.5, h: 0.45,
      fontFace: FONT_BODY, fontSize: 12, color: FG_MID, valign: "top",
    });
  });

  addFooter(s, "The problem");
}

// ────────────────────────────────────────────────────────
// SLIDE 3 — THE SOLUTION
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: CREAM };
  addTag(s, "02  ·  OUR SOLUTION");

  s.addText("Introducing a third side:\nthe Agent.", {
    x: 0.7, y: 1.0, w: 12, h: 1.8,
    fontFace: FONT_HEAD, fontSize: 44, bold: true, color: FG, valign: "top",
  });

  s.addText("A digital helper who can list and manage products on behalf of artisans — with their consent. The agent gets a 5% commission. The artisan's craft reaches a wider audience without learning a new tool. Everyone wins.", {
    x: 0.7, y: 2.8, w: 12, h: 1.4,
    fontFace: FONT_BODY, fontSize: 16, color: FG_MID, valign: "top",
  });

  // Three-flow diagram: Agency → Agent → Buyers
  const nodeY = 4.6;
  const nodes = [
    { x: 1.0, w: 3.2, color: OCHRE_DARK, label: "AGENCY", sub: "Tribal cooperative" },
    { x: 5.0, w: 3.2, color: ACCENT, label: "AGENT", sub: "Digital helper · 5%" },
    { x: 9.0, w: 3.2, color: INDIGO, label: "CUSTOMERS", sub: "Conscious buyers" },
  ];
  nodes.forEach((n) => {
    s.addShape("roundRect", {
      x: n.x, y: nodeY, w: n.w, h: 1.5,
      fill: { color: n.color }, line: { type: "none" }, rectRadius: 0.12,
    });
    s.addText(n.label, {
      x: n.x, y: nodeY + 0.25, w: n.w, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
    s.addText(n.sub, {
      x: n.x, y: nodeY + 0.85, w: n.w, h: 0.45,
      fontFace: FONT_BODY, fontSize: 12, color: WHITE,
      align: "center", valign: "middle", italic: true,
    });
  });
  // Connector arrows
  s.addShape("rightArrow", {
    x: 4.25, y: nodeY + 0.6, w: 0.65, h: 0.3,
    fill: { color: FG }, line: { type: "none" },
  });
  s.addShape("rightArrow", {
    x: 8.25, y: nodeY + 0.6, w: 0.65, h: 0.3,
    fill: { color: FG }, line: { type: "none" },
  });

  s.addText("And a fourth role — Admin — keeps the marketplace honest.", {
    x: 0.7, y: 6.4, w: 12, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 14, italic: true, color: ACCENT, align: "center",
  });

  addFooter(s, "Our solution");
}

// ────────────────────────────────────────────────────────
// SLIDE 4 — THE 4 PORTALS
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "03  ·  FOUR PORTALS");

  s.addText("One platform.\nFour roles. Four panels.", {
    x: 0.7, y: 0.55, w: 12, h: 1.4,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });

  const cards = [
    { x: 0.7,  y: 2.0, color: INDIGO,     icon: "Buy",   title: "Customer", sub: "Buys authentic tribal craft",
      bullets: ["Browse + search + filters", "Multi-item cart + checkout", "Track orders + reviews + returns"] },
    { x: 6.95, y: 2.0, color: OCHRE_DARK, icon: "Sell",  title: "Agency",   sub: "Tribal cooperative",
      bullets: ["Add / edit / duplicate products", "Fulfil orders + tracking + payouts", "Hindi ⇄ English instant toggle"] },
    { x: 0.7,  y: 4.75, color: ACCENT,    icon: "Help",  title: "Agent",    sub: "Digital helper for artisans",
      bullets: ["Accept agency requests", "List products on their behalf", "5% commission per approved sale"] },
    { x: 6.95, y: 4.75, color: FG,        icon: "Watch", title: "Admin",    sub: "Platform steward",
      bullets: ["Approve listings + verify KYC", "Financial dashboard + payouts", "Categories + featured curation"] },
  ];
  cards.forEach((c) => {
    s.addShape("roundRect", {
      x: c.x, y: c.y, w: 5.65, h: 2.5,
      fill: { color: WHITE }, line: { color: BORDER, width: 0.7 }, rectRadius: 0.14,
    });
    // Left color strip
    s.addShape("rect", {
      x: c.x, y: c.y, w: 0.12, h: 2.5,
      fill: { color: c.color }, line: { type: "none" },
    });
    // Icon chip
    s.addShape("roundRect", {
      x: c.x + 0.35, y: c.y + 0.3, w: 0.85, h: 0.5,
      fill: { color: c.color }, line: { type: "none" }, rectRadius: 0.08,
    });
    s.addText(c.icon, {
      x: c.x + 0.35, y: c.y + 0.3, w: 0.85, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
    // Title
    s.addText(c.title, {
      x: c.x + 1.35, y: c.y + 0.25, w: 4.0, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: FG, valign: "middle",
    });
    // Sub
    s.addText(c.sub, {
      x: c.x + 0.35, y: c.y + 0.95, w: 5.1, h: 0.32,
      fontFace: FONT_BODY, fontSize: 12, italic: true, color: FG_MID,
    });
    // Bullets
    c.bullets.forEach((b, i) => {
      const by = c.y + 1.35 + i * 0.35;
      s.addShape("ellipse", {
        x: c.x + 0.42, y: by + 0.10, w: 0.10, h: 0.10,
        fill: { color: c.color }, line: { type: "none" },
      });
      s.addText(b, {
        x: c.x + 0.65, y: by, w: 4.9, h: 0.32,
        fontFace: FONT_BODY, fontSize: 12, color: FG, valign: "middle",
      });
    });
  });

  addFooter(s, "The four portals");
}

// ────────────────────────────────────────────────────────
// SLIDE 5 — CUSTOMER PORTAL
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "04  ·  CUSTOMER PORTAL", INDIGO);

  s.addText("From discovery to\ndelivery to review.", {
    x: 0.7, y: 0.55, w: 7.5, h: 2,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });
  s.addText("9 dedicated pages. Every step of the buyer journey covered.", {
    x: 0.7, y: 2.5, w: 7.5, h: 0.5,
    fontFace: FONT_BODY, fontSize: 15, italic: true, color: FG_MID,
  });

  // Left side — features
  const feats = [
    "🔍 Search + category + price filters",
    "🛒 Multi-item cart with saved addresses",
    "📦 Order tracking timeline + cancel + reorder",
    "🧾 Printable invoice download",
    "⭐ Reviews & star ratings after delivery",
    "↩️ Returns within 7 days with status timeline",
    "❤️ Watchlist → Move to Cart",
    "⚖️ Compare up to 4 products side-by-side",
    "👤 Profile: addresses, payments, avatar",
  ];
  feats.forEach((f, i) => {
    const fy = 3.2 + i * 0.4;
    s.addText(f, {
      x: 0.85, y: fy, w: 7.5, h: 0.35,
      fontFace: FONT_BODY, fontSize: 13.5, color: FG, valign: "middle",
    });
  });

  // Right side — stat block
  s.addShape("roundRect", {
    x: 8.8, y: 0.95, w: 4.1, h: 6,
    fill: { color: INDIGO }, line: { type: "none" }, rectRadius: 0.16,
  });
  s.addText("9", {
    x: 8.8, y: 1.2, w: 4.1, h: 2.2,
    fontFace: FONT_HEAD, fontSize: 140, bold: true, color: WHITE,
    align: "center", valign: "middle",
  });
  s.addText("pages dedicated\nto the buyer", {
    x: 8.8, y: 3.5, w: 4.1, h: 1.0,
    fontFace: FONT_HEAD, fontSize: 18, italic: true, color: OCHRE,
    align: "center", valign: "top",
  });
  s.addShape("line", {
    x: 9.8, y: 4.7, w: 2.1, h: 0,
    line: { color: OCHRE, width: 2 },
  });
  s.addText("Dashboard · Browse · Cart\nOrders · Returns · Watchlist\nCompare · Profile · Reviews", {
    x: 8.8, y: 4.9, w: 4.1, h: 1.8,
    fontFace: FONT_BODY, fontSize: 13, color: WHITE,
    align: "center", valign: "top",
  });

  addFooter(s, "Customer portal");
}

// ────────────────────────────────────────────────────────
// SLIDE 6 — AGENCY PORTAL
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "05  ·  AGENCY PORTAL", OCHRE_DARK);

  s.addText("The seller side —\nbuilt for cooperatives.", {
    x: 0.7, y: 0.55, w: 8, h: 2,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });

  // Highlight box: Hindi feature
  s.addShape("roundRect", {
    x: 0.7, y: 2.4, w: 12, h: 1.2,
    fill: { color: OCHRE }, line: { type: "none" }, rectRadius: 0.12,
  });
  s.addText("EN  ⇄  हिं", {
    x: 0.95, y: 2.55, w: 2.5, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 38, bold: true, color: WHITE, valign: "middle",
  });
  s.addText("The Hindi/English instant toggle", {
    x: 3.7, y: 2.55, w: 9, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 16, bold: true, color: WHITE,
  });
  s.addText("Sidebar, dashboard, stats, action cards — every label flips to Devanagari with one click. Built for the people who actually run tribal cooperatives.", {
    x: 3.7, y: 2.95, w: 9, h: 0.6,
    fontFace: FONT_BODY, fontSize: 12, color: WHITE, italic: true,
  });

  // Features grid 2x4
  const features = [
    "🪔 Add / edit / duplicate listings",
    "📦 Fulfilment: confirm → ship → deliver",
    "🧾 Tracking IDs + printable packing slip",
    "↩️ Returns review + refund processing",
    "💸 Payouts: 10% commission + 18% GST + net",
    "📊 Real-time sales & conversion analytics",
    "🤝 Request agent help when needed",
    "✓ Verified Cooperative badge after KYC",
  ];
  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.7 + col * 6.15;
    const y = 4.0 + row * 0.62;
    s.addShape("roundRect", {
      x, y, w: 5.95, h: 0.5,
      fill: { color: BG_SOFT }, line: { color: BORDER, width: 0.3 }, rectRadius: 0.08,
    });
    s.addText(f, {
      x: x + 0.2, y, w: 5.7, h: 0.5,
      fontFace: FONT_BODY, fontSize: 13, color: FG, valign: "middle",
    });
  });

  addFooter(s, "Agency portal");
}

// ────────────────────────────────────────────────────────
// SLIDE 7 — AGENT PORTAL
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "06  ·  AGENT PORTAL", ACCENT);

  s.addText("The bridge between\ncraft and commerce.", {
    x: 0.7, y: 0.55, w: 8, h: 2,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });
  s.addText("Our unique role. The third side of the marketplace.", {
    x: 0.7, y: 2.5, w: 8, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: ACCENT,
  });

  // Left: 5-step flow
  const steps = [
    { n: "1", t: "Sign up", s: "Pick the Agent portal · provide name + address" },
    { n: "2", t: "Receive requests", s: "Agencies that want help send a request" },
    { n: "3", t: "Approve", s: "Approve → agency joins your managed list" },
    { n: "4", t: "List for them", s: "Add products on their behalf with one click" },
    { n: "5", t: "Get paid", s: "5% commission on every approved sale" },
  ];
  steps.forEach((step, i) => {
    const y = 3.1 + i * 0.65;
    // Number circle
    s.addShape("ellipse", {
      x: 0.75, y, w: 0.55, h: 0.55,
      fill: { color: ACCENT }, line: { type: "none" },
    });
    s.addText(step.n, {
      x: 0.75, y, w: 0.55, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 18, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
    // Title
    s.addText(step.t, {
      x: 1.45, y: y - 0.02, w: 6.5, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: FG, valign: "middle",
    });
    s.addText(step.s, {
      x: 1.45, y: y + 0.28, w: 6.5, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11.5, color: FG_MID, valign: "middle", italic: true,
    });
  });

  // Right: big commission stat
  s.addShape("roundRect", {
    x: 9.0, y: 2.9, w: 3.9, h: 4,
    fill: { color: ACCENT }, line: { type: "none" }, rectRadius: 0.16,
  });
  s.addText("5%", {
    x: 9.0, y: 3.2, w: 3.9, h: 2.0,
    fontFace: FONT_HEAD, fontSize: 110, bold: true, color: WHITE,
    align: "center", valign: "middle",
  });
  s.addText("commission per\napproved sale", {
    x: 9.0, y: 5.3, w: 3.9, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 16, italic: true, color: OCHRE,
    align: "center", valign: "top",
  });
  s.addShape("line", {
    x: 9.8, y: 6.25, w: 2.3, h: 0,
    line: { color: WHITE, width: 1.5 },
  });
  s.addText("tracked per agency,\npaid monthly", {
    x: 9.0, y: 6.4, w: 3.9, h: 0.6,
    fontFace: FONT_BODY, fontSize: 11, color: WHITE,
    align: "center", valign: "top",
  });

  addFooter(s, "Agent portal");
}

// ────────────────────────────────────────────────────────
// SLIDE 8 — ADMIN PORTAL
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: FG };
  addTag(s, "07  ·  ADMIN PORTAL", OCHRE);

  s.addText("Stewardship at scale.", {
    x: 0.7, y: 0.55, w: 12, h: 1.4,
    fontFace: FONT_HEAD, fontSize: 40, bold: true, color: WHITE, valign: "top",
  });
  s.addText("Approve. Verify. Settle. Audit. The platform stays honest because admins have the right tools.", {
    x: 0.7, y: 1.85, w: 12, h: 0.6,
    fontFace: FONT_BODY, fontSize: 15, italic: true, color: OCHRE,
  });

  // 4 capability cards
  const caps = [
    { x: 0.7, color: ACCENT, big: "Bulk", small: "approve / reject pending listings with checkboxes" },
    { x: 3.95, color: OCHRE, big: "KYC", small: "verify cooperative documents → Verified badge unlocks" },
    { x: 7.2, color: FOREST, big: "Finance", small: "GMV → 10% commission → 18% GST → net payable" },
    { x: 10.45, color: INDIGO, big: "Audit", small: "user detail · suspend · featured · categories" },
  ];
  caps.forEach((c) => {
    s.addShape("roundRect", {
      x: c.x, y: 2.9, w: 2.6, h: 3.4,
      fill: { color: c.color }, line: { type: "none" }, rectRadius: 0.14,
    });
    s.addText(c.big, {
      x: c.x, y: 3.2, w: 2.6, h: 1.5,
      fontFace: FONT_HEAD, fontSize: 38, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
    s.addShape("line", {
      x: c.x + 0.8, y: 4.75, w: 1, h: 0,
      line: { color: WHITE, width: 1.5 },
    });
    s.addText(c.small, {
      x: c.x + 0.2, y: 4.9, w: 2.2, h: 1.3,
      fontFace: FONT_BODY, fontSize: 12, color: WHITE,
      align: "center", valign: "top", italic: true,
    });
  });

  s.addText("Every action — from a single Approve click to a settlement payout — is gated by role middleware and ownership checks on the backend.", {
    x: 0.7, y: 6.5, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, italic: true, color: "BBBBBB", align: "center",
  });

  addFooter(s, "Admin portal");
}

// ────────────────────────────────────────────────────────
// SLIDE 9 — CROSS-PORTAL WORKFLOW
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: CREAM };
  addTag(s, "08  ·  CROSS-PORTAL FLOW");

  s.addText("How the four panels\ntalk to each other.", {
    x: 0.7, y: 0.55, w: 12, h: 1.7,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });

  s.addText("A single product's journey, from the moment an agent uploads it to the moment a customer reviews it.", {
    x: 0.7, y: 2.3, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: FG_MID,
  });

  // Horizontal pill chain
  const chain = [
    { l: "Agent lists",        c: ACCENT },
    { l: "Awaits agency",      c: OCHRE_DARK },
    { l: "Agency approves",    c: OCHRE },
    { l: "Awaits admin",       c: "C08A2C" },
    { l: "Admin approves",     c: FOREST },
    { l: "Live (approved)",    c: FOREST },
    { l: "Customer buys",      c: INDIGO },
    { l: "Sold",               c: "2E3A59" },
  ];
  const totalW = 12;
  const gap = 0.15;
  const pillW = (totalW - gap * (chain.length - 1)) / chain.length;
  const pillH = 0.8;
  const pillY = 3.2;
  chain.forEach((p, i) => {
    const px = 0.7 + i * (pillW + gap);
    s.addShape("roundRect", {
      x: px, y: pillY, w: pillW, h: pillH,
      fill: { color: p.c }, line: { type: "none" }, rectRadius: 0.4,
    });
    s.addText(p.l, {
      x: px, y: pillY, w: pillW, h: pillH,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
  });

  // Below the chain — explanation cards
  const explain = [
    { title: "Two-gate approval", body: "Agent listings go through Agency THEN Admin. Direct agency listings only need Admin. Customer never sees anything unverified." },
    { title: "Role middleware", body: "Backend enforces who can transition each state. Agent can't approve their own listing; agency can't approve admin's queue." },
    { title: "Real-time updates", body: "Every status change writes a timeline entry and flips notification counters on the right portal's bell." },
  ];
  explain.forEach((e, i) => {
    const ex = 0.7 + i * 4.2;
    s.addShape("roundRect", {
      x: ex, y: 4.55, w: 3.95, h: 2.0,
      fill: { color: WHITE }, line: { color: BORDER, width: 0.5 }, rectRadius: 0.12,
    });
    s.addShape("rect", {
      x: ex, y: 4.55, w: 3.95, h: 0.08,
      fill: { color: ACCENT }, line: { type: "none" },
    });
    s.addText(e.title, {
      x: ex + 0.25, y: 4.78, w: 3.5, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: FG, valign: "top",
    });
    s.addText(e.body, {
      x: ex + 0.25, y: 5.25, w: 3.5, h: 1.25,
      fontFace: FONT_BODY, fontSize: 11.5, color: FG_MID, valign: "top",
    });
  });

  addFooter(s, "Cross-portal flow");
}

// ────────────────────────────────────────────────────────
// SLIDE 10 — TECH STACK
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "09  ·  TECH STACK");

  s.addText("Built with modern,\nproduction-ready tools.", {
    x: 0.7, y: 0.55, w: 12, h: 1.8,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });

  // Two columns: Frontend / Backend
  const groups = [
    {
      x: 0.7, title: "Frontend", color: INDIGO,
      items: [
        ["React 19", "Component framework"],
        ["Vite 8", "Build tool (no CRA)"],
        ["React Router 6", "SPA routing"],
        ["Framer Motion 12", "Animations & gestures"],
        ["Axios", "API client with auth interceptor"],
        ["Custom i18n", "EN/HI translation provider"],
      ],
    },
    {
      x: 6.95, title: "Backend", color: ACCENT,
      items: [
        ["Node.js + Express 5", "HTTP server"],
        ["MongoDB Atlas + Mongoose", "Schema-validated NoSQL"],
        ["JWT + bcrypt", "Auth + password hashing"],
        ["Multer", "File uploads (images / docs)"],
        ["Razorpay SDK", "Online payment gateway"],
        ["Custom DNS resolver", "Atlas SRV on blocked networks"],
      ],
    },
  ];
  groups.forEach((g) => {
    s.addShape("roundRect", {
      x: g.x, y: 2.7, w: 5.85, h: 4.3,
      fill: { color: WHITE }, line: { color: BORDER, width: 0.6 }, rectRadius: 0.12,
    });
    s.addShape("rect", {
      x: g.x, y: 2.7, w: 0.12, h: 4.3,
      fill: { color: g.color }, line: { type: "none" },
    });
    s.addText(g.title, {
      x: g.x + 0.35, y: 2.85, w: 5.3, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: g.color,
      valign: "middle",
    });
    g.items.forEach((it, i) => {
      const y = 3.5 + i * 0.56;
      s.addText(it[0], {
        x: g.x + 0.35, y, w: 2.4, h: 0.5,
        fontFace: FONT_HEAD, fontSize: 13, bold: true, color: FG, valign: "middle",
      });
      s.addText(it[1], {
        x: g.x + 2.8, y, w: 2.95, h: 0.5,
        fontFace: FONT_BODY, fontSize: 11.5, color: FG_MID, valign: "middle", italic: true,
      });
    });
  });

  addFooter(s, "Tech stack");
}

// ────────────────────────────────────────────────────────
// SLIDE 11 — BY THE NUMBERS
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: ACCENT };
  addTag(s, "10  ·  BY THE NUMBERS", FG);

  s.addText("The platform, today.", {
    x: 0.7, y: 0.55, w: 12, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 40, bold: true, color: WHITE, valign: "top",
  });
  s.addText("Counted from a clean main branch.", {
    x: 0.7, y: 1.8, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: OCHRE,
  });

  // Big stats grid 2x3
  const big = [
    { num: "4",   lbl: "Distinct portals", color: WHITE },
    { num: "30+", lbl: "Pages built", color: WHITE },
    { num: "55+", lbl: "API endpoints", color: WHITE },
    { num: "11",  lbl: "Data models", color: WHITE },
    { num: "2",   lbl: "Languages (EN / हिं)", color: WHITE },
    { num: "10%", lbl: "Platform commission", color: WHITE },
  ];
  big.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.7 + col * 4.2;
    const y = 2.55 + row * 2.2;
    s.addShape("roundRect", {
      x, y, w: 3.95, h: 2.0,
      fill: { color: ACCENT_DARK }, line: { type: "none" }, rectRadius: 0.14,
    });
    s.addText(b.num, {
      x, y: y + 0.1, w: 3.95, h: 1.1,
      fontFace: FONT_HEAD, fontSize: 68, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
    s.addText(b.lbl, {
      x, y: y + 1.35, w: 3.95, h: 0.5,
      fontFace: FONT_BODY, fontSize: 13, color: OCHRE,
      align: "center", valign: "top", italic: true,
    });
  });

  addFooter(s, "By the numbers");
}

// ────────────────────────────────────────────────────────
// SLIDE 12 — KEY FEATURES SHOWCASE
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "11  ·  HIGHLIGHTS");

  s.addText("Features the jury\nwill remember.", {
    x: 0.7, y: 0.55, w: 12, h: 1.8,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });

  const highlights = [
    {
      title: "Hover-shuffle card stack",
      body: "Hover the product carousel on the landing page — cards cycle through one by one with spring physics. Click to jump, leave to settle.",
      color: ACCENT,
    },
    {
      title: "Hindi/English instant toggle",
      body: "One click in the agency portal flips every label — sidebar, dashboard, stats, action cards — into Devanagari. Built for the actual sellers.",
      color: OCHRE_DARK,
    },
    {
      title: "Live count-up stats + scroll reveals",
      body: "Numbers animate from 0 to value when scrolled into view. Every section fades up. Magnetic CTAs follow the cursor.",
      color: INDIGO,
    },
    {
      title: "Agent assistance workflow",
      body: "Agencies that can't run a digital store request an agent. Agent approves, lists products. Two-gate approval (agency → admin). 5% commission.",
      color: FOREST,
    },
    {
      title: "Full marketplace lifecycle",
      body: "Cart → checkout (Razorpay) → tracking timeline → invoice → reviews → returns → refunds. Every state is real.",
      color: ACCENT_DARK,
    },
    {
      title: "Admin financial dashboard",
      body: "GMV, 10% commission, 18% GST, payable to cooperatives — calculated live. Per-agency settlement table with Mark Paid buttons.",
      color: FG,
    },
  ];

  highlights.forEach((h, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.7 + col * 4.2;
    const y = 2.6 + row * 2.2;
    s.addShape("roundRect", {
      x, y, w: 3.95, h: 2.0,
      fill: { color: WHITE }, line: { color: BORDER, width: 0.5 }, rectRadius: 0.1,
    });
    // Top color stripe
    s.addShape("rect", {
      x, y, w: 3.95, h: 0.08,
      fill: { color: h.color }, line: { type: "none" },
    });
    s.addText(h.title, {
      x: x + 0.25, y: y + 0.25, w: 3.55, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: h.color, valign: "top",
    });
    s.addText(h.body, {
      x: x + 0.25, y: y + 0.85, w: 3.55, h: 1.05,
      fontFace: FONT_BODY, fontSize: 11, color: FG_MID, valign: "top",
    });
  });

  addFooter(s, "Highlights");
}

// ────────────────────────────────────────────────────────
// SLIDE 13 — DEMO PLAN
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTag(s, "12  ·  LIVE DEMO");

  s.addText("60 seconds.\nEvery portal.", {
    x: 0.7, y: 0.55, w: 9, h: 1.8,
    fontFace: FONT_HEAD, fontSize: 38, bold: true, color: FG, valign: "top",
  });

  const demoSteps = [
    { n: "1", t: "Landing page",        d: "Hover the card stack, scroll past Makers and animated stats." },
    { n: "2", t: "Sign-up selector",     d: "Pick Agent → split-card login form slides into place." },
    { n: "3", t: "Customer (Tiya)",      d: "Browse → Add to Cart → Checkout (saved address) → Orders." },
    { n: "4", t: "Agency (Bhil Crafts)", d: "Click EN → हिं. Entire UI flips to Hindi. Mark order as Shipped → Print Packing Slip." },
    { n: "5", t: "Agent (Birsa)",        d: "See an incoming agency request → drill into their store → list a product for them." },
    { n: "6", t: "Admin (Sys Admin)",    d: "Pending Products → bulk approve 3 listings. Finance → mark a settlement as paid." },
  ];
  demoSteps.forEach((d, i) => {
    const y = 2.7 + i * 0.68;
    s.addShape("ellipse", {
      x: 0.7, y, w: 0.6, h: 0.6,
      fill: { color: ACCENT }, line: { type: "none" },
    });
    s.addText(d.n, {
      x: 0.7, y, w: 0.6, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 19, bold: true, color: WHITE,
      align: "center", valign: "middle",
    });
    s.addText(d.t, {
      x: 1.45, y: y - 0.02, w: 7, h: 0.36,
      fontFace: FONT_HEAD, fontSize: 15, bold: true, color: FG, valign: "middle",
    });
    s.addText(d.d, {
      x: 1.45, y: y + 0.32, w: 11.4, h: 0.32,
      fontFace: FONT_BODY, fontSize: 12, color: FG_MID, valign: "middle", italic: true,
    });
  });

  // Right side note
  s.addShape("roundRect", {
    x: 9.5, y: 1.0, w: 3.4, h: 1.5,
    fill: { color: BG_SOFT }, line: { color: BORDER, width: 0.5 }, rectRadius: 0.1,
  });
  s.addText("Demo accounts:", {
    x: 9.7, y: 1.1, w: 3.0, h: 0.32,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: ACCENT,
  });
  s.addText("admin@setu.com / admin123\nagency@demo.com / demo123\nagent@demo.com / demo123\ncustomer@demo.com / demo123", {
    x: 9.7, y: 1.42, w: 3.1, h: 1.05,
    fontFace: "Courier New", fontSize: 10, color: FG, valign: "top",
  });

  addFooter(s, "Live demo");
}

// ────────────────────────────────────────────────────────
// SLIDE 14 — ROADMAP / WHAT'S NEXT
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: CREAM };
  addTag(s, "13  ·  ROADMAP");

  s.addText("Where we go\nfrom here.", {
    x: 0.7, y: 0.55, w: 12, h: 1.8,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: FG, valign: "top",
  });

  // Three columns: Now / Next / Future
  const columns = [
    {
      x: 0.7, title: "Shipping now", color: FOREST, when: "v1.0 · today",
      items: [
        "4-portal marketplace",
        "Agent workflow + 5% commission",
        "Hindi/English toggle",
        "Cart, checkout, orders, returns",
        "Reviews & ratings",
        "Admin financial dashboard",
        "Public agency storefronts",
      ],
    },
    {
      x: 4.95, title: "Next 30 days", color: OCHRE_DARK, when: "v1.1",
      items: [
        "Live Razorpay payment keys",
        "Email + WhatsApp notifications",
        "Bulk CSV product upload",
        "Real bank/UPI payout integration",
        "Image CDN (S3/Cloudinary)",
        "Password reset flow",
      ],
    },
    {
      x: 9.2, title: "Beyond", color: ACCENT, when: "v2.0",
      items: [
        "More regional languages (Marathi, Bengali, Tamil)",
        "Mobile app (React Native)",
        "Dispute resolution tickets",
        "Tax reports + GST exports",
        "Search engine (Algolia)",
        "PWA offline browsing",
      ],
    },
  ];
  columns.forEach((c) => {
    s.addShape("roundRect", {
      x: c.x, y: 2.6, w: 3.95, h: 4.4,
      fill: { color: WHITE }, line: { color: BORDER, width: 0.5 }, rectRadius: 0.12,
    });
    s.addShape("rect", {
      x: c.x, y: 2.6, w: 3.95, h: 0.12,
      fill: { color: c.color }, line: { type: "none" },
    });
    s.addText(c.when.toUpperCase(), {
      x: c.x + 0.3, y: 2.85, w: 3.4, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 9, bold: true, color: c.color, charSpacing: 3,
    });
    s.addText(c.title, {
      x: c.x + 0.3, y: 3.15, w: 3.4, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 20, bold: true, color: FG, valign: "top",
    });
    c.items.forEach((item, i) => {
      const y = 3.75 + i * 0.42;
      s.addShape("ellipse", {
        x: c.x + 0.35, y: y + 0.1, w: 0.12, h: 0.12,
        fill: { color: c.color }, line: { type: "none" },
      });
      s.addText(item, {
        x: c.x + 0.55, y, w: 3.3, h: 0.4,
        fontFace: FONT_BODY, fontSize: 11.5, color: FG, valign: "middle",
      });
    });
  });

  addFooter(s, "Roadmap");
}

// ────────────────────────────────────────────────────────
// SLIDE 15 — CLOSING / THANK YOU
// ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: FG };

  // Big terracotta block right
  s.addShape("rect", {
    x: 8.5, y: 0, w: 5, h: SH,
    fill: { color: ACCENT }, line: { type: "none" },
  });

  // Diamond motif on the dark side
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 6; col++) {
      const cx = 0.3 + col * 1.3;
      const cy = 0.5 + row * 0.9;
      s.addShape("diamond", {
        x: cx, y: cy, w: 0.3, h: 0.3,
        fill: { color: ACCENT }, line: { type: "none" },
        transparency: 75,
      });
    }
  }

  // Main title
  s.addText("Thank you.", {
    x: 0.7, y: 1.5, w: 8, h: 2,
    fontFace: FONT_HEAD, fontSize: 80, bold: true, color: WHITE, valign: "top",
  });

  s.addText("Built with care for India's tribal\nartisan communities — Bhil, Santhal,\nMunda, Toda, Gond, and many others —\nwhose craft deserves a marketplace\nthat respects their pace, their language,\nand their dignity.", {
    x: 0.7, y: 3.7, w: 7.5, h: 3,
    fontFace: FONT_HEAD, fontSize: 16, italic: true, color: OCHRE,
    valign: "top",
  });

  // Right side — closing block
  s.addText("Q & A", {
    x: 8.5, y: 1.0, w: 4.6, h: 1,
    fontFace: FONT_HEAD, fontSize: 60, bold: true, color: WHITE,
    align: "center", valign: "middle", charSpacing: 8,
  });
  s.addText("We'd love to answer\nyour questions.", {
    x: 8.5, y: 2.5, w: 4.6, h: 1,
    fontFace: FONT_HEAD, fontSize: 18, italic: true, color: WHITE,
    align: "center", valign: "middle",
  });

  // Bottom of right side
  s.addText("tribalmart.in", {
    x: 8.5, y: 5.2, w: 4.6, h: 0.6,
    fontFace: FONT_HEAD, fontSize: 22, bold: true, color: WHITE,
    align: "center",
  });
  s.addText("hello@tribalmart.in", {
    x: 8.5, y: 5.8, w: 4.6, h: 0.4,
    fontFace: FONT_BODY, fontSize: 13, color: WHITE,
    align: "center",
  });

  // Bottom band
  s.addShape("rect", {
    x: 0, y: SH - 0.5, w: 8.5, h: 0.5,
    fill: { color: OCHRE }, line: { type: "none" },
  });
  s.addText("TRIBAL MART  ·  v1.0  ·  Made with ❤ in India", {
    x: 0.3, y: SH - 0.5, w: 8, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: FG,
    valign: "middle", charSpacing: 3,
  });
}

// ── Write the file ──────────────────────────────────────
const OUT = "C:/Users/ramp2/OneDrive/Desktop/Tribal Mart/tribal-mart-main/docs/Tribal-Mart-Jury-Presentation.pptx";
pres.writeFile({ fileName: OUT }).then((f) => {
  console.log("PPTX written -> " + f);
});
