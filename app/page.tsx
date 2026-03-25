"use client";

import { useState, useEffect } from "react";
import { content } from "../content";
import {
  SuitcaseSimpleIcon, BrainIcon, TerminalWindowIcon, CertificateIcon, ChatCircleDotsIcon,
  DownloadSimpleIcon, PaperPlaneTiltIcon, PhoneIcon, EnvelopeSimpleIcon, MapPinIcon,
  CompassIcon, RocketIcon, TagIcon, ChartBarIcon, GearIcon, MagnifyingGlassIcon,
  CurrencyDollarIcon, UsersThreeIcon,
  DatabaseIcon, TableIcon, CloudIcon,
} from "@phosphor-icons/react";
import { siPython, siLooker } from "simple-icons";

// ── Mobile detection ──────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── Typewriter word → Twemoji icon ────────────────────────────
const TWEMOJI = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg";
const TYPEWRITER_ICONS: Record<string, React.ReactNode> = {
  "Business Strategist": <img src={`${TWEMOJI}/1f4bc.svg`} width={42} height={42} alt="" />,
  "Guitarist":           <img src={`${TWEMOJI}/1f3b8.svg`} width={42} height={42} alt="" />,
  "Chess Player":        <img src={`${TWEMOJI}/265f.svg`} width={42} height={42} alt="" />,
  "Golfer":              <img src={`${TWEMOJI}/1f3cc.svg`} width={42} height={42} alt="" />,
};

// ── Typewriter ────────────────────────────────────────────────
function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const word = words[wordIdx];
    if (phase === "typing") {
      if (text === word) {
        const t = setTimeout(() => setPhase("pausing"), 1800);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setText(word.slice(0, text.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), 400);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (text === "") {
        setWordIdx((wordIdx + 1) % words.length);
        setPhase("typing");
        return;
      }
      const t = setTimeout(() => setText(text.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
  }, [text, phase, wordIdx, words]);

  const icon = TYPEWRITER_ICONS[words[wordIdx]];
  return (
    <div style={{
      fontFamily: '"Clash Grotesk", "Space Grotesk", sans-serif',
      fontSize: "48px", fontWeight: 500, lineHeight: "1.2em",
      color: "rgb(40,233,140)",
      display: "flex", alignItems: "center", gap: "12px",
      whiteSpace: "nowrap", overflow: "hidden",
      height: "57.6px",
    }}>
      {text}
      <span style={{
        display: "inline-block", backgroundColor: "rgb(163,196,180)",
        width: "4px", height: "38.4px", marginLeft: "4px",
        animation: "blink 1s step-start infinite", flexShrink: 0,
      }} />
      {phase !== "deleting" && text === words[wordIdx] && icon && (
        <span style={{ display: "flex", alignItems: "center", opacity: 1 }}>{icon}</span>
      )}
    </div>
  );
}

// ── Reusable ──────────────────────────────────────────────────
function SocialBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      width: "40px", height: "40px", borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
    >
      {children}
    </a>
  );
}

function Divider() {
  return <div style={{ height: "1px", flexShrink: 0, backgroundColor: "rgb(36,36,36)" }} />;
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", color: "#fff" }}>
      {icon}
      <h2 style={{
        fontFamily: "var(--font-space-grotesk)", fontSize: "24px",
        fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "1.4em", color: "#fff", margin: 0,
      }}>
        {children}
      </h2>
    </div>
  );
}

const dateBadge: React.CSSProperties = {
  padding: "6px 14px", backgroundColor: "rgb(25,25,25)",
  border: "1px solid rgb(48,48,48)", borderRadius: "8px",
  fontSize: "15px", fontWeight: 500, color: "#fff",
  fontFamily: "var(--font-space-grotesk)", whiteSpace: "nowrap", flexShrink: 0,
};

// ── Company / school logos ────────────────────────────────────
const COMPANY_LOGOS: Record<string, { src: string } | { domain: string }> = {
  "Productboard":                              { src: "/logos/productboard.png" },
  "Abbott":                                    { src: "/logos/abbott.png" },
  "PINN Investments":                          { src: "/logos/pinn.png" },
  "University of California, Los Angeles":     { src: "/logos/ucla.png" },
  "Georgia Institute of Technology, Atlanta":  { src: "/logos/gatech.png" },
};

function CompanyLogo({ name, color = "#28e98c" }: { name: string; color?: string }) {
  const entry = COMPANY_LOGOS[name];
  const src = entry
    ? "src" in entry
      ? entry.src
      : `https://www.google.com/s2/favicons?domain=${entry.domain}&sz=64`
    : null;
  return (
    <div style={{
      width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
      backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: "17px", fontWeight: 700, color, fontFamily: "var(--font-space-grotesk)" }}>
            {name.charAt(0)}
          </span>
      }
    </div>
  );
}

