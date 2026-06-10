"""
Generates Tribal-Mart-Portal-Flows.pdf — a full architectural walkthrough
of the 4 portals (Customer / Agency / Agent / Admin) and how they interact.

Run:  python docs/generate_flow_pdf.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Flowable, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Line, String, Polygon, Circle
from reportlab.graphics import renderPDF

# ── Tribal palette ──────────────────────────────────────────
ACCENT       = colors.HexColor("#c0552c")  # terracotta
ACCENT_DARK  = colors.HexColor("#8e3b1a")
OCHRE        = colors.HexColor("#d99441")
OCHRE_DARK   = colors.HexColor("#b07020")
INDIGO       = colors.HexColor("#2e3a59")
FOREST       = colors.HexColor("#4a6a3a")
BG_CREAM     = colors.HexColor("#faf6f0")
BG_SOFT      = colors.HexColor("#f3ece1")
FG           = colors.HexColor("#1a1410")
FG_MID       = colors.HexColor("#5b4e44")
FG_LIGHT     = colors.HexColor("#8c7d70")
BORDER       = colors.HexColor("#d8ccba")
WHITE        = colors.white

PAGE_W, PAGE_H = A4

# ── Styles ──────────────────────────────────────────────────
styles = getSampleStyleSheet()

H_TITLE = ParagraphStyle(
    name="HTitle", parent=styles["Title"],
    fontName="Helvetica-Bold", fontSize=36, leading=40,
    textColor=FG, alignment=TA_LEFT, spaceAfter=4
)
H_SUBTITLE = ParagraphStyle(
    name="HSub", parent=styles["Normal"],
    fontName="Helvetica-Oblique", fontSize=14, leading=18,
    textColor=ACCENT, alignment=TA_LEFT, spaceAfter=20
)
H1 = ParagraphStyle(
    name="H1", parent=styles["Heading1"],
    fontName="Helvetica-Bold", fontSize=22, leading=26,
    textColor=FG, alignment=TA_LEFT, spaceBefore=6, spaceAfter=10
)
H2 = ParagraphStyle(
    name="H2", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=14, leading=18,
    textColor=ACCENT_DARK, alignment=TA_LEFT, spaceBefore=10, spaceAfter=6
)
H3 = ParagraphStyle(
    name="H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=FG, alignment=TA_LEFT, spaceBefore=6, spaceAfter=4
)
BODY = ParagraphStyle(
    name="Body", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, leading=14,
    textColor=FG_MID, alignment=TA_LEFT, spaceAfter=6
)
BODY_JUSTIFY = ParagraphStyle(
    name="BodyJustify", parent=BODY,
    alignment=TA_JUSTIFY
)
SMALL = ParagraphStyle(
    name="Small", parent=BODY,
    fontSize=8.5, leading=11, textColor=FG_LIGHT
)
TAG = ParagraphStyle(
    name="Tag", parent=BODY,
    fontName="Helvetica-Bold", fontSize=8, leading=10,
    textColor=ACCENT, alignment=TA_LEFT, spaceAfter=2
)
QUOTE = ParagraphStyle(
    name="Quote", parent=BODY,
    fontName="Helvetica-Oblique", fontSize=10.5, leading=15,
    textColor=FG_MID, leftIndent=10, rightIndent=10,
    borderColor=ACCENT, borderWidth=0, borderPadding=8,
    spaceBefore=6, spaceAfter=10,
)


# ── Custom flowables ────────────────────────────────────────
class HRule(Flowable):
    """Thin horizontal rule with terracotta gradient feel."""
    def __init__(self, width, height=2, color=ACCENT):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def wrap(self, *args):
        return (self.width, self.height + 4)

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 2, self.width * 0.5, self.height, fill=1, stroke=0)
        self.canv.setFillColor(OCHRE)
        self.canv.rect(self.width * 0.5, 2, self.width * 0.5, self.height, fill=1, stroke=0)


class PortalBadge(Flowable):
    """A bold portal name badge: rounded pill with role color."""
    def __init__(self, label, color, w=140, h=24):
        super().__init__()
        self.label = label
        self.color = color
        self.w = w
        self.h = h

    def wrap(self, *args):
        return (self.w, self.h + 4)

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        c.roundRect(0, 0, self.w, self.h, self.h / 2, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(self.w / 2, self.h / 2 - 3.2, self.label.upper())


class PortalCard(Flowable):
    """A box describing one portal with its key abilities."""
    def __init__(self, name, role_color, icon, tagline, bullets, w=None):
        super().__init__()
        self.name = name
        self.role_color = role_color
        self.icon = icon
        self.tagline = tagline
        self.bullets = bullets
        self.w = w or (PAGE_W - 2 * 20 * mm)
        self._h = None

    def _measure(self):
        # 14 px title + tagline + ~12 per bullet
        return 22 + 18 + 14 * len(self.bullets) + 16

    def wrap(self, *args):
        if self._h is None:
            self._h = self._measure()
        return (self.w, self._h)

    def draw(self):
        c = self.canv
        # Background
        c.setFillColor(WHITE)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.6)
        c.roundRect(0, 0, self.w, self._h, 8, fill=1, stroke=1)
        # Left color bar
        c.setFillColor(self.role_color)
        c.rect(0, 0, 5, self._h, fill=1, stroke=0)
        # Icon + name
        c.setFillColor(self.role_color)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(20, self._h - 22, self.icon)
        c.setFillColor(FG)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(48, self._h - 22, self.name)
        # Tagline
        c.setFillColor(FG_MID)
        c.setFont("Helvetica-Oblique", 9.5)
        c.drawString(20, self._h - 38, self.tagline)
        # Bullets
        c.setFillColor(FG)
        c.setFont("Helvetica", 9.5)
        y = self._h - 56
        for b in self.bullets:
            c.setFillColor(self.role_color)
            c.circle(24, y + 3.5, 1.6, fill=1, stroke=0)
            c.setFillColor(FG)
            c.drawString(32, y, b)
            y -= 14


class FlowStep(Flowable):
    """A numbered step in a workflow."""
    def __init__(self, n, color, title, sub, w=None):
        super().__init__()
        self.n = n
        self.color = color
        self.title = title
        self.sub = sub
        self.w = w or (PAGE_W - 2 * 20 * mm)
        self._h = 50

    def wrap(self, *args):
        # Estimate sub lines
        approx_chars_per_line = 95
        sub_lines = max(1, (len(self.sub) // approx_chars_per_line) + 1)
        self._h = 28 + 12 * sub_lines
        return (self.w, self._h + 4)

    def draw(self):
        c = self.canv
        # Number badge
        c.setFillColor(self.color)
        c.circle(14, self._h - 12, 11, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(14, self._h - 16, str(self.n))
        # Title
        c.setFillColor(FG)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(36, self._h - 14, self.title)
        # Sub
        c.setFillColor(FG_MID)
        c.setFont("Helvetica", 9.5)
        # Simple wrap
        words = self.sub.split()
        line = ""
        y_off = self._h - 28
        max_w = self.w - 40
        for w in words:
            test = (line + " " + w).strip()
            if c.stringWidth(test, "Helvetica", 9.5) <= max_w:
                line = test
            else:
                c.drawString(36, y_off, line)
                line = w
                y_off -= 12
        if line:
            c.drawString(36, y_off, line)


class InteractionDiagram(Flowable):
    """Visual diagram of all 4 portals and their interactions."""
    def __init__(self, w=None, h=420):
        super().__init__()
        self.w = w or (PAGE_W - 2 * 20 * mm)
        self.h = h

    def wrap(self, *args):
        return (self.w, self.h)

    def _node(self, c, x, y, w, h, label, sub, color):
        c.setFillColor(color)
        c.setStrokeColor(color)
        c.roundRect(x, y, w, h, 10, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(x + w / 2, y + h - 22, label)
        c.setFont("Helvetica", 9)
        c.drawCentredString(x + w / 2, y + h - 38, sub)

    def _arrow(self, c, x1, y1, x2, y2, label="", color=FG_LIGHT, dashed=False):
        c.setStrokeColor(color)
        c.setLineWidth(1.2)
        if dashed:
            c.setDash(2, 2)
        c.line(x1, y1, x2, y2)
        c.setDash()
        # Arrowhead
        import math
        ang = math.atan2(y2 - y1, x2 - x1)
        ah = 6
        c.setFillColor(color)
        p = c.beginPath()
        p.moveTo(x2, y2)
        p.lineTo(x2 - ah * math.cos(ang - math.pi / 7), y2 - ah * math.sin(ang - math.pi / 7))
        p.lineTo(x2 - ah * math.cos(ang + math.pi / 7), y2 - ah * math.sin(ang + math.pi / 7))
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        # Label
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            c.setFillColor(WHITE)
            tw = c.stringWidth(label, "Helvetica-Bold", 7.5) + 6
            c.rect(mx - tw / 2, my - 4, tw, 9, fill=1, stroke=0)
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 7.5)
            c.drawCentredString(mx, my - 2, label)

    def draw(self):
        c = self.canv
        # Layout (4 corners)
        node_w, node_h = 130, 60
        cx, cy = self.w / 2, self.h / 2
        # Top-left: Customer
        cust = (cx - 200, cy + 80)
        agency = (cx + 70, cy + 80)
        agent = (cx + 70, cy - 140)
        admin = (cx - 200, cy - 140)

        # Draw central title
        c.setFillColor(FG)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(cx, cy + 6, "TRIBAL MART")
        c.setFillColor(FG_LIGHT)
        c.setFont("Helvetica", 8)
        c.drawCentredString(cx, cy - 8, "marketplace platform")

        # Nodes
        self._node(c, cust[0], cust[1], node_w, node_h, "Customer", "buys craft", INDIGO)
        self._node(c, agency[0], agency[1], node_w, node_h, "Agency", "tribal cooperative", OCHRE)
        self._node(c, agent[0], agent[1], node_w, node_h, "Agent", "digital helper", ACCENT)
        self._node(c, admin[0], admin[1], node_w, node_h, "Admin", "platform steward", FG)

        # Helper to compute edge midpoints
        def cb(p):  # center bottom
            return (p[0] + node_w / 2, p[1])
        def ct(p):  # center top
            return (p[0] + node_w / 2, p[1] + node_h)
        def cl(p):  # center left
            return (p[0], p[1] + node_h / 2)
        def cr(p):  # center right
            return (p[0] + node_w, p[1] + node_h / 2)

        # Customer ↔ Agency: buys / ships
        self._arrow(c, cr(cust)[0], cr(cust)[1] + 6, cl(agency)[0], cl(agency)[1] + 6,
                    "buys", ACCENT)
        self._arrow(c, cl(agency)[0], cl(agency)[1] - 6, cr(cust)[0], cr(cust)[1] - 6,
                    "ships", FOREST)

        # Agency ↔ Agent: requests help / approves
        self._arrow(c, cb(agency)[0] - 6, cb(agency)[1], ct(agent)[0] - 6, ct(agent)[1],
                    "requests help", ACCENT)
        self._arrow(c, ct(agent)[0] + 6, ct(agent)[1], cb(agency)[0] + 6, cb(agency)[1],
                    "lists products", OCHRE)

        # Admin ↔ Agency: approves docs / settles
        self._arrow(c, cr(admin)[0], cr(admin)[1] + 8, cl(agency)[0] - 70, cl(agency)[1] + 8,
                    "approves listings", FOREST, dashed=True)
        # bend it to agency from below
        # Admin → Customer
        self._arrow(c, ct(admin)[0], ct(admin)[1], cb(cust)[0], cb(cust)[1],
                    "moderates", FG, dashed=True)

        # Agent → Admin (via Agency → eventually admin queue)
        self._arrow(c, cl(agent)[0], cl(agent)[1], cr(admin)[0], cr(admin)[1] - 10,
                    "via agency", FG_LIGHT, dashed=True)

        # Border
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, self.w, self.h, 12, fill=0, stroke=1)


class FlowChainBox(Flowable):
    """A horizontal chain of status pills with arrows between them."""
    def __init__(self, steps, w=None):
        super().__init__()
        self.steps = steps  # list of (label, color)
        self.w = w or (PAGE_W - 2 * 20 * mm)
        self.h = 56

    def wrap(self, *args):
        return (self.w, self.h + 4)

    def draw(self):
        c = self.canv
        n = len(self.steps)
        gap = 12
        pill_w = (self.w - gap * (n - 1)) / n
        pill_h = 32
        y = (self.h - pill_h) / 2 + 10
        x = 0
        for i, (lbl, color) in enumerate(self.steps):
            c.setFillColor(color)
            c.roundRect(x, y, pill_w, pill_h, pill_h / 2, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 9)
            # word-wrap if too long
            if c.stringWidth(lbl, "Helvetica-Bold", 9) > pill_w - 14:
                # try splitting on space
                if " " in lbl:
                    parts = lbl.split(" ", 1)
                    c.drawCentredString(x + pill_w / 2, y + pill_h - 11, parts[0])
                    c.drawCentredString(x + pill_w / 2, y + pill_h - 22, parts[1])
                else:
                    c.setFont("Helvetica-Bold", 7.5)
                    c.drawCentredString(x + pill_w / 2, y + pill_h / 2 - 3, lbl)
            else:
                c.drawCentredString(x + pill_w / 2, y + pill_h / 2 - 3, lbl)
            if i < n - 1:
                # Arrow
                ax = x + pill_w + 1
                ay = y + pill_h / 2
                c.setStrokeColor(FG_LIGHT)
                c.setLineWidth(1.2)
                c.line(ax, ay, ax + gap - 2, ay)
                # arrow head
                c.setFillColor(FG_LIGHT)
                p = c.beginPath()
                p.moveTo(ax + gap - 2, ay)
                p.lineTo(ax + gap - 6, ay + 3)
                p.lineTo(ax + gap - 6, ay - 3)
                p.close()
                c.drawPath(p, fill=1, stroke=0)
            x += pill_w + gap


# ── Page decoration (background pattern + header/footer) ────
def page_decoration(canvas_obj, doc):
    canvas_obj.saveState()
    # Background cream
    canvas_obj.setFillColor(BG_CREAM)
    canvas_obj.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Header band
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.rect(0, PAGE_H - 8, PAGE_W * 0.4, 8, fill=1, stroke=0)
    canvas_obj.setFillColor(OCHRE)
    canvas_obj.rect(PAGE_W * 0.4, PAGE_H - 8, PAGE_W * 0.6, 8, fill=1, stroke=0)
    # Brand
    canvas_obj.setFillColor(FG)
    canvas_obj.setFont("Helvetica-Bold", 10)
    canvas_obj.drawString(20 * mm, PAGE_H - 20, "TRIBAL MART")
    canvas_obj.setFillColor(FG_LIGHT)
    canvas_obj.setFont("Helvetica-Oblique", 9)
    canvas_obj.drawString(20 * mm + 75, PAGE_H - 20, "Portal flow & architecture document")
    # Page number
    canvas_obj.setFillColor(FG_LIGHT)
    canvas_obj.setFont("Helvetica", 8.5)
    canvas_obj.drawRightString(PAGE_W - 20 * mm, 12 * mm, f"Page {doc.page}")
    canvas_obj.drawString(20 * mm, 12 * mm, "tribalmart.in")
    # Bottom band
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.4)
    canvas_obj.line(20 * mm, 16 * mm, PAGE_W - 20 * mm, 16 * mm)
    canvas_obj.restoreState()


def cover_decoration(canvas_obj, doc):
    """Different look for the cover page."""
    canvas_obj.saveState()
    # Full cream background
    canvas_obj.setFillColor(BG_CREAM)
    canvas_obj.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Large terracotta block top
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.rect(0, PAGE_H - 220, PAGE_W, 220, fill=1, stroke=0)
    # Ochre stripe
    canvas_obj.setFillColor(OCHRE)
    canvas_obj.rect(0, PAGE_H - 240, PAGE_W, 20, fill=1, stroke=0)
    # Diamond pattern overlay (simple grid of small diamonds)
    canvas_obj.setStrokeColor(colors.HexColor("#8e3b1a"))
    canvas_obj.setFillColor(colors.HexColor("#8e3b1a"))
    canvas_obj.setLineWidth(0.4)
    for row in range(0, 220, 30):
        for col in range(0, int(PAGE_W) + 30, 40):
            cx, cy = col, PAGE_H - 240 + 20 + row + 15
            d = 5
            p = canvas_obj.beginPath()
            p.moveTo(cx, cy + d)
            p.lineTo(cx + d, cy)
            p.lineTo(cx, cy - d)
            p.lineTo(cx - d, cy)
            p.close()
            canvas_obj.setFillAlpha(0.18)
            canvas_obj.drawPath(p, fill=1, stroke=0)
    canvas_obj.setFillAlpha(1)
    # Bottom band
    canvas_obj.setFillColor(FG)
    canvas_obj.rect(0, 0, PAGE_W, 60, fill=1, stroke=0)
    canvas_obj.setFillColor(OCHRE)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(20 * mm, 25, "BUILT FOR INDIA'S TRIBAL COOPERATIVES")
    canvas_obj.setFillColor(WHITE)
    canvas_obj.setFont("Helvetica", 8.5)
    canvas_obj.drawRightString(PAGE_W - 20 * mm, 25, "v1.0 · MIT License · 2026")
    canvas_obj.restoreState()


# ── Story builder ───────────────────────────────────────────
def build_story():
    story = []

    # ── COVER ──────────────────────────────────────────────
    story.append(Spacer(1, 100))
    cover_title = ParagraphStyle(
        name="CoverTitle", fontName="Helvetica-Bold", fontSize=58,
        leading=64, textColor=WHITE, alignment=TA_LEFT
    )
    cover_tagline = ParagraphStyle(
        name="CoverTagline", fontName="Helvetica-Oblique", fontSize=18,
        leading=22, textColor=WHITE, alignment=TA_LEFT, spaceBefore=8
    )
    story.append(Paragraph("Tribal<br/>Mart", cover_title))
    story.append(Paragraph("Portal flow &amp; interaction architecture", cover_tagline))
    story.append(Spacer(1, 240))

    cover_intro = ParagraphStyle(
        name="CoverIntro", fontName="Helvetica", fontSize=11.5,
        leading=17, textColor=FG, alignment=TA_LEFT
    )
    story.append(Paragraph(
        "A four-portal marketplace connecting India's tribal artisan cooperatives "
        "with conscious buyers — featuring an Agent-assisted listing workflow and "
        "an instant Hindi/English language switch for the people who actually craft "
        "the goods sold here.",
        cover_intro
    ))
    story.append(Spacer(1, 20))
    story.append(HRule(160, height=3))
    story.append(Spacer(1, 12))

    cover_meta = ParagraphStyle(
        name="CoverMeta", fontName="Helvetica-Bold", fontSize=9.5,
        leading=14, textColor=ACCENT, alignment=TA_LEFT
    )
    story.append(Paragraph("CONTENTS", cover_meta))
    cover_list = ParagraphStyle(
        name="CoverList", fontName="Helvetica", fontSize=10,
        leading=15, textColor=FG_MID, alignment=TA_LEFT
    )
    for line in [
        "01 — The four portals at a glance",
        "02 — Customer flow",
        "03 — Agency flow",
        "04 — Agent flow",
        "05 — Admin flow",
        "06 — Cross-portal interaction map",
        "07 — Product status state machine",
        "08 — Order lifecycle",
        "09 — Return / refund flow",
        "10 — Data model & API summary",
        "11 — Demo accounts & quick-start",
    ]:
        story.append(Paragraph(line, cover_list))

    story.append(PageBreak())

    # ── 01 — Four portals ──────────────────────────────────
    story.append(Spacer(1, 12))
    story.append(Paragraph("01 — The four portals", H_TITLE))
    story.append(Paragraph("One platform, four distinct roles.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Most marketplaces have two sides — buyer and seller. Tribal Mart introduces a "
        "third: an Agent who can list and manage products on behalf of artisans who "
        "may not be comfortable with digital tools. This bridges a real-world gap for "
        "older tribal craftspeople — their craft reaches the world while the digital "
        "work is handled with their consent.",
        BODY_JUSTIFY
    ))
    story.append(Spacer(1, 10))

    portal_cards = [
        PortalCard("Customer", INDIGO, "🛍️",
                   "Anyone buying authentic tribal craft.",
                   [
                       "Browse, search, filter by category / price",
                       "Cart (multi-item) + saved addresses + payment methods",
                       "Order tracking timeline with cancel + reorder + invoice",
                       "Reviews after delivery; returns within 7 days",
                       "Watchlist, Compare (up to 4 products), Profile",
                   ]),
        PortalCard("Agency", OCHRE_DARK, "🪔",
                   "Tribal cooperatives and studios — the sellers.",
                   [
                       "Add / edit / duplicate / delete products",
                       "Fulfil orders: confirm → process → ship + tracking + packing slip",
                       "Returns review, payouts dashboard, analytics",
                       "Hindi ⇄ English instant toggle across the portal",
                       "Request agent help when digital work is too much",
                   ]),
        PortalCard("Agent", ACCENT, "🤝",
                   "Digital helpers for tribal cooperatives.",
                   [
                       "See incoming agency help requests, approve to manage",
                       "List products on behalf of managed cooperatives",
                       "Drill into per-agency stats, orders, and listings",
                       "Earn 5% commission on every approved sale of their listings",
                       "Step down from an agency anytime",
                   ]),
        PortalCard("Admin", FG, "🛡️",
                   "Platform stewards keeping the marketplace honest.",
                   [
                       "Approve / reject listings (single or bulk) + verify KYC docs",
                       "Manage users (suspend / activate / detail view)",
                       "Curate featured products, manage categories",
                       "Financial dashboard: GMV, commission, GST, payable",
                       "Settle payouts to cooperatives + view audit trail",
                   ]),
    ]
    for card in portal_cards:
        story.append(card)
        story.append(Spacer(1, 10))

    story.append(PageBreak())

    # ── 02 — Customer flow ────────────────────────────────
    story.append(Paragraph("02 — Customer flow", H_TITLE))
    story.append(Paragraph("From discovery to delivery to review.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 6))

    steps_customer = [
        (1, "Sign up / log in",
         "Pick the Customer portal from the 4-card chooser. Sign up with name + email + password; log-in routes to /dashboard/customer."),
        (2, "Browse & search",
         "Filter by category, price range, or keyword. Search hits /api/products/all?search=..."),
        (3, "Product detail",
         "View images, price, condition, agency name (with verified badge if their docs are approved), and reviews. Click agency name → opens their public store."),
        (4, "Cart / Buy now",
         "Add to cart (multi-item) OR Buy Now directly. The cart auto-loads on /cart."),
        (5, "Checkout",
         "Saved addresses pre-fill automatically. Pick payment: COD or Razorpay online. Order placed → cart cleared, redirect to /orders."),
        (6, "Track order",
         "Status timeline: placed → confirmed → processing → shipped → delivered. Customer can cancel before shipping; download invoice anytime."),
        (7, "Review",
         "After delivery, write a star rating + comment from /product/:id. Shows on the product page for future buyers."),
        (8, "Return (within 7 days)",
         "Optional. Customer opens a return with reason; goes to /returns. Agency approves → marks refunded once the return is shipped back."),
        (9, "Reorder",
         "One click on any past order's modal refills the cart with the same items."),
    ]
    for n, t, s in steps_customer:
        story.append(FlowStep(n, INDIGO, t, s))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ── 03 — Agency flow ──────────────────────────────────
    story.append(Paragraph("03 — Agency flow", H_TITLE))
    story.append(Paragraph("List, fulfil, earn — in Hindi or English.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 6))

    steps_agency = [
        (1, "Sign up",
         "Agency creates account → uploads verification documents (Business License, Tax Certificate, Authorization Letter)."),
        (2, "Document approval",
         "Admin reviews → on approval, agency earns a Verified Cooperative badge displayed on their listings and storefront."),
        (3, "Add product",
         "Title, description, category, original/selling price, quantity, condition, images. Status starts as 'pending'."),
        (4, "Request agent help (optional)",
         "From dashboard quick action → browse agents → send a request with agency address. Agent decides to accept or decline."),
        (5, "Manage listings",
         "My Products: filter by status, edit, duplicate, delete, low-stock pill when qty ≤ 3, preview as a customer."),
        (6, "Fulfil orders",
         "Agency Orders: see incoming orders, mark Confirmed → Processing → Shipped (add tracking note) → Delivered. Print a packing slip with barcode."),
        (7, "Handle returns",
         "Customer-initiated returns appear under /returns. Approve, receive item, mark Refunded."),
        (8, "Analytics & payouts",
         "Real-time stats on revenue, conversion, top categories. Payouts page shows gross sales → 10% commission → 18% GST → net payable, with weekly settlement schedule."),
        (9, "Hindi mode",
         "EN/हिं toggle in the dashboard hero swaps the entire portal — sidebar, stats, actions, all instantly translated."),
    ]
    for n, t, s in steps_agency:
        story.append(FlowStep(n, OCHRE_DARK, t, s))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ── 04 — Agent flow ──────────────────────────────────
    story.append(Paragraph("04 — Agent flow", H_TITLE))
    story.append(Paragraph("Helping artisans go digital — and earning while doing it.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 6))

    steps_agent = [
        (1, "Sign up",
         "Pick Agent portal → sign up with name + email + password + address. Address is shown to agencies considering their help."),
        (2, "Receive agency requests",
         "Dashboard shows incoming help requests from agencies. Each request includes the agency's name, address, and how long they've been waiting."),
        (3, "Approve / reject",
         "Approve → agency moves to your Managed Agencies. Reject (with reason) → agency is notified to find another agent."),
        (4, "List products for them",
         "From dashboard, click 'List for them' on an agency row — opens AddProduct with the agency pre-selected. Product status starts at 'pending_agency_approval'."),
        (5, "Agency reviews",
         "The agency sees the agent-listed product in their dashboard with Approve/Reject buttons. On approval, status → 'pending' (admin queue). On rejection, status → 'rejected_by_agency'."),
        (6, "Edit / delete own listings",
         "Agent can modify or remove only listings they uploaded — never the agency's own listings."),
        (7, "Per-agency drill-down",
         "Click any managed agency to see their catalogue, orders, and stats — plus your own contribution (products listed, sold, live)."),
        (8, "Track earnings",
         "Agent Earnings page: 5% commission on every approved sale of products the agent uploaded. Per-agency breakdown showing productsListed / sold / live / revenue / commission."),
        (9, "Step down",
         "Any agent can step down from an agency from the drilldown page. Agency becomes available for another agent."),
    ]
    for n, t, s in steps_agent:
        story.append(FlowStep(n, ACCENT, t, s))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ── 05 — Admin flow ──────────────────────────────────
    story.append(Paragraph("05 — Admin flow", H_TITLE))
    story.append(Paragraph("Stewardship: approve, verify, settle, audit.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 6))

    steps_admin = [
        (1, "Dashboard",
         "Live counts of total products, pending approvals, approved live, total users. Quick-action cards for the four most common admin tasks."),
        (2, "Pending product queue",
         "Review each pending listing: image, title, description, price, agency. Approve, reject (with reason), or use checkboxes to bulk approve / reject."),
        (3, "Document approval",
         "Inline preview of uploaded KYC documents (Business License, Tax Certificate, Authorization Letter). Approve to verify the agency — they get a Verified badge."),
        (4, "User management",
         "List of all users grouped by role. Click any user to view detail: their orders, products, messages, agent relations. Suspend / activate / delete from the table."),
        (5, "Featured products",
         "On the All Products page, click ⭐ on any approved product to mark it as Featured. Featured listings appear in the landing-page 'Handpicked this week' section."),
        (6, "Categories",
         "Add or remove product categories. Reflected in agency Add Product dropdown and customer browse filters."),
        (7, "Analytics",
         "Platform-wide metrics: orders, GMV, conversion, top categories, top agencies, monthly trend."),
        (8, "Financial dashboard",
         "GMV → 10% commission → 18% GST → payable to cooperatives. Per-agency settlement table with Mark Paid buttons. Tracks platform revenue."),
        (9, "Settle payouts",
         "Click Mark Paid on each settlement row — agency gets credited via UPI / bank transfer (out-of-band in v1)."),
    ]
    for n, t, s in steps_admin:
        story.append(FlowStep(n, FG, t, s))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ── 06 — Cross-portal interaction map ──────────────
    story.append(Paragraph("06 — Cross-portal interaction map", H_TITLE))
    story.append(Paragraph("How the four panels talk to each other.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 14))
    story.append(InteractionDiagram())
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "Solid arrows = direct human-initiated actions. Dashed arrows = "
        "moderation / oversight by Admin. Two-way arrows where each role responds to the other.",
        SMALL
    ))
    story.append(Spacer(1, 16))
    story.append(Paragraph("The full lifecycle of an agent-listed product", H2))

    chain = FlowChainBox([
        ("Agent lists", ACCENT),
        ("pending agency approval", OCHRE_DARK),
        ("Agency approves", OCHRE),
        ("pending", colors.HexColor("#c08a2c")),
        ("Admin approves", FOREST),
        ("approved (live)", FOREST),
        ("Customer buys", INDIGO),
        ("sold", colors.HexColor("#2e3a59")),
    ])
    story.append(chain)
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Each transition emits the next state on the Product document. Every actor can only act on states they're allowed to — guarded by role middleware and ownership checks on the backend.",
        BODY_JUSTIFY
    ))

    story.append(PageBreak())

    # ── 07 — Product status state machine ──────────────
    story.append(Paragraph("07 — Product status state machine", H_TITLE))
    story.append(Paragraph("Every state, every actor, every transition.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 10))

    state_table_data = [
        ["Status", "Who can set it", "Description"],
        ["pending_agency_approval", "Agent", "Newly listed by an agent — awaiting the agency's nod."],
        ["pending", "Agency · Admin", "Agency-approved or agency-created; awaiting admin."],
        ["approved", "Admin", "Live on the marketplace; visible to customers."],
        ["rejected", "Admin", "Admin declined — agency sees the rejection reason."],
        ["rejected_by_agency", "Agency", "Agency declined an agent's submission."],
        ["sold", "Order system", "Inventory depleted via a customer purchase."],
    ]
    st_table = Table(state_table_data, colWidths=[120, 110, 280])
    st_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FG),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TEXTCOLOR", (0, 1), (-1, -1), FG),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BG_SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(st_table)
    story.append(Spacer(1, 16))

    # ── 08 — Order lifecycle ────────────────────────────
    story.append(Paragraph("08 — Order lifecycle", H2))
    story.append(Spacer(1, 4))
    story.append(FlowChainBox([
        ("Placed", colors.HexColor("#c08a2c")),
        ("Confirmed", colors.HexColor("#c08a2c")),
        ("Processing", INDIGO),
        ("Shipped", INDIGO),
        ("Delivered", FOREST),
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Each status change is timestamped and pushed into the order's <b>trackingUpdates</b> array. "
        "The customer sees the timeline live on their Orders page; the agency triggers each "
        "transition from their Order detail modal.",
        BODY_JUSTIFY
    ))
    story.append(Spacer(1, 14))

    # ── 09 — Returns ────────────────────────────────────
    story.append(Paragraph("09 — Return / refund flow", H2))
    story.append(Spacer(1, 4))
    story.append(FlowChainBox([
        ("Requested", colors.HexColor("#c08a2c")),
        ("Approved", FOREST),
        ("Received", INDIGO),
        ("Refunded", FOREST),
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Initiated by the customer on a delivered order. The owning agency reviews, approves, "
        "receives the physical return, and marks it refunded. Every transition appends to "
        "the return's timeline and notifies the relevant party.",
        BODY_JUSTIFY
    ))

    story.append(PageBreak())

    # ── 10 — Data model + API ──────────────────────────
    story.append(Paragraph("10 — Data model &amp; API", H_TITLE))
    story.append(Paragraph("What's stored, what's exposed.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Core models", H2))
    models_data = [
        ["Model", "Notable fields"],
        ["User", "name, email, password, role (agency / customer / admin / agent), address, addresses[], paymentMethods[], avatarUrl, agent (ref User), status"],
        ["Product", "title, description, category, originalPrice, sellingPrice, quantity, condition, images[], agency (ref), agencyName, uploadedByAgent (ref), status, featured, soldDate"],
        ["Order", "orderNumber, customer (ref), customerName, agency (ref), items[], shippingAddress, totalAmount, paymentMethod, paymentStatus, orderStatus, trackingUpdates[]"],
        ["Cart", "customer (ref), items[ { product, quantity, addedAt } ] (computed totals on read)"],
        ["Wishlist", "customer (ref), items[ product (ref) ]"],
        ["Document", "agency (ref), businessLicense, taxCertificate, authorizationLetter, status, reviewedAt"],
        ["AgentRequest", "agency (ref), agent (ref), agencyName, agencyAddress, status (pending/approved/rejected), rejectionReason"],
        ["Review", "product (ref), customer (ref), customerName, rating (1-5), comment (max 1000 chars)"],
        ["Return", "order (ref), customer (ref), agency (ref), items[], reason, status, refundAmount, timeline[]"],
        ["Sale", "agency (ref), amount, createdAt (used for sales analytics)"],
        ["Message", "from (ref), to (ref), subject, body, threadId"],
    ]
    model_table = Table(models_data, colWidths=[90, 420])
    model_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FG),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), FG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BG_SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
    ]))
    story.append(model_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("API surface (high-level)", H2))
    api_data = [
        ["Group", "Sample routes"],
        ["Auth (public)", "POST /api/auth/register · POST /api/auth/login"],
        ["Products (public)", "GET /api/products/all (search, filters) · GET /:id · GET /store/:agencyId · GET /featured/list"],
        ["Reviews (public)", "GET /api/reviews/:productId"],
        ["Customer", "/api/customer/cart · /api/customer/wishlist · /api/orders · /api/profile/addresses · /api/profile/payment-methods · POST /api/profile/avatar · POST /api/reviews · POST /api/returns"],
        ["Agency", "POST /api/products · /api/products/agent-uploads-pending · /api/orders/agency-orders · /api/agents/requests · /api/returns/agency · /api/products/analytics"],
        ["Agent", "/api/agents/requests/incoming · /api/agents/managed-agencies · /api/agents/earnings · POST /api/products (with agencyId)"],
        ["Admin", "/api/admin/dashboard-stats · /api/admin/pending-products · /api/admin/all-products · /api/admin/users · /api/admin/users/:id · /api/admin/categories · /api/admin/featured · /api/admin/financial-summary"],
    ]
    api_table = Table(api_data, colWidths=[90, 420])
    api_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("FONTNAME", (0, 1), (-1, -1), "Courier"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), FG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BG_SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), OCHRE_DARK),
    ]))
    story.append(api_table)

    story.append(PageBreak())

    # ── 11 — Demo accounts & quick start ───────────────
    story.append(Paragraph("11 — Demo accounts &amp; quick-start", H_TITLE))
    story.append(Paragraph("Everything you need to run the live demo.", H_SUBTITLE))
    story.append(HRule(120))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Demo accounts", H2))
    accounts = [
        ["Role", "Email", "Password"],
        ["Admin", "admin@setu.com", "admin123"],
        ["Agency (with managing agent)", "agency@demo.com", "demo123"],
        ["Agency (no agent)", "santhal@demo.com", "demo123"],
        ["Agent (manages Bhil agency)", "agent@demo.com", "demo123"],
        ["Customer (has reviews)", "customer@demo.com", "demo123"],
        ["Customer 2", "rohan@demo.com", "demo123"],
    ]
    acc_table = Table(accounts, colWidths=[200, 180, 130])
    acc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FG),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BG_SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("FONTNAME", (1, 1), (1, -1), "Courier"),
        ("FONTNAME", (2, 1), (2, -1), "Courier"),
        ("TEXTCOLOR", (1, 1), (1, -1), ACCENT),
    ]))
    story.append(acc_table)
    story.append(Spacer(1, 18))

    story.append(Paragraph("Run locally", H2))
    code_style = ParagraphStyle(
        name="Code", fontName="Courier", fontSize=9, leading=12,
        textColor=FG, backColor=BG_SOFT, borderColor=BORDER,
        borderWidth=0.5, borderPadding=8, leftIndent=0, rightIndent=0,
        spaceBefore=4, spaceAfter=8
    )
    story.append(Paragraph(
        "git clone &lt;repo&gt; tribal-mart<br/>"
        "cd tribal-mart<br/>"
        "cd backend &amp;&amp; npm install &amp;&amp; cp .env.example .env<br/>"
        "# fill MONGO_URI and JWT_SECRET in backend/.env<br/>"
        "node scripts/seedAdmin.js &amp;&amp; node scripts/seedDemo.js<br/>"
        "npm start<br/>"
        "<br/>"
        "# in another terminal<br/>"
        "cd frontend &amp;&amp; npm install &amp;&amp; cp .env.example .env<br/>"
        "npm run dev<br/>"
        "# open http://localhost:3000",
        code_style
    ))

    story.append(Paragraph("Suggested demo flow (60 seconds)", H2))
    flow_data = [
        ["#", "Action"],
        ["1", "Land on /  → hover the card stack, scroll past Hero / Makers / Stats."],
        ["2", "Click Sign Up → see the 4-portal selector → click Agent → split-card slides."],
        ["3", "Log in as customer@demo.com → tour dashboard → Browse → Add to Cart → Checkout."],
        ["4", "Log in as agency@demo.com → click  EN/हिं  toggle — entire UI flips to Hindi."],
        ["5", "Open My Products → 📑 Duplicate. Orders → mark Shipped → print Packing Slip."],
        ["6", "Open Payouts — see GMV → commission → GST → net payable."],
        ["7", "Log in as agent@demo.com → see incoming requests → drill into a managed agency."],
        ["8", "Log in as admin@setu.com → Pending Products → check 3 → Bulk Approve. Finance → settle. Categories → add 'Pottery'."],
    ]
    flow_table = Table(flow_data, colWidths=[30, 480])
    flow_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BG_SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(flow_table)

    story.append(Spacer(1, 18))
    story.append(HRule(80, height=2))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Made with care for India's tribal artisan communities — Bhil, Santhal, Munda, Toda, "
        "Gond, and many others — whose craft deserves a marketplace that respects their pace, "
        "their language, and their dignity.",
        ParagraphStyle(name="Closing", parent=BODY, fontName="Helvetica-Oblique",
                       textColor=ACCENT, fontSize=10.5, leading=15, alignment=TA_CENTER)
    ))

    return story


def main():
    output = "C:/Users/ramp2/OneDrive/Desktop/Tribal Mart/tribal-mart-main/docs/Tribal-Mart-Portal-Flows.pdf"
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=25 * mm,
        bottomMargin=22 * mm,
        title="Tribal Mart — Portal Flow & Architecture",
        author="Tribal Mart",
        subject="Four-portal marketplace flow document",
        keywords="tribal mart, marketplace, portals, flow, architecture",
    )

    story = build_story()

    def on_first_page(canv, doc):
        cover_decoration(canv, doc)

    def on_later_pages(canv, doc):
        page_decoration(canv, doc)

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print(f"PDF written -> {output}")


if __name__ == "__main__":
    main()
