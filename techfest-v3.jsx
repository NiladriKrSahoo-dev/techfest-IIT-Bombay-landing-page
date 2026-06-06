import { useRef, useState, useEffect, useCallback } from "react";
import { useScroll, useTransform, motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/* ═══════════════════════════════════════════════════
   LIQUID GLASS PRIMITIVE
═══════════════════════════════════════════════════ */
function LG({ children, style = {}, className = "", as: Tag = "div", ...rest }) {
  return (
    <Tag
      className={`lg ${className}`}
      style={{
        background: "rgba(255,255,255,0.01)",
        backgroundBlendMode: "luminosity",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 1px rgba(0,0,0,0.08)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {/* Glass border gradient pseudo-element via a real element */}
      <span
        aria-hidden
        style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          padding: "1.4px", pointerEvents: "none", zIndex: 0,
          background: "linear-gradient(180deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.15) 80%,rgba(255,255,255,0.5) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span style={{ position: "relative", zIndex: 1, display: "contents" }}>{children}</span>
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════
   CONTAINER SCROLL  (exact spec)
═══════════════════════════════════════════════════ */
function ContainerScroll({ titleComponent, children }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scaleDimensions = isMobile ? [0.7, 0.9] : [1.05, 1];
  const rotate    = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale     = useTransform(scrollYProgress, [0, 1], scaleDimensions);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      style={{
        height: isMobile ? "60rem" : "80rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", padding: isMobile ? "8px" : "80px",
      }}
    >
      <div style={{ paddingTop: isMobile ? "40px" : "160px", paddingBottom: isMobile ? "40px" : "160px", width: "100%", position: "relative", perspective: "1000px" }}>
        <motion.div style={{ translateY: translate, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          {titleComponent}
        </motion.div>
        <motion.div
          style={{
            rotateX: rotate, scale,
            boxShadow: "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
            maxWidth: "900px", marginTop: "-48px", marginLeft: "auto", marginRight: "auto",
            width: "100%", border: "4px solid #3a3a3a", padding: isMobile ? "8px" : "24px",
            background: "#1a1a1a", borderRadius: "30px",
          }}
        >
          <div style={{ height: "100%", width: "100%", overflow: "hidden", borderRadius: "16px", background: "#111", minHeight: isMobile ? "300px" : "500px" }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAGNETIC BUTTON
═══════════════════════════════════════════════════ */
function MagneticBtn({ children, style = {}, onClick, ...rest }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  function onMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.4);
    y.set((e.clientY - cy) * 0.4);
  }
  function onMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: "inline-block" }}
      onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      onClick={onClick} {...rest}>
      <div style={style}>{children}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   VIDEO FADE HOOK
═══════════════════════════════════════════════════ */
function useVideoFade(ref) {
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let raf = null;
    let fadingOut = false;

    function cancelRaf() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    function fadeIn(from) {
      cancelRaf();
      const start = performance.now();
      const s = from ?? parseFloat(v.style.opacity || 0);
      function step(now) {
        const t = Math.min((now - start) / 500, 1);
        v.style.opacity = s + (1 - s) * t;
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }
    function fadeOut(from) {
      cancelRaf();
      const start = performance.now();
      const s = from ?? parseFloat(v.style.opacity || 1);
      function step(now) {
        const t = Math.min((now - start) / 500, 1);
        v.style.opacity = s * (1 - t);
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }
    v.addEventListener("timeupdate", () => {
      if (!fadingOut && v.duration && v.currentTime >= v.duration - 0.55) {
        fadingOut = true;
        fadeOut(parseFloat(v.style.opacity || 1));
      }
    });
    v.addEventListener("ended", () => {
      cancelRaf(); v.style.opacity = 0; fadingOut = false;
      setTimeout(() => { v.currentTime = 0; v.play().then(() => fadeIn(0)).catch(() => {}); }, 100);
    });
    v.style.opacity = 0; v.muted = true;
    v.play().then(() => fadeIn(0)).catch(() => { v.style.opacity = 1; });
    return () => cancelRaf();
  }, [ref]);
}

/* ═══════════════════════════════════════════════════
   COUNTER
═══════════════════════════════════════════════════ */
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = target / 70;
        const id = setInterval(() => {
          cur = Math.min(cur + step, target);
          setVal(Math.round(cur));
          if (cur >= target) clearInterval(id);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  const display = target >= 100000 ? `${Math.round(val / 1000)}K` : val.toString();
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════ */
function Nav({ activeSection, onNav }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = ["Events", "Schedule", "Speakers", "Register"];

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, padding: "20px 24px 0" }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
        <LG style={{
          borderRadius: "9999px",
          padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          maxWidth: "900px", margin: "0 auto",
          transition: "background 0.3s",
          background: scrolled ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.01)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <button
              onClick={() => onNav("hero")}
              style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "#fff", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "0.04em" }}>
                Techfest
              </span>
            </button>
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              {links.map(l => (
                <motion.button
                  key={l}
                  onClick={() => onNav(l.toLowerCase())}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em",
                    color: activeSection === l.toLowerCase() ? "#fff" : "rgba(255,255,255,0.6)",
                    transition: "color 0.2s",
                    display: window.innerWidth < 700 ? "none" : "block",
                  }}
                >
                  {l}
                </motion.button>
              ))}
            </div>
          </div>
          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => onNav("register")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", fontWeight: 500 }}
            >
              Explore
            </motion.button>
            <LG as={motion.button}
              whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNav("register")}
              style={{ borderRadius: "9999px", padding: "8px 22px", cursor: "pointer", color: "#fff", fontSize: "0.8rem", fontWeight: 500, border: "none" }}
            >
              Register →
            </LG>
          </div>
        </LG>
      </motion.div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════
   HERO  (full-screen video + liquid glass)
═══════════════════════════════════════════════════ */
function Hero({ id }) {
  const videoRef = useRef(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useVideoFade(videoRef);

  function handleSubmit(e) {
    e.preventDefault();
    if (email) { setSubmitted(true); setTimeout(() => setSubmitted(false), 3000); setEmail(""); }
  }

  return (
    <section id={id} style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#000", overflow: "hidden" }}>
      {/* VIDEO */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <video ref={videoRef} autoPlay muted playsInline loop={false}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "translateY(17%)", opacity: 0 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.2) 45%,rgba(0,0,0,0.55) 100%)" }} />
      </div>

      {/* CONTENT */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", textAlign: "center", transform: "translateY(-5%)" }}>

        {/* Eyebrow */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ marginBottom: "32px" }}>
          <LG style={{ borderRadius: "9999px", padding: "7px 20px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "inline-block" }}
            />
            <span style={{ fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
              IIT Bombay · Asia's Largest S&T Festival
            </span>
          </LG>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(3.2rem, 10vw, 8rem)", color: "#fff", lineHeight: 0.92, letterSpacing: "-0.025em", marginBottom: "40px", maxWidth: "860px" }}
        >
          Where curiosity<br />
          <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.78)" }}>meets the future.</em>
        </motion.h1>

        {/* Email form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8 }}
          style={{ width: "100%", maxWidth: "460px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <LG style={{ borderRadius: "9999px", padding: "8px 8px 8px 22px", display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email to stay updated"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.9rem", padding: "4px 0" }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.1, background: "#d4eb00" }}
              whileTap={{ scale: 0.95 }}
              style={{ background: "#fff", borderRadius: "9999px", padding: "11px", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none", cursor: "pointer", transition: "background 0.2s" }}
            >
              <AnimatePresence mode="wait">
                {submitted
                  ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ fontSize: "1rem" }}>✓</motion.span>
                  : <motion.svg key="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ x: 0 }} whileHover={{ x: 2 }}>
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </motion.svg>
                }
              </AnimatePresence>
            </motion.button>
          </LG>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", lineHeight: 1.75, padding: "0 12px", fontWeight: 300 }}>
            Three days. Hundreds of events. The sharpest minds on the planet — competing, collaborating, and building what comes next.
          </p>
        </motion.form>

        {/* Manifesto + CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05 }}
          style={{ display: "flex", gap: "14px", marginTop: "28px", flexWrap: "wrap", justifyContent: "center" }}
        >
          <MagneticBtn>
            <LG style={{ borderRadius: "9999px", padding: "12px 30px", cursor: "pointer", display: "inline-block" }}>
              <motion.span
                whileHover={{ color: "#fff" }}
                style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.04em", display: "block" }}
              >
                Read the Manifesto
              </motion.span>
            </LG>
          </MagneticBtn>
          <MagneticBtn onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}>
            <motion.div
              whileHover={{ background: "#d4eb00" }}
              style={{ borderRadius: "9999px", padding: "12px 30px", cursor: "pointer", display: "inline-block", background: "#e8ff47", color: "#000", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.04em", transition: "background 0.2s" }}
            >
              Explore Events ↓
            </motion.div>
          </MagneticBtn>
        </motion.div>
      </div>

      {/* Social icons */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "center", gap: "14px", paddingBottom: "48px" }}
      >
        {[
          { label: "Instagram", d: ["M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z","M17.5 6.5h.01","M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"] },
          { label: "Twitter", d: ["M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"] },
          { label: "Website", d: ["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M2 12h20","M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"] },
        ].map(({ label, d }) => (
          <MagneticBtn key={label}>
            <LG as={motion.button}
              aria-label={label}
              whileHover={{ background: "rgba(255,255,255,0.09)" }}
              style={{ borderRadius: "9999px", padding: "15px", cursor: "pointer", border: "none", color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                {d.map((path, i) => <path key={i} d={path} />)}
              </svg>
            </LG>
          </MagneticBtn>
        ))}
      </motion.div>

      {/* Ghost wordmark */}
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", zIndex: 0, pointerEvents: "none", overflow: "hidden", width: "100%", textAlign: "center" }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(5rem, 22vw, 18rem)", color: "rgba(255,255,255,0.018)", letterSpacing: "-0.04em", lineHeight: 0.82, display: "block", whiteSpace: "nowrap", userSelect: "none" }}>
          TECHFEST
        </span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   STATS STRIP
═══════════════════════════════════════════════════ */
const STATS = [
  { n: 200,    suf: "+", label: "Events" },
  { n: 150000, suf: "+", label: "Participants" },
  { n: 60,     suf: "",  label: "Countries" },
  { n: 25,     suf: "",  label: "Years of Legacy" },
];

function Stats() {
  return (
    <section style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", maxWidth: 1100, margin: "0 auto" }}>
        {STATS.map(({ n, suf, label }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ padding: "56px 32px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
          >
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.4rem,4vw,4rem)", color: "#e8ff47", lineHeight: 1 }}>
              <Counter target={n} suffix={suf} />
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 10 }}>
              {label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   CONTAINER SCROLL SECTION (events preview)
═══════════════════════════════════════════════════ */
const CARD_EVENTS = [
  { name: "Robotics Grand Prix", sub: "Autonomous machines. Real stakes.", bg: "radial-gradient(ellipse at 70% 20%,rgba(0,255,180,.12),transparent 60%),linear-gradient(160deg,#0f1f1a,#0a0a0a)", accent: "#00ffb4", wide: true },
  { name: "AI / ML Challenge",   sub: "Build. Train. Deploy.",           bg: "radial-gradient(ellipse at 30% 70%,rgba(232,255,71,.1),transparent 60%),linear-gradient(160deg,#1a1a0a,#0a0a0a)",  accent: "#e8ff47" },
  { name: "Drone Racing",        sub: "First-person velocity.",           bg: "radial-gradient(ellipse at 60% 60%,rgba(255,80,80,.1),transparent 60%),linear-gradient(160deg,#1f0f0f,#0a0a0a)",  accent: "#ff5050" },
  { name: "Quantum Lab",         sub: "Superposition awaits.",            bg: "radial-gradient(ellipse at 20% 30%,rgba(160,150,254,.12),transparent 60%),linear-gradient(160deg,#0f0f1f,#0a0a0a)", accent: "#a09bfe" },
  { name: "48H Hackathon",       sub: "Code. Ship. Win.",                 bg: "radial-gradient(ellipse at 80% 50%,rgba(253,121,168,.1),transparent 60%),linear-gradient(160deg,#1a0f14,#0a0a0a)", accent: "#fd79a8", wide: true },
];

function ScrollSection({ id }) {
  return (
    <section id={id} style={{ background: "#000" }}>
      <ContainerScroll
        titleComponent={
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ marginBottom: "8px" }}
          >
            <p style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8ff47", marginBottom: "14px" }}>
              The Arena
            </p>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.5rem,6vw,5.5rem)", color: "#fff", lineHeight: 0.93, letterSpacing: "-0.02em", marginBottom: "18px" }}>
              One campus.<br /><em style={{ color: "rgba(255,255,255,0.7)" }}>Infinite universe.</em>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", lineHeight: 1.75, maxWidth: "460px", margin: "0 auto", fontWeight: 300 }}>
              Three days. Hundreds of events. Every discipline, every frontier.
            </p>
          </motion.div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "1fr 1fr", height: "100%", gap: "2px", background: "#1a1a1a", padding: "2px" }}>
          {CARD_EVENTS.map(({ name, sub, bg, accent, wide }) => (
            <motion.div
              key={name}
              whileHover={{ scale: 0.985, transition: { duration: 0.2 } }}
              style={{ background: bg, gridColumn: wide ? "span 2" : undefined, position: "relative", overflow: "hidden", padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "default", minHeight: "150px" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: accent }} />
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: wide ? "1.6rem" : "1.2rem", color: "#fff", lineHeight: 1.1, marginBottom: "6px", position: "relative", zIndex: 1 }}>{name}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", position: "relative", zIndex: 1 }}>{sub}</div>
            </motion.div>
          ))}
        </div>
      </ContainerScroll>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   EVENTS GRID
═══════════════════════════════════════════════════ */
const EVENTS = [
  { tag: "FLAGSHIP", name: "Robotics\nGrand Prix",     prize: "₹5,00,000", teams: "128 teams",  accent: "#00ffb4" },
  { tag: "AI · ML",  name: "Neural\nChallenge",         prize: "₹3,00,000", teams: "200 teams",  accent: "#e8ff47" },
  { tag: "SPACE",    name: "Satellite\nDesign Comp.",   prize: "₹4,00,000", teams: "64 teams",   accent: "#ffd166" },
  { tag: "HACK",     name: "48H\nHackathon",            prize: "₹6,00,000", teams: "500+ teams", accent: "#ff5050" },
  { tag: "DRONE",    name: "FPV Racing\nLeague",        prize: "₹2,50,000", teams: "80 teams",   accent: "#a09bfe" },
  { tag: "QUANTUM",  name: "Quantum\nComputing Lab",    prize: "₹1,50,000", teams: "48 teams",   accent: "#fd79a8" },
];

function EventCard({ tag, name, prize, teams, accent, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: "relative", overflow: "hidden", background: "#0f0f0f", padding: "36px 30px", aspectRatio: "3/4", display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "default" }}
    >
      {/* Top accent */}
      <motion.div animate={{ scaleX: hovered ? 1 : 0.3, originX: 0 }} transition={{ duration: 0.4 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: accent }} />

      {/* Tag */}
      <div style={{ position: "absolute", top: 24, left: 30, fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{tag}</div>

      {/* Name with parallax */}
      <motion.div style={{ y, position: "relative", zIndex: 1, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.5rem,2.5vw,2.2rem)", color: "#fff", lineHeight: 1.05 }}>
          {name.split("\n").map((l, i) => <span key={i} style={{ display: "block" }}>{l}</span>)}
        </div>
      </motion.div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: accent }}>{prize}</div>
        <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>{teams}</div>
      </div>

      {/* BG circle deco */}
      <motion.svg
        animate={{ scale: hovered ? 1.1 : 1, opacity: hovered ? 0.15 : 0.08 }}
        transition={{ duration: 0.6 }}
        style={{ position: "absolute", right: 0, top: 0, width: "60%", height: "auto", color: accent }}
        viewBox="0 0 200 180" fill="none"
      >
        <circle cx="160" cy="40" r="80" stroke="currentColor" strokeWidth="0.5"/>
        <circle cx="160" cy="40" r="50" stroke="currentColor" strokeWidth="0.5"/>
        <circle cx="160" cy="40" r="25" stroke="currentColor" strokeWidth="0.8"/>
      </motion.svg>
    </motion.div>
  );
}

function Events({ id }) {
  return (
    <section id={id} style={{ padding: "120px 0", background: "#000" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 40px" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8ff47", marginBottom: "12px" }}>Competitions & Exhibits</p>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.5rem,5vw,5rem)", color: "#fff", lineHeight: 0.93, letterSpacing: "-0.02em", marginBottom: "56px" }}>
            The Arena
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2px" }}>
          {EVENTS.map((e, i) => <EventCard key={e.name} {...e} index={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════ */
const TL = [
  { day: "Day 01", time: "09 AM", title: "Opening Ceremony",    desc: "World-class keynotes. The universe begins.",         loc: "Convocation Hall",  color: "#e8ff47" },
  { day: "Day 01", time: "02 PM", title: "Robotics Qualifiers", desc: "64 teams. Autonomous machines. Real obstacles.",      loc: "Sports Complex",    color: "#00ffb4" },
  { day: "Day 02", time: "10 AM", title: "AI Symposium",        desc: "LLMs, generative AI, neural frontiers discussed.",    loc: "Lecture Hall",      color: "#ff5050" },
  { day: "Day 02", time: "07 PM", title: "Hackathon Kick-off",  desc: "500 hackers. 48 hours. Zero sleep.",                  loc: "Innovation Hub",    color: "#a09bfe" },
  { day: "Day 03", time: "04 PM", title: "Grand Finale",        desc: "Champions crowned. Discoveries celebrated.",          loc: "Main Stage",        color: "#ffd166" },
];

function Timeline({ id }) {
  return (
    <section id={id} style={{ padding: "120px 40px", background: "#050505" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8ff47", marginBottom: "12px" }}>Schedule</p>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.5rem,5vw,5rem)", color: "#fff", lineHeight: 0.93, letterSpacing: "-0.02em", marginBottom: "72px" }}>
            3 Days.<br /><em style={{ color: "rgba(255,255,255,0.65)" }}>Infinite Sparks.</em>
          </h2>
        </motion.div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom,transparent,rgba(255,255,255,0.12) 10%,rgba(255,255,255,0.12) 90%,transparent)", transform: "translateX(-50%)" }} />
          {TL.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "56px", position: "relative" }}
            >
              {/* Node */}
              <motion.div
                whileInView={{ scale: [0, 1.3, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 + 0.2 }}
                style={{ position: "absolute", left: "50%", top: "18px", width: "12px", height: "12px", borderRadius: "50%", background: item.color, boxShadow: `0 0 12px ${item.color}88`, transform: "translateX(-50%)", border: "2px solid #050505" }}
              />
              {i % 2 === 0 ? (
                <>
                  <div style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)", padding: "24px 28px", borderRight: `2px solid ${item.color}` }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: item.color, marginBottom: "8px" }}>{item.day} · {item.time}</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.25rem", color: "#fff", marginBottom: "8px" }}>{item.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: "10px" }}>{item.desc}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>📍 {item.loc}</div>
                  </div>
                  <div />
                </>
              ) : (
                <>
                  <div />
                  <div style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)", padding: "24px 28px", borderLeft: `2px solid ${item.color}` }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: item.color, marginBottom: "8px" }}>{item.day} · {item.time}</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.25rem", color: "#fff", marginBottom: "8px" }}>{item.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: "10px" }}>{item.desc}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>📍 {item.loc}</div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SPEAKERS
═══════════════════════════════════════════════════ */
const SPK = [
  { init: "RV", name: "Dr. Raj Varma",     role: "Chief AI Scientist · DeepMind",  topic: "Future of AGI",       hue: 180 },
  { init: "SN", name: "Sunita Narayan",    role: "NASA Jet Propulsion Lab",         topic: "Mars Colonization",   hue: 40  },
  { init: "AK", name: "Aryan Khanna",      role: "Founder · Quantum Nexus",         topic: "Quantum Computing",   hue: 270 },
  { init: "PM", name: "Prof. Priya Mehta", role: "MIT Media Lab",                   topic: "Human-AI Symbiosis",  hue: 200 },
  { init: "JL", name: "Dr. Jin Li",        role: "CERN · Switzerland",              topic: "Particle Physics",    hue: 340 },
  { init: "VR", name: "Vikram Rajan",      role: "Tesla Autopilot Lead",            topic: "Autonomous Systems",  hue: 90  },
];

function Speakers({ id }) {
  const doubled = [...SPK, ...SPK];
  return (
    <section id={id} style={{ padding: "120px 0", background: "#000", overflow: "hidden" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto 60px", padding: "0 40px" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8ff47", marginBottom: "12px" }}>Luminaries</p>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.5rem,5vw,5rem)", color: "#fff", lineHeight: 0.93, letterSpacing: "-0.02em" }}>
            Voices from<br /><em style={{ color: "rgba(255,255,255,0.65)" }}>the Edge</em>
          </h2>
        </motion.div>
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "100px", background: "linear-gradient(to right, #000, transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "100px", background: "linear-gradient(to left, #000, transparent)", zIndex: 2, pointerEvents: "none" }} />
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ display: "flex", gap: "16px", width: "max-content" }}
          whileHover={{ animationPlayState: "paused" }}
        >
          {doubled.map((s, i) => (
            <motion.div key={i} whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{ flexShrink: 0, width: "210px", padding: "26px 22px", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)", cursor: "default" }}
            >
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: `hsla(${s.hue},60%,10%,1)`, border: `1px solid hsla(${s.hue},60%,30%,1)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: "1rem", color: `hsl(${s.hue},80%,70%)`, marginBottom: "14px" }}>{s.init}</div>
              <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{s.name}</div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 300, lineHeight: 1.5, marginBottom: "14px" }}>{s.role}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: `hsl(${s.hue},60%,60%)`, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>{s.topic}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   REGISTER CTA
═══════════════════════════════════════════════════ */
function Register({ id }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const [tab, setTab] = useState("participant");

  return (
    <section id={id} ref={ref} style={{ position: "relative", padding: "160px 40px", background: "#050505", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Perspective grid bg */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(232,255,71,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(232,255,71,.03) 1px,transparent 1px)", backgroundSize: "60px 60px", transform: "perspective(600px) rotateX(55deg) translateY(10%)", transformOrigin: "bottom center", pointerEvents: "none" }} />
      <motion.div style={{ y, position: "relative", zIndex: 2, textAlign: "center", maxWidth: "640px", width: "100%" }}>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8ff47", marginBottom: "16px" }}>
          Registrations Open
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(3rem,9vw,7.5rem)", color: "#fff", lineHeight: 0.9, letterSpacing: "-0.025em", marginBottom: "28px" }}
        >
          Be part<br /><em style={{ color: "#e8ff47" }}>of history.</em>
        </motion.h2>

        {/* Toggle */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <LG style={{ borderRadius: "9999px", padding: "6px", display: "inline-flex", gap: "4px", marginBottom: "32px" }}>
            {["participant", "volunteer"].map(t => (
              <motion.button
                key={t} onClick={() => setTab(t)}
                style={{
                  borderRadius: "9999px", padding: "8px 24px", cursor: "pointer", border: "none",
                  background: tab === t ? "#e8ff47" : "transparent",
                  color: tab === t ? "#000" : "rgba(255,255,255,0.55)",
                  fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >{t}</motion.button>
            ))}
          </LG>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.75 }}>
              {tab === "participant"
                ? "Compete in 200+ events. Win from a ₹1 Crore+ prize pool. Free entry for all registered participants."
                : "Be the backbone of Asia's biggest S&T festival. Shape the experience for 150,000+ attendees."}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
        >
          <MagneticBtn>
            <motion.div
              whileHover={{ background: "#d4eb00" }}
              style={{ borderRadius: "9999px", padding: "14px 40px", background: "#e8ff47", color: "#000", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", transition: "background 0.2s" }}
            >
              Apply Now →
            </motion.div>
          </MagneticBtn>
          <MagneticBtn>
            <LG style={{ borderRadius: "9999px", padding: "14px 40px", cursor: "pointer" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.06em" }}>Learn More</span>
            </LG>
          </MagneticBtn>
        </motion.div>

        <p style={{ marginTop: "28px", fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
          Free Entry · Accommodation Available · ₹1 Crore+ in Prizes
        </p>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#030303", padding: "72px 40px 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "48px", maxWidth: 1200, margin: "0 auto 56px", paddingBottom: "56px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.6rem", color: "#fff", marginBottom: "14px" }}>Techfest<span style={{ color: "#e8ff47" }}>.</span></div>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.75 }}>IIT Bombay · Since 1998<br />Asia's Largest Science &amp; Technology Festival</p>
        </div>
        {[["Events", ["Robotics", "AI / ML", "Space Tech", "Hackathon", "Drone Racing"]],
          ["Info",   ["About", "Schedule", "Speakers", "Sponsors", "Press"]],
          ["Connect",["Contact", "Ambassadors", "Volunteer", "Media", "FAQ"]]].map(([hd, links]) => (
          <div key={hd}>
            <div style={{ fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "18px" }}>{hd}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {links.map(l => (
                <motion.a key={l} href="#" whileHover={{ color: "#fff", x: 2 }} transition={{ duration: 0.15 }}
                  style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l}</motion.a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", flexWrap: "wrap", gap: "16px" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>© Techfest, IIT Bombay. All rights reserved.</span>
        <div style={{ display: "flex", gap: "10px" }}>
          {["X", "IN", "YT", "IG"].map(s => (
            <motion.a key={s} href="#" whileHover={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
              style={{ width: 30, height: 30, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", textDecoration: "none", transition: "all 0.2s" }}>{s}</motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════ */
export default function TechfestSite() {
  const [activeSection, setActiveSection] = useState("hero");

  function onNav(section) {
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setActiveSection(section);
  }

  useEffect(() => {
    const sections = ["hero", "events", "schedule", "speakers", "register"];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { threshold: 0.3 });
    sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; background: #000; }
        body { background: #000; color: #fff; overflow-x: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #000; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
      <Nav activeSection={activeSection} onNav={onNav} />
      <Hero id="hero" />
      <Stats />
      <ScrollSection id="events-preview" />
      <Events id="events" />
      <Timeline id="schedule" />
      <Speakers id="speakers" />
      <Register id="register" />
      <Footer />
    </>
  );
}
