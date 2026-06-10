import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  useScroll,
} from 'framer-motion';
import './LandingPage.css';

// ──────────────────────────────────────────────────────────────
// MagneticButton — gently follows the cursor for a tactile feel
// ──────────────────────────────────────────────────────────────
const MagneticButton = ({ children, className, onClick, strength = 14, ...rest }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set(((e.clientX - cx) / rect.width) * strength);
    y.set(((e.clientY - cy) / rect.height) * strength);
  };
  const handleLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={className}
      onClick={onClick}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

// ──────────────────────────────────────────────────────────────
// CountUp — animated number ticker that triggers on view
// ──────────────────────────────────────────────────────────────
const CountUp = ({ to, suffix = '', prefix = '', duration = 1.6 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30% 0px' });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => `${prefix}${Math.round(latest).toLocaleString()}${suffix}`);
  useEffect(() => {
    if (inView) {
      const ctrl = animate(mv, to, { duration, ease: 'easeOut' });
      return () => ctrl.stop();
    }
  }, [inView, to, duration, mv]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
};

// ──────────────────────────────────────────────────────────────
// Reveal — wraps content with a fade-up on scroll-into-view
// ──────────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, as: Tag = 'div', className, ...rest }) => {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  // ────────────────────────────────────────────────────────────
  // CARD STACK STATE — auto-cycles every interval; pause on hover
  // ────────────────────────────────────────────────────────────
  const productCards = [
    { id: 0, image: '/images/pottery.png',                                                                                  label: '@hand_coiled',     bg: 'linear-gradient(135deg,#ead9c3,#d8b88f)' },
    { id: 1, image: '/images/textile.png',                                                                                  label: '@native_textiles', bg: 'linear-gradient(135deg,#e8c4b5,#c46b4e)' },
    { id: 2, image: '/images/sculpture.png',                                                                                label: '@tribal_weaving',  bg: 'linear-gradient(135deg,#ddd4cc,#a59384)' },
    { id: 3, image: '/images/necklace.png',                                                                                 label: '@heritage',        bg: 'linear-gradient(135deg,#f3e0c5,#d99441)' },
    { id: 4, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=720&q=80&auto=format&fit=crop',          label: '@bagh_block',      bg: 'linear-gradient(135deg,#9c3d3d,#3e1313)' },
    { id: 5, image: 'https://images.unsplash.com/photo-1604147495798-57beb5d6af73?w=720&q=80&auto=format&fit=crop',          label: '@sabai_woven',     bg: 'linear-gradient(135deg,#deb785,#a17440)' },
    { id: 6, image: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=720&q=80&auto=format&fit=crop',          label: '@dhokra_brass',    bg: 'linear-gradient(135deg,#c89a6e,#6e4a2c)' },
    { id: 7, image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=720&q=80&auto=format&fit=crop',          label: '@bead_work',       bg: 'linear-gradient(135deg,#e9c478,#a4783b)' },
  ];

  const [activeCard, setActiveCard] = useState(0);
  const [hovering, setHovering] = useState(false);
  const total = productCards.length;

  // Shuffle only while hovered. Fast pace for a satisfying card-flick feel.
  useEffect(() => {
    if (!hovering) return;
    const id = setInterval(() => setActiveCard((c) => (c + 1) % total), 900);
    return () => clearInterval(id);
  }, [hovering, total]);

  // Each card has a slot position: 0 = front, 1 = next back, 2 = further back, etc.
  // The slot determines rotate / translate / scale / z-index — so when activeCard
  // changes, every card animates to the new slot simultaneously.
  const slotStyle = (slot) => {
    switch (slot) {
      case 0: return { rotate:  0,   x:   0,   y:   0,  scale: 1.05, zIndex: 40, opacity: 1 };
      case 1: return { rotate: -8,   x: -38,   y:  18,  scale: 0.96, zIndex: 30, opacity: 1 };
      case 2: return { rotate: -16,  x: -68,   y:  34,  scale: 0.90, zIndex: 20, opacity: 0.85 };
      default: return { rotate: -24, x: -90,   y:  46,  scale: 0.84, zIndex: 10, opacity: 0    };
    }
  };

  // ────────────────────────────────────────────────────────────
  // CONTENT DATA
  // ────────────────────────────────────────────────────────────
  const products = [
    { name: 'Terracotta Coiled Bowl',       price: '₹12,450', image: '/images/pottery.png',   bg: 'linear-gradient(135deg,#f0d8b8,#e9b88f)' },
    { name: 'Bhil Hand-Woven Throw',        price: '₹17,800', image: '/images/textile.png',   bg: 'linear-gradient(135deg,#e9d8c0,#c7b89c)' },
    { name: 'Gond Tribal Wood Sculpture',   price: '₹24,200', image: '/images/sculpture.png', bg: 'linear-gradient(135deg,#efe6d4,#d8ccba)' },
    { name: 'Lambani Beaded Necklace',      price: '₹8,900',  image: '/images/necklace.png',  bg: 'linear-gradient(135deg,#f5dfc4,#d99441)' },
    { name: 'Bagh Block-Printed Wrap',      price: '₹6,400',  image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=720&q=80&auto=format&fit=crop', bg: 'linear-gradient(135deg,#7a2c2c,#3e1313)' },
    { name: 'Coiled Sabai Grass Basket',    price: '₹4,750',  image: 'https://images.unsplash.com/photo-1604147495798-57beb5d6af73?w=720&q=80&auto=format&fit=crop', bg: 'linear-gradient(135deg,#deb785,#a17440)' },
    { name: 'Brass Tribal Bangles (Set)',   price: '₹3,200',  image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=720&q=80&auto=format&fit=crop', bg: 'linear-gradient(135deg,#e9c478,#a4783b)' },
    { name: 'Dhokra Lost-Wax Figurine',     price: '₹15,600', image: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=720&q=80&auto=format&fit=crop', bg: 'linear-gradient(135deg,#c89a6e,#6e4a2c)' },
  ];

  // ─── New: Behind the Craft (process images) ────────────────
  const behindCraft = [
    { src: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=80&auto=format&fit=crop',
      caption: 'Hand-coiled at the wheel',
      tag: 'POTTERY' },
    { src: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900&q=80&auto=format&fit=crop',
      caption: '12-foot floor looms still in use',
      tag: 'WEAVING' },
    { src: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=900&q=80&auto=format&fit=crop',
      caption: 'Hand-strung, bead by bead',
      tag: 'BEADWORK' },
  ];

  // ─── New: Meet the Makers (tribal artisans of India) ──────
  // `portrait` uses DiceBear's `personas` style which generates a
  // consistent illustrated portrait for each seed. Reliable + intentional.
  // To swap in real photos: drop them in /public/images/ and replace the URL.
  const makers = [
    { name: 'Sabari Bhil',    craft: 'Pithora Painting',     region: 'Jhabua, Madhya Pradesh', tribe: 'Bhil',
      glyph: '🖌️',
      portrait: 'https://api.dicebear.com/7.x/personas/svg?seed=Sabari%20Bhil&backgroundColor=transparent',
      tint: 'linear-gradient(135deg,#c0552c 0%,#8e3b1a 100%)' },
    { name: 'Birsa Munda',    craft: 'Dhokra Brass Casting', region: 'Khunti, Jharkhand',      tribe: 'Munda',
      glyph: '🔨',
      portrait: 'https://api.dicebear.com/7.x/personas/svg?seed=Birsa%20Munda&backgroundColor=transparent',
      tint: 'linear-gradient(135deg,#d99441 0%,#b07020 100%)' },
    { name: 'Lakhmi Toda',    craft: 'Pukhoor Embroidery',   region: 'Nilgiris, Tamil Nadu',   tribe: 'Toda',
      glyph: '🧵',
      portrait: 'https://api.dicebear.com/7.x/personas/svg?seed=Lakhmi%20Toda&backgroundColor=transparent',
      tint: 'linear-gradient(135deg,#2e3a59 0%,#1a2238 100%)' },
    { name: 'Mamoni Soren',   craft: 'Sohrai Wall Art',      region: 'Hazaribagh, Jharkhand',  tribe: 'Santhal',
      glyph: '🎨',
      portrait: 'https://api.dicebear.com/7.x/personas/svg?seed=Mamoni%20Soren&backgroundColor=transparent',
      tint: 'linear-gradient(135deg,#4a6a3a 0%,#2d4023 100%)' },
  ];

  // Graceful image fallback — swap to a tinted block if a URL 404s
  const handleImgError = (e) => {
    e.currentTarget.style.display = 'none';
    if (e.currentTarget.parentNode) {
      e.currentTarget.parentNode.classList.add('tm-img-fallback');
    }
  };

  const supportTiers = [
    { name: 'Supporter', price: '₹1,250/mo', description: 'Help fund raw materials for an entire artisan family.', perks: ['Monthly updates', '10% off all purchases', 'Access to community forum'], cta: 'Join as Supporter', highlighted: false },
    { name: 'Patron', price: '₹3,800/mo', description: 'Provide sustainable living wages and community healthcare.', perks: ['Direct artisan contact', '20% off all purchases', 'Early access to drops', 'Annual impact report'], cta: 'Become a Patron', highlighted: true },
    { name: 'Advocate', price: '₹9,900/mo', description: 'Sponsor community development projects and workshops.', perks: ['All Patron benefits', 'Exclusive bespoke items', 'Voting rights on projects', 'VIP event invitations'], cta: 'Join as Advocate', highlighted: false },
  ];

  const partners = [
    { icon: '🤝', name: 'Fair Trade Alliance' },
    { icon: '🌐', name: 'Global Artisans' },
    { icon: '🛡️', name: 'Ethical Sourcing' },
    { icon: '🌟', name: 'Heritage Trust' },
    { icon: '♻️', name: 'Sustainable Goods' },
    { icon: '🏛️', name: 'Cultural Foundation' },
  ];

  const stats = [
    { value: 240, suffix: '+', label: 'Artisan partners' },
    { value: 80,  suffix: '%', label: 'Revenue back to makers' },
    { value: 32,  suffix: '',  label: 'Tribal communities' },
    { value: 12000, prefix: '', suffix: '+', label: 'Pieces delivered' },
  ];

  // Subtle parallax on hero pattern
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, 80]);

  return (
    <div className="tm-page">
      {/* ── NAVBAR ── */}
      <motion.nav
        className="tm-nav"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="tm-nav-inner">
          <div className="tm-logo">
            <span className="tm-logo-icon">T</span>
            <span className="tm-logo-name">TribalMart</span>
          </div>
          <div className="tm-nav-links">
            <a href="#shop">Shop</a>
            <a href="#artisans">Our Artisans</a>
            <a href="#impact">Impact</a>
          </div>
          <div className="tm-nav-actions">
            <button className="tm-icon-btn" onClick={() => navigate('/login')} title="Login" aria-label="Login">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>
            <button className="tm-cart-btn" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <span className="tm-cart-count">2</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="tm-hero">
        <motion.div className="tm-hero-bg-parallax" style={{ y: heroParallax }} aria-hidden />
        <div className="tm-hero-inner">
          <motion.div
            className="tm-hero-badge"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Curated Heritage Collection
          </motion.div>
          <h1 className="tm-hero-title">
            {['Authentic', 'creations', 'from', 'traditional', <em key="tribes">tribes.</em>].map((word, i) => (
              <motion.span
                key={i}
                style={{ display: 'inline-block', marginRight: '0.28em' }}
                initial={{ opacity: 0, y: 32, rotateX: -30 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="tm-hero-sub"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55 }}
          >
            Discover one-of-a-kind handcrafted pieces that preserve ancient techniques
            and support indigenous communities worldwide.
          </motion.p>
          <motion.div
            className="tm-hero-ctas"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.7 }}
          >
            <MagneticButton className="tm-btn-dark" onClick={() => navigate('/signup')}>
              Explore Marketplace
            </MagneticButton>
            <MagneticButton className="tm-btn-outline" onClick={() => navigate('/login')}>
              Meet the Artisans
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* ── ROTATING CARD CAROUSEL ── */}
      <section
        className="tm-carousel-section"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="tm-cards-stack">
          {productCards.map((card, i) => {
            const slot = (i - activeCard + total) % total;
            const target = slotStyle(slot);
            return (
              <motion.div
                key={card.id}
                className={`tm-product-card ${slot === 0 ? 'tm-card-active' : ''}`}
                style={{ background: card.bg }}
                animate={target}
                transition={{ type: 'spring', stiffness: 130, damping: 18, mass: 0.9 }}
                onClick={() => setActiveCard(i)}
              >
                <div className="tm-card-img-area">
                  <img src={card.image} alt={card.label} className="tm-card-image" loading="lazy" onError={handleImgError} />
                </div>
                <div className="tm-card-badge">
                  <span className="tm-card-dot"></span>
                  {card.label}
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* dots indicator */}
        <div className="tm-stack-dots" aria-hidden>
          {productCards.map((_, i) => (
            <button
              key={i}
              className={`tm-stack-dot ${i === activeCard ? 'is-active' : ''}`}
              onClick={() => setActiveCard(i)}
              aria-label={`Show card ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── ABOUT / MISSION ── */}
      <section className="tm-about" id="artisans">
        <div className="tm-about-inner">
          <Reveal>
            <div className="tm-section-tag">Our Mission</div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="tm-about-title">
              Connecting you directly<br />with the hands that <em>create.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="tm-about-body">
              By connecting directly with traditional masters, we ensure fair compensation
              while giving you access to genuine artifacts that carry generations of cultural
              significance.
            </p>
          </Reveal>

          {/* Stat strip */}
          <div className="tm-stat-strip">
            {stats.map((s, i) => (
              <Reveal key={i} delay={0.1 + i * 0.08} className="tm-stat-block">
                <div className="tm-stat-value">
                  <CountUp to={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} />
                </div>
                <div className="tm-stat-label">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEHIND THE CRAFT (image trio) ── */}
      <section className="tm-behind">
        <div className="tm-behind-inner">
          <div className="tm-behind-head">
            <Reveal>
              <div className="tm-section-tag">Behind the Craft</div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="tm-about-title" style={{ textAlign: 'left' }}>
                Made by <em>hand</em>,<br />the way it has always been.
              </h2>
            </Reveal>
          </div>
          <div className="tm-behind-grid">
            {behindCraft.map((b, i) => (
              <motion.figure
                key={i}
                className={`tm-behind-card tm-behind-card-${i}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px 0px' }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
              >
                <div className="tm-behind-img-wrap">
                  <img
                    src={b.src}
                    alt={b.caption}
                    loading="lazy"
                    onError={handleImgError}
                    className="tm-behind-img"
                  />
                </div>
                <figcaption className="tm-behind-cap">
                  <span className="tm-behind-tag">{b.tag}</span>
                  <span className="tm-behind-text">{b.caption}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER MARQUEE ── */}
      <div className="tm-marquee-wrap">
        <Reveal>
          <p className="tm-marquee-label">Supported by leading ethical organizations</p>
        </Reveal>
        <div className="tm-marquee">
          <div className="tm-marquee-track">
            {[...partners, ...partners].map((p, i) => (
              <span key={i} className="tm-marquee-item">
                <span className="tm-marquee-icon">{p.icon}</span>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <section className="tm-shop" id="shop">
        <Reveal>
          <div className="tm-shop-header">
            <div>
              <h2 className="tm-shop-title">Explore the <em>Marketplace</em></h2>
              <p className="tm-shop-sub">
                Latest arrivals, carefully sourced directly from creators mapping authentic traditions.
              </p>
            </div>
            <button className="tm-link-btn" onClick={() => navigate('/signup')}>
              View All Collection &rsaquo;
            </button>
          </div>
        </Reveal>
        <div className="tm-products-grid">
          {products.map((p, i) => (
            <motion.div
              key={i}
              className="tm-product-tile"
              style={{ '--tile-bg': p.bg }}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px 0px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
            >
              <div className="tm-product-img">
                <img src={p.image} alt={p.name} className="tm-product-image" loading="lazy" onError={handleImgError} />
              </div>
              <div className="tm-product-info">
                <span className="tm-product-name">{p.name}</span>
                <span className="tm-product-price">{p.price}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── IMPACT / HOW IT WORKS ── */}
      <section className="tm-impact" id="impact">
        <div className="tm-impact-inner">
          <Reveal>
            <div className="tm-section-tag">How It Works</div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="tm-impact-title">Every purchase creates <em>real change</em></h2>
          </Reveal>
          <div className="tm-steps">
            {[
              { num: '01', h: 'Artisan Creates', p: 'Skilled craftspeople make authentic pieces using ancestral methods' },
              { num: '02', h: 'We Verify',       p: 'Our heritage experts authenticate every piece and tribal lineage' },
              { num: '03', h: 'You Discover',    p: 'Browse, connect, purchase one-of-a-kind items with full provenance' },
              { num: '04', h: 'Community Grows', p: '80% of revenue goes directly to artisan families' },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <Reveal delay={i * 0.1} className="tm-step">
                  <div className="tm-step-num">{step.num}</div>
                  <h3>{step.h}</h3>
                  <p>{step.p}</p>
                </Reveal>
                {i < arr.length - 1 && <div className="tm-step-line" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET THE MAKERS ── */}
      <section className="tm-makers">
        <div className="tm-makers-inner">
          <Reveal>
            <div className="tm-section-tag">Meet the Makers</div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="tm-impact-title" style={{ marginBottom: '3rem' }}>
              Faces behind the <em>craft</em>
            </h2>
          </Reveal>
          <div className="tm-makers-grid">
            {makers.map((m, i) => (
              <motion.div
                key={i}
                className="tm-maker-card"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px 0px' }}
                transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
              >
                <div className="tm-maker-portrait" style={{ background: m.tint }}>
                  <span className="tm-maker-pattern" aria-hidden />
                  {m.portrait ? (
                    <img
                      src={m.portrait}
                      alt={m.name}
                      loading="lazy"
                      onError={handleImgError}
                      className="tm-maker-img"
                    />
                  ) : (
                    <span className="tm-maker-monogram">{m.name.charAt(0)}</span>
                  )}
                  <span className="tm-maker-glyph" aria-hidden>{m.glyph}</span>
                </div>
                <div className="tm-maker-info">
                  <span className="tm-maker-tribe">{m.tribe} community</span>
                  <h4 className="tm-maker-name">{m.name}</h4>
                  <p className="tm-maker-craft">{m.craft}</p>
                  <p className="tm-maker-region">📍 {m.region}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORT TIERS ── */}
      <section className="tm-tiers">
        <div className="tm-tiers-inner">
          <Reveal>
            <div className="tm-section-tag">Support the Community</div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="tm-tiers-title">Become a patron of <em>living culture</em></h2>
          </Reveal>
          <div className="tm-tiers-grid">
            {supportTiers.map((tier, i) => (
              <motion.div
                key={i}
                className={`tm-tier-card ${tier.highlighted ? 'tm-tier-highlighted' : ''}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px 0px' }}
                transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
              >
                <div className="tm-tier-name">{tier.name}</div>
                <div className="tm-tier-price">{tier.price}</div>
                <p className="tm-tier-desc">{tier.description}</p>
                <ul className="tm-tier-perks">
                  {tier.perks.map((perk, j) => (
                    <li key={j}>
                      <span className="tm-perk-check">✓</span> {perk}
                    </li>
                  ))}
                </ul>
                <button
                  className={`tm-tier-btn ${tier.highlighted ? 'tm-tier-btn-accent' : ''}`}
                  onClick={() => navigate('/signup')}
                >
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="tm-cta-banner">
        <div className="tm-cta-inner">
          <Reveal as="h2">Start your <em>collection</em> today</Reveal>
          <Reveal as="p" delay={0.1}>
            Join thousands preserving cultural heritage one handcrafted piece at a time
          </Reveal>
          <Reveal delay={0.2}>
            <div className="tm-cta-actions">
              <MagneticButton className="tm-btn-dark" onClick={() => navigate('/signup')}>
                Create Free Account
              </MagneticButton>
              <MagneticButton className="tm-btn-ghost" onClick={() => navigate('/login')}>
                Sign In
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="tm-footer">
        <div className="tm-footer-inner">
          <div className="tm-footer-brand">
            <div className="tm-logo tm-logo-light">
              <span className="tm-logo-icon">T</span>
              <span className="tm-logo-name">TribalMart</span>
            </div>
            <p>Bridging indigenous artisans with the world, one authentic creation at a time.</p>
          </div>
          <div className="tm-footer-cols">
            <div className="tm-footer-col">
              <h4>Marketplace</h4>
              <Link to="/shop">Shop All</Link>
              <Link to="/artisans">Our Artisans</Link>
              <Link to="/impact">Impact</Link>
            </div>
            <div className="tm-footer-col">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/compliance">Compliance</Link>
            </div>
            <div className="tm-footer-col">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/faq">FAQ</Link>
            </div>
          </div>
        </div>
        <div className="tm-footer-bottom">
          <p>© 2026 TribalMart. All rights reserved. | Ethical Tribal Artisan Marketplace</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
