import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import { askGemini, askGeminiRaw } from '../services/gemini';
import './ChatBot.css';

/* ────────────────────────────────────────────────────────────────
 * Saathi — the floating chatbot. Mounted once at the App root so it
 * appears on every page (landing + all 4 portals).
 *
 * Handles, deterministically:
 *   • Order tracking by ID/order number  → /api/orders/track/:id
 *   • "Gift" intent → carousel of curated products from /api/products/all
 *   • "Browse" / "shop" → routes to /browse
 *   • Auth-aware ordering → if guest, sends to /login/customer?next=/orders
 *
 * Everything else falls through to Gemini Flash 2.5.
 * ──────────────────────────────────────────────────────────────── */

const ORDER_ID_RE = /\b([0-9a-fA-F]{24}|TM-?\d{4,}|ORD-?\d{4,})\b/;
const isHindi = (s) => /[ऀ-ॿ]/.test(s || '');

const ChatBot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      kind: 'text',
      text: "Namaste! I'm Saathi 🌾 — your Tribal Mart helper. Track an order, find a thoughtful gift, or just ask me anything.",
    },
    {
      from: 'bot',
      kind: 'chips',
      chips: [
        { label: '📦 Track my order', value: 'track my order' },
        { label: '🎁 Gift something special', value: 'show me gifts' },
        { label: '🛍️ Browse craft', value: 'browse products' },
        { label: '💬 How does this work?', value: 'How does Tribal Mart work?' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Hide on login/signup pages — nothing useful there
  const hidden = /^\/(login|signup)/.test(location.pathname);
  if (hidden) return null;

  const isLoggedIn = !!localStorage.getItem('token');
  const role = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')?.role || null;
    } catch (_) {
      return null;
    }
  })();

  const push = (msg) => setMessages((m) => [...m, msg]);

  const handleSend = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput('');
    push({ from: 'user', kind: 'text', text });
    setBusy(true);

    try {
      const lower = text.toLowerCase();

      // 1) Order ID pattern → look up status
      const m = text.match(ORDER_ID_RE);
      if (m) {
        await handleTrack(m[1]);
        return;
      }

      // 2) Track intent without an ID yet
      if (/\b(track|status|where.*order|order.*status|kahan|kahaan|kab aayega)\b/i.test(text)) {
        push({
          from: 'bot',
          kind: 'text',
          text: 'Sure — share your **Order ID** (looks like `TM-1234` or a long hex code) and I\'ll fetch its status.',
        });
        return;
      }

      // 3) Gift / product discovery intent → show matching cards.
      //    We pass the FULL user message so handleGifts can semantically
      //    match products against the description (e.g. "containers to
      //    store things" → woven baskets, terracotta jars, etc.)
      const giftRe = /\b(gift|gifts|present|birthday|anniversary|for someone|for my|tohfa|उपहार|gift kar)\b/i;
      const discoveryRe = /\b(what products|what do you have|looking for|need|recommend|suggest|show me|find me)\b/i;
      if (giftRe.test(text) || discoveryRe.test(text)) {
        await handleGifts(text);
        return;
      }

      // 4) Browse / shop — show the catalogue inline, then offer a
      // link to the full Browse Craft page (with auth-aware redirect)
      if (/^(browse|shop|see products|view products|products|catalogue|catalog)/i.test(text)) {
        await handleBrowse();
        return;
      }

      // 5) Login / sign-in
      if (/\b(login|log in|sign in|account)\b/i.test(text) && !isLoggedIn) {
        push({
          from: 'bot',
          kind: 'text',
          text: 'Click the button below to log in — you\'ll be taken straight to your orders.',
        });
        push({
          from: 'bot',
          kind: 'chips',
          chips: [{ label: '→ Go to Customer Login', value: '__GOTO_LOGIN__' }],
        });
        return;
      }

      // 6) Fallback → Gemini
      const history = messages
        .filter((m) => m.kind === 'text')
        .slice(-6)
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'model', text: m.text }));
      const reply = await askGemini(text, history);
      push({ from: 'bot', kind: 'text', text: reply });
    } catch (err) {
      console.error('Chatbot error:', err);
      push({
        from: 'bot',
        kind: 'text',
        text: isHindi(text)
          ? 'माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।'
          : `Sorry — something glitched (${err.message}). Try again?`,
      });
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  /* ── deterministic actions ───────────────────────────────────── */

  const handleTrack = async (id) => {
    try {
      const { data } = await api.get(`/api/orders/track/${encodeURIComponent(id)}`);
      push({ from: 'bot', kind: 'order', order: data });
      if (!isLoggedIn) {
        push({
          from: 'bot',
          kind: 'chips',
          chips: [{ label: '→ Log in to see full order', value: '__GOTO_LOGIN__' }],
        });
      } else if (role === 'customer') {
        push({
          from: 'bot',
          kind: 'chips',
          chips: [{ label: '→ Open My Orders', value: '__GOTO_MY_ORDERS__' }],
        });
      }
    } catch (err) {
      push({
        from: 'bot',
        kind: 'text',
        text:
          err.response?.status === 404
            ? `Hmm, I couldn't find an order with ID **${id}**. Double-check the ID and try again.`
            : `Couldn't look up order ${id}: ${err.message}`,
      });
    }
  };

  const handleGifts = async (userQuery = '') => {
    try {
      const { data } = await api.get('/api/products/all');
      const all = (Array.isArray(data) ? data : data?.products || [])
        .filter((p) => p.status === 'approved' && p.quantity > 0);

      if (all.length === 0) {
        push({ from: 'bot', kind: 'text', text: "We're stocking up — check back soon!" });
        return;
      }

      // Strip filler words from the user's message so what's left is
      // the actual gift descriptor (interests, recipient, occasion…)
      const descriptor = userQuery
        .replace(/\b(show me|find me|i want|i need|looking for|gift|gifts|present|recommend|suggest|what products|what do you have|for someone who likes|my friend|for my|hi|hello|please|can you|something|some|a|an|the|to|with|that)\b/gi, '')
        .replace(/[^\w\sआ-ह]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // No real descriptor → show 6 picks across diverse categories.
      if (!descriptor || descriptor.length < 4) {
        const diverse = pickDiverseSample(all, 6);
        push({
          from: 'bot',
          kind: 'text',
          text: '🎁 Here are a few thoughtful picks from our tribal artisans:',
        });
        push({ from: 'bot', kind: 'gifts', products: diverse });
        return;
      }

      // ── Pre-filter: bias the shortlist toward likely matches
      // so even with 200+ products the right ones make Gemini's window.
      const keywords = descriptor.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const scored = all.map((p) => {
        const hay = [p.title, p.category, p.description].filter(Boolean).join(' ').toLowerCase();
        let score = 0;
        for (const k of keywords) {
          if (hay.includes(k)) score += 3;                            // direct hit
          if (p.category?.toLowerCase().includes(k)) score += 2;      // category match (extra)
          if (p.title?.toLowerCase().includes(k)) score += 4;         // title match (extra)
        }
        return { p, score };
      });
      scored.sort((a, b) => b.score - a.score);
      // Keep matches first, then top other products as filler context
      const shortlist = scored.slice(0, 80).map((x) => x.p);

      // Compact menu (more chars on description for richer matching)
      const menu = shortlist.map((p) => ({
        id: String(p._id),
        title: p.title,
        category: p.category,
        price: p.sellingPrice,
        desc: (p.description || '').slice(0, 200),
      }));

      const prompt = `You are a gift recommendation engine for Tribal Mart, a marketplace for Indian tribal handcrafted goods.

The shopper said: "${descriptor}"

Choose the 3-6 best matches from this product list, taking into account:
  • What the recipient or shopper would actually USE the item for
  • Materials / craft style mentioned (handmade, woven, terracotta, brass…)
  • The implicit "feel" (storage, decor, gift-giving, daily use, ritual…)
  • Category fit
  • Description and title relevance

DO NOT pick products just because a single word matches. Prefer semantic fit over keyword fit. If a product is clearly unrelated, skip it even if it appears in the list. If fewer than 3 genuinely match, return only the genuine matches (an empty array is fine).

Reply with ONLY a JSON object in this exact shape, no markdown, no code fences:
{
  "interpretation": "short summary of what the shopper is looking for",
  "matches": [
    {"id": "<product id>", "reason": "<one short sentence explaining the fit>"}
  ]
}

Products:
${JSON.stringify(menu)}`;

      let matched = [];
      let interpretation = '';
      try {
        const raw = await askGeminiRaw(prompt);
        // Strip any code fences if Gemini added them despite instructions
        const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
          const parsed = JSON.parse(objMatch[0]);
          interpretation = String(parsed.interpretation || '').slice(0, 140);
          if (Array.isArray(parsed.matches)) {
            matched = parsed.matches
              .map((m) => {
                const p = shortlist.find((x) => String(x._id) === String(m.id));
                if (!p) return null;
                return { ...p, _giftReason: String(m.reason || '').slice(0, 160) };
              })
              .filter(Boolean);
          }
        }
      } catch (e) {
        console.warn('Gemini gift match failed, using keyword scoring fallback:', e);
      }

      // Fallback: keyword-scored shortlist (only items with score > 0)
      if (matched.length === 0) {
        matched = scored
          .filter((x) => x.score > 0)
          .slice(0, 6)
          .map((x) => ({ ...x.p, _giftReason: '' }));
      }

      if (matched.length === 0) {
        push({
          from: 'bot',
          kind: 'text',
          text: `I couldn't find an exact match for "${descriptor}". Here are some popular tribal picks instead:`,
        });
        push({ from: 'bot', kind: 'gifts', products: pickDiverseSample(all, 6) });
        return;
      }

      const introText = interpretation
        ? `🎁 ${interpretation} — here ${matched.length === 1 ? 'is' : 'are'} my top ${matched.length} pick${matched.length === 1 ? '' : 's'}:`
        : `🎁 ${matched.length} thoughtful match${matched.length === 1 ? '' : 'es'} for "${descriptor}":`;
      push({ from: 'bot', kind: 'text', text: introText });
      push({ from: 'bot', kind: 'gifts', products: matched.slice(0, 6) });
    } catch (err) {
      push({ from: 'bot', kind: 'text', text: `Couldn't load products: ${err.message}` });
    }
  };

  // "Browse products" intent: list the catalogue inline (no blank-page
  // redirect), then a chip to open the full Browse Craft page — which
  // routes via login if the visitor is a guest.
  const handleBrowse = async () => {
    try {
      const { data } = await api.get('/api/products/all');
      const list = (Array.isArray(data) ? data : data?.products || [])
        .filter((p) => p.status === 'approved' && p.quantity > 0);

      if (list.length === 0) {
        push({ from: 'bot', kind: 'text', text: "We're stocking up — check back soon!" });
        return;
      }

      push({
        from: 'bot',
        kind: 'text',
        text: '🛍️ Here\'s a taste of our latest tribal craft — tap any item to explore:',
      });
      push({ from: 'bot', kind: 'gifts', products: pickDiverseSample(list, 8) });
      push({
        from: 'bot',
        kind: 'chips',
        chips: [{ label: '→ See all products (Browse Craft)', value: '__GOTO_BROWSE_ALL__' }],
      });
    } catch (err) {
      push({ from: 'bot', kind: 'text', text: `Couldn't load products: ${err.message}` });
    }
  };

  // Pick N products spread across as many categories as possible —
  // used when the shopper hasn't said anything specific.
  const pickDiverseSample = (products, n) => {
    const byCat = new Map();
    for (const p of products) {
      const c = p.category || 'Other';
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c).push(p);
    }
    const cats = [...byCat.keys()];
    const out = [];
    let i = 0;
    while (out.length < n && cats.length > 0) {
      const cat = cats[i % cats.length];
      const bucket = byCat.get(cat);
      if (bucket.length > 0) {
        out.push(bucket.shift());
        if (bucket.length === 0) cats.splice(cats.indexOf(cat), 1);
      }
      i++;
      if (i > 100) break;
    }
    return out;
  };

  const handleChip = (value) => {
    if (value === '__GOTO_LOGIN__') {
      navigate(`/login/customer?next=${encodeURIComponent('/orders')}`);
      setOpen(false);
      return;
    }
    if (value === '__GOTO_MY_ORDERS__') {
      navigate('/orders');
      setOpen(false);
      return;
    }
    if (value === '__GOTO_BROWSE_ALL__') {
      // Guest → log in first, then drop into Browse Craft page.
      // Logged-in user → go straight to Browse Craft.
      if (!isLoggedIn) {
        navigate(`/login/customer?next=${encodeURIComponent('/browse-products')}`);
      } else {
        navigate('/browse-products');
      }
      setOpen(false);
      return;
    }
    handleSend(value);
  };

  const handleBuyGift = (product) => {
    if (!isLoggedIn) {
      // Stash the chosen product, send to login, redirect to product after.
      localStorage.setItem('postLoginRedirect', `/product/${product._id}`);
      navigate(`/login/customer?next=${encodeURIComponent('/product/' + product._id)}`);
      setOpen(false);
      return;
    }
    navigate(`/product/${product._id}`);
    setOpen(false);
  };

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        className={`saathi-launcher ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat with Saathi'}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      >
        <span className="saathi-launcher-icon">{open ? '✕' : '💬'}</span>
        {!open && <span className="saathi-launcher-pulse" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="saathi-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <header className="saathi-head">
              <div className="saathi-head-avatar">🌾</div>
              <div>
                <div className="saathi-head-title">Saathi</div>
                <div className="saathi-head-sub">Tribal Mart helper · online</div>
              </div>
              <button
                className="saathi-head-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <div className="saathi-body" ref={scrollRef}>
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  msg={m}
                  onChip={handleChip}
                  onBuyGift={handleBuyGift}
                />
              ))}
              {busy && (
                <div className="saathi-row from-bot">
                  <div className="saathi-bubble typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            <form
              className="saathi-input"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message or paste an order ID…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── helper: a single chat message bubble ─────────────────────── */
const MessageBubble = ({ msg, onChip, onBuyGift }) => {
  if (msg.kind === 'chips') {
    return (
      <div className="saathi-row from-bot">
        <div className="saathi-chips">
          {msg.chips.map((c, i) => (
            <button key={i} className="saathi-chip" onClick={() => onChip(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (msg.kind === 'order') {
    const o = msg.order;
    const statusColor = {
      pending: '#d97706',
      confirmed: '#2563eb',
      processing: '#7c3aed',
      shipped: '#0891b2',
      delivered: '#15803d',
      cancelled: '#dc2626',
    }[o.orderStatus] || '#525252';
    return (
      <div className="saathi-row from-bot">
        <div className="saathi-bubble saathi-order">
          <div className="saathi-order-head">
            <strong>{o.orderNumber}</strong>
            <span className="saathi-pill" style={{ background: statusColor }}>
              {o.orderStatus}
            </span>
          </div>
          <ul className="saathi-order-items">
            {(o.items || []).slice(0, 3).map((it, i) => (
              <li key={i}>
                <span>{it.productTitle}</span>
                <span className="qty">× {it.quantity}</span>
              </li>
            ))}
            {o.items?.length > 3 && <li className="more">+ {o.items.length - 3} more</li>}
          </ul>
          <div className="saathi-order-foot">
            <span>💳 {o.paymentStatus}</span>
            {o.estimatedDelivery && (
              <span>
                📅 by {new Date(o.estimatedDelivery).toLocaleDateString()}
              </span>
            )}
          </div>
          {o.trackingUpdates && o.trackingUpdates.length > 0 && (
            <div className="saathi-order-track">
              <em>Latest:</em> {o.trackingUpdates[o.trackingUpdates.length - 1].message}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (msg.kind === 'gifts') {
    return (
      <div className="saathi-row from-bot">
        <div className="saathi-gifts">
          {msg.products.map((p) => (
            <button
              key={p._id}
              className="saathi-gift-card"
              onClick={() => onBuyGift(p)}
              type="button"
            >
              {p.images?.[0] ? (
                <img
                  src={getImageUrl(p.images[0])}
                  alt={p.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="saathi-gift-no-img">🎨</div>
              )}
              <div className="saathi-gift-meta">
                <div className="saathi-gift-title">{p.title}</div>
                <div className="saathi-gift-agency">{p.agencyName}</div>
                <div className="saathi-gift-price">₹{(p.sellingPrice || 0).toLocaleString()}</div>
                {p._giftReason && (
                  <div className="saathi-gift-reason" title={p._giftReason}>
                    ✨ {p._giftReason}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  // default: text bubble
  return (
    <div className={`saathi-row from-${msg.from}`}>
      <div className={`saathi-bubble ${msg.from === 'user' ? 'is-user' : ''}`}>
        {renderMarkdownLite(msg.text)}
      </div>
    </div>
  );
};

// Tiny markdown: **bold** + line breaks + `code`
const renderMarkdownLite = (text) => {
  const lines = String(text).split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={j}>{part.slice(1, -1)}</code>;
        }
        return <React.Fragment key={j}>{part}</React.Fragment>;
      })}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

export default ChatBot;