// ── Skill icons ───────────────────────────────────────────────
const SKILL_ICONS: Record<string, React.ReactNode> = {
  "Product Strategy":         <CompassIcon size={24} weight="fill" />,
  "Go-to-Market Strategy":    <RocketIcon size={24} weight="fill" />,
  "Pricing Strategy":         <TagIcon size={24} weight="fill" />,
  "Financial Modeling":       <ChartBarIcon size={24} weight="fill" />,
  "Business Operations":      <GearIcon size={24} weight="fill" />,
  "Customer/Market Research": <MagnifyingGlassIcon size={24} weight="fill" />,
  "Monetization":             <CurrencyDollarIcon size={24} weight="fill" />,
  "Stakeholder Alignment":    <UsersThreeIcon size={24} weight="fill" />,
};

// ── Software icons ────────────────────────────────────────────
type IconEntry = { icon: React.ReactNode; bg: string; border: string };

function siBrand(data: { path: string; hex: string }) {
  return <svg role="img" viewBox="0 0 24 24" width={22} height={22} fill={`#${data.hex}`}><path d={data.path} /></svg>;
}

const SawtoothIcon = () => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
    <path d="M3 21V12L4.5 8 6 12V21H3zm.5-10.5h2v1.5h-2v-1.5z" />
    <path d="M7 21l3.5-9 3.5 9H7zm5.5 0L17 9l4.5 12h-9z" />
  </svg>
);

const SOFTWARE_ICONS: Record<string, React.ReactNode> = {
  "Python":                      siBrand(siPython),
  "Looker":                      siBrand(siLooker),
  "SQL":                         <DatabaseIcon size={22} weight="fill" />,
  "Excel (Advanced)":            <TableIcon size={22} weight="fill" />,
  "Salesforce":                  <CloudIcon size={22} weight="fill" />,
  "Sawtooth (Conjoint/Maxdiff)": <SawtoothIcon />,
};

const SKILL_PALETTE = [
  { bg: "rgba(40,233,140,0.1)",  border: "rgba(40,233,140,0.22)",  color: "#28e98c" },
  { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.26)",  color: "#a5b4fc" },
  { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.26)",  color: "#fbbf24" },
  { bg: "rgba(236,72,153,0.1)",  border: "rgba(236,72,153,0.24)",  color: "#f472b6" },
  { bg: "rgba(14,165,233,0.1)",  border: "rgba(14,165,233,0.24)",  color: "#38bdf8" },
  { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.24)",   color: "#f87171" },
  { bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.24)",  color: "#c084fc" },
  { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.24)",   color: "#4ade80" },
];

function SkillGrid({ items, iconMap, max = 8 }: {
  items: { name: string }[];
  iconMap: Record<string, React.ReactNode | IconEntry>;
  max?: number;
}) {
  return (
    <div className="skill-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {items.slice(0, max).map((item, i) => {
        const entry = iconMap[item.name];
        const isEntry = entry && typeof entry === "object" && "bg" in (entry as object);
        const palette = SKILL_PALETTE[i % SKILL_PALETTE.length];
        const icon = isEntry ? (entry as IconEntry).icon : entry as React.ReactNode;
        const boxBg = isEntry ? (entry as IconEntry).bg : palette.bg;
        const boxBorder = isEntry ? (entry as IconEntry).border : palette.border;
        const boxColor = isEntry ? "#fff" : palette.color;
        return (
          <div key={i} style={{
            backgroundColor: "rgb(16,16,16)", border: "1px solid rgb(36,36,36)",
            borderRadius: "12px", padding: "12px 14px",
            display: "flex", flexDirection: "row", alignItems: "center", gap: "12px",
          }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              backgroundColor: boxBg, border: `1px solid ${boxBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, color: boxColor,
            }}>
              {icon ?? <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-space-grotesk)" }}>{item.name.charAt(0)}</span>}
            </div>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#bbb", margin: 0, fontFamily: "var(--font-space-grotesk)" }}>
              {item.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ContactForm() {
  return (
    <form style={{ display: "flex", flexDirection: "column", gap: "12px" }} action="https://formspree.io/f/xyknavzl" method="POST">
      {[
        { placeholder: "Full Name", name: "name", type: "text" },
        { placeholder: "Email", name: "email", type: "email" },
        { placeholder: "Phone Number", name: "phone", type: "tel" },
      ].map((field) => (
        <input key={field.name} type={field.type} name={field.name} placeholder={field.placeholder} style={{
          backgroundColor: "rgb(16,16,16)", border: "1px solid rgb(48,48,48)",
          borderRadius: "8px", padding: "14px 16px",
          color: "#fff", fontSize: "14px", fontFamily: "var(--font-space-grotesk)",
          outline: "none", width: "100%", boxSizing: "border-box",
        }} />
      ))}
      <textarea placeholder="Message" name="message" rows={5} style={{
        backgroundColor: "rgb(16,16,16)", border: "1px solid rgb(48,48,48)",
        borderRadius: "8px", padding: "14px 16px",
        color: "#fff", fontSize: "14px", fontFamily: "var(--font-space-grotesk)",
        outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box",
      }} />
      <button type="submit" style={{
        backgroundColor: "rgb(40,233,140)", color: "rgb(0,0,0)",
        border: "none", borderRadius: "10px", padding: "14px",
        fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-space-grotesk)",
        cursor: "pointer", width: "100%",
      }}>
        Send Message
      </button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="layout-wrapper" style={{
          display: "flex", flexDirection: "row", alignItems: "flex-start",
          gap: "70px", width: "100%", maxWidth: "1440px",
          padding: "60px 40px 80px", boxSizing: "border-box",
        }}>

          {/* ── Left Card ── */}
          <div className="left-card-col" style={{ flex: "1 0 0", maxWidth: "360px", position: "sticky", top: "60px" }}>
            <div style={{
              backgroundColor: "rgb(16,16,16)", borderRadius: "30px",
              border: "1px solid rgba(255,255,255,0.1)", padding: "20px",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "24px", overflow: "hidden",
            }}>
              {/* Photo */}
              <div style={{
                width: "100%", height: "300px", backgroundColor: "#1a1a1a",
                borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}>
                <img src="/Aatum.jpg" alt="Aatum Desai" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              {/* Available badge */}
              {content.availableForWork && (
                <a href="#contact" style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px", borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgb(16,16,16)", width: "100%", justifyContent: "center",
                  textDecoration: "none", cursor: "pointer",
                }}>
                  <div className="pulse-dot" style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: "#28e98c", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "15px", color: "#fff", fontFamily: "var(--font-space-grotesk)", fontWeight: 500 }}>
                    Open to conversations
                  </span>
                </a>
              )}

              {/* Name + socials */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
                <h2 style={{
                  fontFamily: "var(--font-space-grotesk)", fontSize: "28px",
                  fontWeight: 600, letterSpacing: "-0.04em", lineHeight: "1.4em",
                  color: "#fff", margin: 0, textAlign: "center",
                }}>
                  {content.name}
                </h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <SocialBtn href={content.contact.linkedin}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="#fff">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </SocialBtn>
                  <SocialBtn href={content.contact.twitter}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="#fff">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </SocialBtn>
                  <SocialBtn href={content.contact.instagram}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="#fff">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </SocialBtn>
                </div>
              </div>

              {/* Buttons */}
              <div className="desktop-only" style={{ display: "flex", gap: "7px", width: "100%", height: "42px" }}>
                <a href="/Aatum Desai Resume.pdf" download style={{
                  flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "6px", borderRadius: "8px", backgroundColor: "rgb(28,28,28)",
                  color: "rgb(180,180,180)", fontSize: "14px", fontWeight: 500,
                  fontFamily: "var(--font-space-grotesk)", textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  <DownloadSimpleIcon size={17} weight="fill" />
                  Download CV
                </a>
                <a href="#contact" style={{
                  flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "6px", borderRadius: "8px", backgroundColor: "rgb(40,233,140)",
                  color: "rgb(0,0,0)", fontSize: "14px", fontWeight: 600,
                  fontFamily: "var(--font-space-grotesk)", textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  <PaperPlaneTiltIcon size={17} weight="fill" />
                  Contact Me
                </a>
              </div>
            </div>
          </div>

          {/* Divider between card and content — mobile only */}
          <div className="mobile-only-divider" />

          {/* ── Right Content ── */}
          <main className="right-col" style={{ flex: "1 0 0", display: "flex", flexDirection: "column", gap: "40px", minWidth: 0 }}>

            {/* ── Hero ── */}
            <section className="hero-section" style={{
              display: "flex", flexDirection: "column",
              gap: "30px", paddingTop: "80px", width: "100%",
            }}>
              {/* Desktop: full heading block. Hidden on mobile via CSS. */}
              <div className="desktop-only" style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                <p style={{
                  fontSize: "24px", fontWeight: 500, color: "#bbb",
                  fontFamily: "var(--font-space-grotesk)", margin: 0,
                  letterSpacing: "-0.02em", lineHeight: "1.4em",
                }}>
                  Hello there,
                </p>
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <h1 style={{
                    fontFamily: "var(--font-space-grotesk)", fontSize: "52px", fontWeight: 500,
                    letterSpacing: "-0.02em", lineHeight: "1.2em", color: "#fff", margin: 0,
                  }}>
                    {content.heroIntro}
                  </h1>
                  <Typewriter words={content.typewriterWords} />
                  <h1 style={{
                    fontFamily: "var(--font-space-grotesk)", fontSize: "52px", fontWeight: 500,
                    letterSpacing: "-0.02em", lineHeight: "1.2em", color: "#fff", margin: 0,
                  }}>
                    {content.location}
                  </h1>
                </div>
              </div>

              {/* About blurb — desktop only */}
              <p className="desktop-only" style={{
                fontSize: "16px", fontWeight: 400, fontFamily: "var(--font-space-grotesk)",
                lineHeight: "1.6em", letterSpacing: "-0.02em", color: "#fff", margin: 0,
              }}>
                {content.about}
              </p>

              {/* Stats — shown on all screen sizes */}
              {isMobile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                  {[content.stats.slice(0, 2), content.stats.slice(2)].map((row, ri) => (
                    <div key={ri} style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", width: "100%" }}>
                      {row.map((stat, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                          <div style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "30px", fontWeight: 600, color: "#28e98c", lineHeight: 1 }}>{stat.value}</div>
                          <p style={{ fontSize: "16px", fontWeight: 500, fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em", lineHeight: "1.6em", color: "#bbb", margin: 0, textAlign: "center" }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "row", gap: "40px", alignItems: "center", flexWrap: "wrap" }}>
                  {content.stats.map((stat, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "30px", fontWeight: 600, color: "#28e98c", lineHeight: 1 }}>{stat.value}</div>
                      <p style={{ fontSize: "16px", fontWeight: 500, fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em", lineHeight: "1.6em", color: "#bbb", margin: 0 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Divider />

            {/* ── Experience ── */}
            <section id="experience">
              <SectionHeading icon={<SuitcaseSimpleIcon size={24} weight="fill" />}>Experience</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {content.experience.map((job, i) => (
                  <div key={i} className="content-card" style={{
                    backgroundColor: "rgb(16,16,16)", border: "1px solid rgb(48,48,48)",
                    borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column",
                  }}>
                    {/* Header: always visible */}
                    {isMobile ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "8px" }}>
                        <p style={{ fontSize: "17px", fontWeight: 600, color: "#fff", margin: 0, fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em", lineHeight: "1.3em" }}>{job.mobileRole ?? job.role}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <CompanyLogo name={job.company} />
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", justifyContent: "center" }}>
                            <p style={{ fontSize: "14px", color: "#bbb", margin: 0, fontFamily: "var(--font-space-grotesk)", fontWeight: 500, lineHeight: "1.2em" }}>{job.company}</p>
                            <p style={{ fontSize: "13px", color: "#777", margin: 0, fontFamily: "var(--font-space-grotesk)", fontWeight: 400, lineHeight: "1.2em" }}>{job.dates}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                        <CompanyLogo name={job.company} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "20px", fontWeight: 600, color: "#fff", margin: "0 0 2px 0", fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em", lineHeight: "1.2em" }}>{job.role}</p>
                          <p style={{ fontSize: "16px", color: "#bbb", margin: 0, fontFamily: "var(--font-space-grotesk)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "1.3em" }}>{job.company}</p>
                        </div>
                        <div style={dateBadge}>{job.dates}</div>
                      </div>
                    )}
                    {/* Bullets — desktop only */}
                    <div className="desktop-only">
                      <div style={{ height: "1px", backgroundColor: "rgb(48,48,48)", marginBottom: "16px" }} />
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                        {job.bullets.map((bullet, j) => (
                          <li key={j} style={{ display: "flex", gap: "10px", fontSize: "16px", lineHeight: "1.6em", letterSpacing: "-0.02em", color: "#bbb", fontFamily: "var(--font-space-grotesk)", fontWeight: 500 }}>
                            <span style={{ marginTop: "9px", width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#28e98c", flexShrink: 0 }} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Divider />

            {/* ── Skills ── */}
            <section id="skills">
              <SectionHeading icon={<BrainIcon size={24} weight="fill" />}>Skills</SectionHeading>
              <SkillGrid items={content.skills} iconMap={SKILL_ICONS} max={8} />
            </section>

            <Divider />

            {/* ── Software ── */}
            <section id="software">
              <SectionHeading icon={<TerminalWindowIcon size={24} weight="fill" />}>Software</SectionHeading>
              <SkillGrid items={content.software} iconMap={SOFTWARE_ICONS} max={6} />
            </section>

            <Divider />

            {/* ── Education ── */}
            <section id="education">
              <SectionHeading icon={<CertificateIcon size={24} weight="fill" />}>Education</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {content.education.map((edu, i) => (
                  <div key={i} className="content-card" style={{
                    backgroundColor: "rgb(16,16,16)", border: "1px solid rgb(48,48,48)",
                    borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column",
                  }}>
                    {/* Header: always visible */}
                    {isMobile ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "8px" }}>
                        <p style={{ fontSize: "17px", fontWeight: 600, color: "#fff", margin: 0, fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em", lineHeight: "1.3em" }}>{edu.mobileTitle ?? edu.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <CompanyLogo name={edu.institution} color="#a78bfa" />
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", justifyContent: "center" }}>
                            <p style={{ fontSize: "14px", color: "#bbb", margin: 0, fontFamily: "var(--font-space-grotesk)", fontWeight: 500, lineHeight: "1.2em" }}>{edu.institution}</p>
                            <p style={{ fontSize: "13px", color: "#777", margin: 0, fontFamily: "var(--font-space-grotesk)", fontWeight: 400, lineHeight: "1.2em" }}>{edu.dates}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                        <CompanyLogo name={edu.institution} color="#a78bfa" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "20px", fontWeight: 600, color: "#fff", margin: "0 0 2px 0", fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em", lineHeight: "1.2em" }}>{edu.title}</p>
                          <p style={{ fontSize: "16px", color: "#bbb", margin: 0, fontFamily: "var(--font-space-grotesk)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "1.3em" }}>{edu.institution}</p>
                        </div>
                        <div style={dateBadge}>{edu.dates}</div>
                      </div>
                    )}
                    {/* Bullets — desktop only */}
                    <div className="desktop-only">
                      <div style={{ height: "1px", backgroundColor: "rgb(48,48,48)", marginBottom: "16px" }} />
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                        {edu.bullets.map((bullet, j) => (
                          <li key={j} style={{ display: "flex", gap: "10px", fontSize: "16px", lineHeight: "1.6em", letterSpacing: "-0.02em", color: "#bbb", fontFamily: "var(--font-space-grotesk)", fontWeight: 500 }}>
                            <span style={{ marginTop: "9px", width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#28e98c", flexShrink: 0 }} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Divider />

            {/* ── Contact ── */}
            <section id="contact">
              <SectionHeading icon={<ChatCircleDotsIcon size={24} weight="fill" />}>Contact</SectionHeading>

              {/* Heading — desktop only */}
              <h3 className="desktop-only" style={{
                fontFamily: "var(--font-space-grotesk)", fontSize: "28px", fontWeight: 700,
                color: "#fff", margin: "0 0 20px 0", letterSpacing: "-0.02em",
              }}>
                Let&apos;s Get in Touch!
              </h3>

              <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
                {/* Info cards — desktop only */}
                <div className="desktop-only" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "Contact No", value: content.contact.phone, href: `tel:${content.contact.phone}`,
                      icon: <PhoneIcon size={28} weight="fill" color="#28e98c" /> },
                    { label: "Email", value: content.contact.email, href: `mailto:${content.contact.email}`,
                      icon: <EnvelopeSimpleIcon size={28} weight="fill" color="#28e98c" /> },
                    { label: "Address", value: content.contact.address, href: "https://www.google.com/maps",
                      icon: <MapPinIcon size={28} weight="fill" color="#28e98c" /> },
                  ].map((item) => (
                    <div key={item.label} style={{
                      backgroundColor: "rgb(16,16,16)", border: "1px solid rgb(39,39,39)",
                      borderRadius: "12px", padding: "18px 20px",
                      display: "flex", alignItems: "center", gap: "16px",
                    }}>
                      <div style={{ flexShrink: 0, width: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", color: "rgb(187,187,187)", margin: "0 0 4px 0", fontFamily: "var(--font-space-grotesk)" }}>
                          {item.label}
                        </p>
                        <a href={item.href} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: "18px", color: "#fff", fontFamily: "var(--font-space-grotesk)",
                          fontWeight: 400, textDecoration: "none",
                          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.value}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form — always visible */}
                <ContactForm />
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
