'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

type BoxPhase = 'idle' | 'active' | 'gathering' | 'closing' | 'closed';

interface Particle {
  id: number;
  word: string;
  x: number; y: number;
  vx: number; vy: number;
}

const BOUND_W      = 160;
const BOUNCE_H     = 160;
const GAP          = 16;
const BOUND_H      = BOUNCE_H;
const SPEED        = 0.35;
const REP_DIST     = 60;
const REP_FORCE    = 0.25;

const COL_SPACING  = 20;
const COL_X        = BOUND_W / 2;
const COL_BOTTOM_Y = BOUNCE_H - 12;

function colY(i: number) { return COL_BOTTOM_Y - i * COL_SPACING; }

const BOX_CX = BOUND_W / 2;
const BOX_CY = BOUND_H + GAP + 80;

const BOX_DATA = [
  { id: 'define',  label: 'DEFINE',  closedLabel: 'DEFINED',
    words: ['Assumptions','Context','History','Processes','Problem','Constraints'] },
  { id: 'decide',  label: 'DECIDE',  closedLabel: 'DECIDED',
    words: ['Options','Trade-offs','Modeling','ROI','Risk','Sensitivity'] },
  { id: 'deploy',  label: 'DEPLOY',  closedLabel: 'DEPLOYED',
    words: ['Alignment','Ownership','Sequencing','Execution','Measurement','Feedback'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

function createParticles(words: string[]): Particle[] {
  return words.map((word, i) => {
    const angle = rand(0, Math.PI * 2);
    return { id: i, word, x: rand(16, BOUND_W - 16), y: rand(16, BOUNCE_H - 16),
             vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WordParticles
// ─────────────────────────────────────────────────────────────────────────────

interface WordParticlesProps {
  words: string[];
  boxPhase: BoxPhase;
  onGatherDone: () => void;
  onClosingDone: () => void;
  resetKey: number;
}

function WordParticles({ words, boxPhase, onGatherDone, onClosingDone, resetKey }: WordParticlesProps) {
  const particlesRef = useRef<Particle[]>([]);
  const rafRef       = useRef<number | null>(null);
  const frozenRef    = useRef<{ x: number; y: number }[] | null>(null);
  const [, setTick]  = useState(0);
  const gatherFired  = useRef(false);
  const closingFired = useRef(false);

  // When resetKey changes, clear particles so they are recreated fresh on next active/idle phase
  useEffect(() => {
    particlesRef.current = [];
    gatherFired.current  = false;
    closingFired.current = false;
    frozenRef.current    = null;
  }, [resetKey]);

  const animate = useCallback(() => {
    const ps = particlesRef.current;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (p.x <= 0)        { p.x = 0;        p.vx =  Math.abs(p.vx); }
      if (p.x >= BOUND_W)  { p.x = BOUND_W;  p.vx = -Math.abs(p.vx); }
      if (p.y <= 0)        { p.y = 0;        p.vy =  Math.abs(p.vy); }
      if (p.y >= BOUNCE_H) { p.y = BOUNCE_H; p.vy = -Math.abs(p.vy); }
      for (let j = i + 1; j < ps.length; j++) {
        const q = ps[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < REP_DIST && d > 0) {
          const f = ((REP_DIST - d) / REP_DIST) * REP_FORCE;
          const nx = dx / d, ny = dy / d;
          p.vx += nx * f; p.vy += ny * f;
          q.vx -= nx * f; q.vy -= ny * f;
        }
      }
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 0) { p.vx = (p.vx / spd) * SPEED; p.vy = (p.vy / spd) * SPEED; }
      p.x += p.vx; p.y += p.vy;
    }
    setTick(t => t + 1);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (boxPhase === 'idle' || boxPhase === 'active') {
      gatherFired.current  = false;
      closingFired.current = false;
      frozenRef.current    = null;
      if (particlesRef.current.length === 0) particlesRef.current = createParticles(words);
      rafRef.current = requestAnimationFrame(animate);
      return () => { if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxPhase, animate, resetKey]);

  useEffect(() => {
    if (boxPhase !== 'gathering') return;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    frozenRef.current = particlesRef.current.map(p => ({ x: p.x, y: p.y }));
    setTick(t => t + 1);
    if (!gatherFired.current) {
      gatherFired.current = true;
      const t = setTimeout(onGatherDone, 660);
      return () => clearTimeout(t);
    }
  }, [boxPhase, onGatherDone]);

  useEffect(() => {
    if (boxPhase !== 'closing') return;
    setTick(t => t + 1);
    if (!closingFired.current) {
      closingFired.current = true;
      const t = setTimeout(onClosingDone, 560);
      return () => clearTimeout(t);
    }
  }, [boxPhase, onClosingDone]);

  const isGathering = boxPhase === 'gathering';
  const isClosing   = boxPhase === 'closing';
  const frozen      = frozenRef.current;

  return (
    <>
      {particlesRef.current.map((p, idx) => {
        const px = (frozen && (isGathering || isClosing)) ? frozen[p.id].x : p.x;
        const py = (frozen && (isGathering || isClosing)) ? frozen[p.id].y : p.y;
        const gatherX = COL_X;
        const gatherY = colY(idx);
        let targetTransform = 'translate(-50%, -50%)';
        let transition = 'none';

        if (isGathering) {
          const dx = gatherX - px, dy = gatherY - py;
          targetTransform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          transition = `transform 520ms cubic-bezier(0.4,0,0.2,1) ${idx * 40}ms`;
        } else if (isClosing) {
          const dx = BOX_CX - px, dy = BOX_CY - py;
          targetTransform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          transition = `transform 420ms cubic-bezier(0.55,0,1,0.8) ${idx * 25}ms`;
        }

        return (
          <span key={p.id} style={{
            position: 'absolute', left: px, top: py,
            transform: targetTransform, transition,
            whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
            fontSize: '1rem', fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700, letterSpacing: '0.03em', color: '#000',
          }}>
            {p.word}
          </span>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spark
// ─────────────────────────────────────────────────────────────────────────────

function Spark() {
  const pad  = 12;
  const size = 160;
  const total = size + pad * 2;
  const c = pad + 1;
  const rectPath = `path("M ${c} ${c} L ${c + size - 2} ${c} L ${c + size - 2} ${c + size - 2} L ${c} ${c + size - 2} Z")`;
  return (
    <svg style={{ position:'absolute', top:-pad, left:-pad, width:total, height:total,
                  pointerEvents:'none', overflow:'visible', zIndex:10 }}>
      <circle r={3} fill="#000" style={{
        offsetPath: rectPath, offsetDistance: '0%',
        animation: 'sparkOrbit 5s linear infinite',
      } as React.CSSProperties} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StickFigureScene
// ─────────────────────────────────────────────────────────────────────────────

function StickFigureScene({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [sceneKey, setSceneKey] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (active) {
      setDone(false);
      setSceneKey(k => k + 1);
      // Unmount SVG after full animation completes — box returns to perfect state
      const t = setTimeout(() => {
        setDone(true);
        onDone?.();
      }, 4500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active || done) return null;

  return (
    <svg
      key={sceneKey}
      width="160" height="160"
      style={{ position:'absolute', top:0, left:0, overflow:'visible',
               pointerEvents:'none', zIndex:20 }}
    >
      {/* White mask — a white rect behind the hatch gap, only opaque while open */}
      <rect x="161" y="125" width="2" height="35" fill="white"
            style={{ animation: 'maskAppear 4400ms ease-in-out forwards' } as React.CSSProperties} />

      {/* Hatch flap — hinge at (160,125), 35px tall.
          Closed = rotate(0deg): line lies exactly on the right border — perfectly invisible.
          Open  = rotate(-90deg): swings out to the right as a small horizontal flap. */}
      <g style={{
        transformOrigin: '160px 125px',
        animation: 'hatchSequence 4400ms ease-in-out forwards',
      } as React.CSSProperties}>
        <line x1="160" y1="125" x2="160" y2="160"
              stroke="black" strokeWidth="2"/>
      </g>

      {/* Stick figure — emerges from right side, walks right, returns.
          Pre-positioned at hatch exit so it never flashes at (0,0). */}
      <g style={{
        opacity: 0,
        transform: 'translate(164px, 152px)',
        animation: 'figureOpacity 4400ms linear forwards, figureWalkOut 600ms linear 400ms forwards, figureWalkIn 600ms linear 3100ms forwards',
      } as React.CSSProperties}>
        <circle cx="0" cy="-16" r="4" fill="none" stroke="black" strokeWidth="1.5"/>
        <line x1="0" y1="-12" x2="0" y2="0" stroke="black" strokeWidth="1.5"/>
        {/* Left arm */}
        <g style={{
          transformOrigin: '-1px -7px',
          animation: 'armFoldL 800ms ease-in-out 1000ms forwards, armUnfoldL 400ms ease-in-out 3000ms forwards',
        } as React.CSSProperties}>
          <line x1="-1" y1="-7" x2="-8" y2="-4" stroke="black" strokeWidth="1.5"/>
        </g>
        {/* Right arm */}
        <g style={{
          transformOrigin: '1px -7px',
          animation: 'armFoldR 800ms ease-in-out 1000ms forwards, armUnfoldR 400ms ease-in-out 3000ms forwards',
        } as React.CSSProperties}>
          <line x1="1" y1="-7" x2="8" y2="-4" stroke="black" strokeWidth="1.5"/>
        </g>
        {/* Left leg */}
        <g style={{
          transformOrigin: '0px 0px',
          animation: 'legSwingL 280ms linear 400ms 2, legSwingL 280ms linear 3100ms 2',
        } as React.CSSProperties}>
          <line x1="0" y1="0" x2="-5" y2="8" stroke="black" strokeWidth="1.5"/>
        </g>
        {/* Right leg */}
        <g style={{
          transformOrigin: '0px 0px',
          animation: 'legSwingR 280ms linear 400ms 2, legSwingR 280ms linear 3100ms 2',
        } as React.CSSProperties}>
          <line x1="0" y1="0" x2="5" y2="8" stroke="black" strokeWidth="1.5"/>
        </g>
      </g>

      {/* Paper airplane — clips off-screen, no opacity fade */}
      <g style={{
        opacity: 0,
        animation: 'planeAppear 300ms ease-out 1800ms forwards, planeFly 1100ms ease-in 2200ms forwards',
      } as React.CSSProperties}>
        {/*
          Paper airplane viewed from the side, flying right.
          Nose at (0,0). Body sweeps back-left. Upper wing sweeps up-left.
          Lower fold line tucked under. Looks like a thrown paper airplane.
        */}
        {/* Main body / lower wing: nose → tail bottom */}
        <polygon points="0,0 -18,4 -14,1" fill="black"/>
        {/* Upper wing: sweeps back and up */}
        <polygon points="0,0 -18,-3 -14,1" fill="#444"/>
        {/* Crease line along center */}
        <line x1="0" y1="0" x2="-14" y2="1" stroke="white" strokeWidth="0.5"/>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaperPile — persistent small hill of papers, shown to the left of DEFINE box
// ─────────────────────────────────────────────────────────────────────────────
//
// All papers use the same ~10×10px shape as the paper held in hand:
// canonical shape (centered at origin): "-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
// Each paper is translated to its position in the pile (cluster around x=-52, y=156)
// and rotated slightly for a messy heap look.
// Paper 9 is the "top" paper — gets taken. It has crease marks.
//
// Pile coords: papers clustered around (-52, 156).
// Using translate() inside SVG transform to position each paper.

function PaperPile() {
  return (
    <svg
      width="160" height="160"
      style={{ position:'absolute', top:0, left:0, overflow:'visible',
               pointerEvents:'none', zIndex:15 }}
    >
      {/* Ground shadow — small ellipse under pile */}
      <ellipse cx="-52" cy="160" rx="18" ry="3" fill="#ccc" stroke="none"/>

      {/* Paper 1 — bottom layer, far left, tilted */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#555" strokeWidth="0.9"
               transform="translate(-60,156) rotate(-30)"/>

      {/* Paper 2 — bottom layer, far right, tilted other way */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#555" strokeWidth="0.9"
               transform="translate(-44,157) rotate(28)"/>

      {/* Paper 3 — left of center, moderate tilt */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="#f8f8f8" stroke="#555" strokeWidth="0.9"
               transform="translate(-57,154) rotate(-15)"/>

      {/* Paper 4 — right of center, small tilt */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#555" strokeWidth="0.9"
               transform="translate(-47,154) rotate(20)"/>

      {/* Paper 5 — center, slight tilt left */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#444" strokeWidth="0.9"
               transform="translate(-54,153) rotate(-10)"/>

      {/* Paper 6 — slightly right, lean right */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="#f8f8f8" stroke="#444" strokeWidth="0.9"
               transform="translate(-49,153) rotate(12)"/>

      {/* Paper 7 — upper left, sticking out */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#444" strokeWidth="0.9"
               transform="translate(-58,151) rotate(-22)"/>

      {/* Paper 8 — upper right, sticking out slightly */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#444" strokeWidth="0.9"
               transform="translate(-46,151) rotate(18)"/>

      {/* Paper 9 — TOP paper, flat, the one that gets taken. Has crease marks. */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
               fill="white" stroke="#222" strokeWidth="1.1"
               transform="translate(-52,150) rotate(-3)"/>
      {/* Crease marks on top paper */}
      <line x1="-57" y1="143" x2="-48" y2="150" stroke="#ccc" strokeWidth="0.6"/>
      <line x1="-47" y1="142" x2="-51" y2="149" stroke="#ccc" strokeWidth="0.6"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DefineScene
// ─────────────────────────────────────────────────────────────────────────────

function DefineScene({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [sceneKey, setSceneKey] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (active) {
      setDone(false);
      setSceneKey(k => k + 1);
      // Total scene ~5000ms; unmount at 5100ms, fire onDone at 5000ms
      const tDone = setTimeout(() => { onDone?.(); }, 5000);
      const tUnmount = setTimeout(() => setDone(true), 5100);
      return () => { clearTimeout(tDone); clearTimeout(tUnmount); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active || done) return null;

  // Timeline (all times relative to SVG mount):
  // 0ms       — hatch starts opening
  // 400ms     — figure starts walking left (600ms walk → arrives ~1000ms)
  // 1000ms    — figure arrives at pile, dives forward
  // 1000–2700ms rummage (body tilted in pile)
  // 2700ms    — figure resurfaces upright
  // 3000ms    — upright, paper in hand
  // 3300ms    — figure walks back (600ms → arrives ~3900ms)
  // ~3900ms   — figure clips into box, hatch starts closing
  // 5000ms    — total, onDone fires

  // ── PILE PAPER POSITIONS IN SCENE (match PaperPile exactly) ──
  // Each nudge paper overlays the corresponding PaperPile paper.
  // They use the same transform= attribute, but with additional CSS animation for nudge.
  // The "top paper" (Paper 9) uses topPaperHide to vanish when picked up.
  // Falling paper: top paper's rendered position is translate(-52,150) rotate(-3).
  // After applying transform, approximate SVG coords of the polygon center ≈ (-52, 145).
  // The falling paper starts 160px above that, drops down to match.

  return (
    <svg
      key={sceneKey}
      width="160" height="160"
      style={{ position:'absolute', top:0, left:0, overflow:'visible',
               pointerEvents:'none', zIndex:20 }}
    >
      {/* White mask — hides left-border gap while hatch is open */}
      <rect x="-2" y="120" width="2" height="35" fill="white"
            style={{ animation: 'defineMaskAppear 5000ms ease-in-out forwards' } as React.CSSProperties} />

      {/* Hatch flap — hinge at (0,120), 35px tall */}
      <g style={{
        transformOrigin: '0px 120px',
        animation: 'defineHatchSequence 5000ms ease-in-out forwards',
      } as React.CSSProperties}>
        <line x1="0" y1="120" x2="0" y2="155" stroke="black" strokeWidth="2"/>
      </g>

      {/* ── PILE PAPERS IN SCENE — same shape+transform as PaperPile, gentle nudge during rummage ── */}
      {/* These overlay PaperPile's static papers during the scene. */}

      {/* Nudge A — paper 3 (left of center) */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
        style={{ animation: 'nudgeA 5000ms ease-in-out forwards' } as React.CSSProperties}
        fill="#f8f8f8" stroke="#555" strokeWidth="0.9"
        transform="translate(-57,154) rotate(-15)"/>

      {/* Nudge B — paper 4 (right of center) */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
        style={{ animation: 'nudgeB 5000ms ease-in-out forwards' } as React.CSSProperties}
        fill="white" stroke="#555" strokeWidth="0.9"
        transform="translate(-47,154) rotate(20)"/>

      {/* Nudge C — paper 7 (upper left) */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
        style={{ animation: 'nudgeC 5000ms ease-in-out forwards' } as React.CSSProperties}
        fill="white" stroke="#444" strokeWidth="0.9"
        transform="translate(-58,151) rotate(-22)"/>

      {/* ── PAPER 9 (TOP) — hides when figure picks it up ── */}
      {/* Same polygon + transform as Paper 9 in PaperPile.
          Covers static Paper 9 during scene. Vanishes at 60% (3000ms) when picked up. */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
        style={{ animation: 'topPaperHide 5000ms linear forwards' } as React.CSSProperties}
        fill="white" stroke="#222" strokeWidth="1.1"
        transform="translate(-52,150) rotate(-3)"/>
      {/* Crease marks on top paper */}
      <line x1="-57" y1="143" x2="-48" y2="150" stroke="#ccc" strokeWidth="0.6"
        style={{ animation: 'topPaperHide 5000ms linear forwards' } as React.CSSProperties}/>
      <line x1="-47" y1="142" x2="-51" y2="149" stroke="#ccc" strokeWidth="0.6"
        style={{ animation: 'topPaperHide 5000ms linear forwards' } as React.CSSProperties}/>

      {/* ── FALLING PAPER — same shape as Paper 9, falls from above screen ── */}
      {/* Paper 9 rendered center is approximately at SVG coords (-52, 145).
          We place the falling paper starting 160px above that (y-160), and drop by 160px.
          Using a plain polygon (no transform attr) translated via keyframes only. */}
      <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
        style={{
          animation: 'paperFall 5000ms ease-in-out forwards',
          transformOrigin: '-52px -15px',
        } as React.CSSProperties}
        fill="white" stroke="#222" strokeWidth="1.1"
        transform="translate(-52,-10) rotate(-3)"/>
      <line x1="-57" y1="-17" x2="-48" y2="-10" stroke="#ccc" strokeWidth="0.6"
        style={{
          animation: 'paperFall 5000ms ease-in-out forwards',
          transformOrigin: '-52px -15px',
        } as React.CSSProperties}
        transform="translate(-52,-10) rotate(-3)"/>
      <line x1="-47" y1="-18" x2="-51" y2="-11" stroke="#ccc" strokeWidth="0.6"
        style={{
          animation: 'paperFall 5000ms ease-in-out forwards',
          transformOrigin: '-52px -15px',
        } as React.CSSProperties}
        transform="translate(-52,-10) rotate(-3)"/>

      {/* ── STICK FIGURE ── */}
      {/* Outer group: handles walk translation. Pre-positioned at hatch exit.
          Walk pace matches DEPLOY figure: 600ms for ~48px → same visual speed.
          Walk out: -4→-52px (48px @ 600ms). Walk in: -52→-4px (48px @ 600ms). */}
      <g style={{
        opacity: 0,
        transform: 'translate(-4px, 152px)',
        animation: [
          'defineFigureOpacity 5000ms linear forwards',
          'defineFigureWalkOut 600ms linear 400ms forwards',
          'defineFigureWalkIn  600ms linear 3300ms forwards',
        ].join(', '),
      } as React.CSSProperties}>

        {/* Inner group: handles body tilt for the dive + resurface.
            Arrives at pile at 1000ms (20%), dives by 1400ms (28%),
            resurfaces upright by 3000ms (60%), walks back from 3300ms. */}
        <g style={{
          transformOrigin: '0px 0px',
          animation: 'defineDive 5000ms ease-in-out forwards',
        } as React.CSSProperties}>

          {/* Head — stays attached to body, tilts naturally with it during dive */}
          <circle cx="0" cy="-16" r="4" fill="none" stroke="black" strokeWidth="1.5"/>

          {/* Body */}
          <line x1="0" y1="-12" x2="0" y2="0" stroke="black" strokeWidth="1.5"/>

          {/* Left arm — folds forward on dive, returns on resurface */}
          <g style={{
            transformOrigin: '-1px -7px',
            animation: 'defineArmBendL 400ms ease-in 1000ms forwards, defineArmReturnL 400ms ease-out 2700ms forwards',
          } as React.CSSProperties}>
            <line x1="-1" y1="-7" x2="-8" y2="-4" stroke="black" strokeWidth="1.5"/>
          </g>
          {/* Right arm */}
          <g style={{
            transformOrigin: '1px -7px',
            animation: 'defineArmBendR 400ms ease-in 1000ms forwards, defineArmReturnR 400ms ease-out 2700ms forwards',
          } as React.CSSProperties}>
            <line x1="1" y1="-7" x2="8" y2="-4" stroke="black" strokeWidth="1.5"/>
          </g>

          {/* Left leg — swings on walk, kicks up on dive, swings on walk back */}
          <g style={{
            transformOrigin: '0px 0px',
            animation: 'legSwingR 280ms linear 400ms 2, defineLegKickL 400ms ease-in 1000ms forwards, legSwingR 280ms linear 3300ms 2',
          } as React.CSSProperties}>
            <line x1="0" y1="0" x2="-5" y2="8" stroke="black" strokeWidth="1.5"/>
          </g>
          {/* Right leg */}
          <g style={{
            transformOrigin: '0px 0px',
            animation: 'legSwingL 280ms linear 400ms 2, defineLegKickR 400ms ease-in 1000ms forwards, legSwingL 280ms linear 3300ms 2',
          } as React.CSSProperties}>
            <line x1="0" y1="0" x2="5" y2="8" stroke="black" strokeWidth="1.5"/>
          </g>

          {/* Paper in hand — same ~10×10px shape, appears after resurfacing at 3000ms */}
          <g style={{
            opacity: 0,
            animation: 'definePaperPickup 200ms ease-out 3000ms forwards',
          } as React.CSSProperties}>
            <polygon points="-5,-8 4,-9 5,-4 3,-1 -5,-2 -6,-6"
                     fill="white" stroke="black" strokeWidth="1"/>
            <line x1="-4" y1="-7" x2="3" y2="-7" stroke="#bbb" strokeWidth="0.5"/>
            <line x1="-4" y1="-5" x2="3" y2="-5" stroke="#bbb" strokeWidth="0.5"/>
          </g>

        </g>{/* end inner tilt group */}
      </g>{/* end outer walk group */}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Box
// ─────────────────────────────────────────────────────────────────────────────

interface BoxProps {
  label: string;
  closedLabel: string;
  words: string[];
  boxPhase: BoxPhase;
  onGatherDone: () => void;
  onClosingDone: () => void;
  onClick: () => void;
  showScene?: boolean;
  showDefineScene?: boolean;
  isPileBox?: boolean;
  onDeployDone?: () => void;
  onDefineDone?: () => void;
  isShaking?: boolean;
  resetKey: number;
}

function Box({ label, closedLabel, words, boxPhase, onGatherDone, onClosingDone, onClick,
               showScene, showDefineScene, isPileBox, onDeployDone, onDefineDone,
               isShaking, resetKey }: BoxProps) {
  const isClosed  = boxPhase === 'closed';
  const isActive  = boxPhase === 'active';
  const showWords = boxPhase !== 'closed';

  return (
    <div
      onClick={isActive ? onClick : undefined}
      style={{
        position: 'relative', width: 160, height: 160, flexShrink: 0,
        cursor: isActive ? 'pointer' : 'default', userSelect: 'none',
        animation: isShaking ? 'boxShake 500ms ease-in-out forwards' : 'none',
      }}
    >
      {/* Word zone */}
      <div style={{ position:'absolute', bottom:`calc(100% + ${GAP}px)`, left:0,
                    width:BOUND_W, height:BOUND_H, pointerEvents:'none' }}>
        {showWords && (
          <WordParticles words={words} boxPhase={boxPhase}
            onGatherDone={onGatherDone} onClosingDone={onClosingDone}
            resetKey={resetKey} />
        )}
      </div>

      {/* Clip wrapper — catches words entering box */}
      <div style={{ position:'absolute', top:-GAP, left:0, width:160, height:160+GAP, overflow:'hidden' }}>
        {/* Visual box */}
        <div style={{ position:'absolute', top:GAP, left:0, width:160, height:160,
                      border:'2px solid black', background:'white',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      overflow:'visible' }}>
          <span
            className={isClosed ? 'font-black' : 'font-normal'}
            style={{ fontSize:'1.35rem', fontFamily:'var(--font-mono, monospace)',
                     letterSpacing:'0.1em', color:'#000', userSelect:'none',
                     textAlign:'center', display:'block', width:'100%',
                     padding:'0 6px', boxSizing:'border-box' }}
          >
            {isClosed ? closedLabel : label}
          </span>
        </div>
      </div>

      {/* Spark — outside clip wrapper */}
      {isActive && <Spark />}

      {/* Stick figure scene — only on DEPLOY box after all closed */}
      {showScene && <StickFigureScene active={!!showScene} onDone={onDeployDone} />}

      {/* Persistent paper pile — always visible on the DEFINE box */}
      {isPileBox && <PaperPile />}

      {/* Define scene — only on DEFINE box after DEPLOY scene completes */}
      {showDefineScene && <DefineScene active={!!showDefineScene} onDone={onDefineDone} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreensaverHero
// ─────────────────────────────────────────────────────────────────────────────

export default function ScreensaverHero() {
  const [phases, setPhases] = useState<[BoxPhase, BoxPhase, BoxPhase]>(['active','idle','idle']);
  const [defineSceneActive, setDefineSceneActive] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  // Incrementing this forces WordParticles to clear and recreate particles on loop reset
  const [resetKey, setResetKey] = useState(0);

  const handleDeployDone = useCallback(() => {
    setDefineSceneActive(true);
  }, []);

  const handleDefineDone = useCallback(() => {
    // 1. Trigger shake on all 3 boxes
    setIsShaking(true);
    // 2. After shake settles (~500ms), reset everything for a new loop
    setTimeout(() => {
      setIsShaking(false);
      setDefineSceneActive(false);
      // Bump resetKey so WordParticles clears and recreates particles
      setResetKey(k => k + 1);
      // Reset phases: DEFINE goes active, others go idle
      setPhases(['active', 'idle', 'idle']);
    }, 500);
  }, []);

  const handleClick = useCallback((i: number) => {
    setPhases(prev => { const n = [...prev] as [BoxPhase,BoxPhase,BoxPhase]; n[i]='gathering'; return n; });
  }, []);

  const handleGatherDone = useCallback((i: number) => {
    setPhases(prev => { const n = [...prev] as [BoxPhase,BoxPhase,BoxPhase]; n[i]='closing'; return n; });
  }, []);

  const handleClosingDone = useCallback((i: number) => {
    setPhases(prev => {
      const n = [...prev] as [BoxPhase,BoxPhase,BoxPhase];
      n[i] = 'closed';
      if (i + 1 < n.length) n[i+1] = 'active';
      return n;
    });
  }, []);

  const allClosed = phases.every(p => p === 'closed');

  return (
    <>
      <style>{`
        @keyframes sparkOrbit {
          from { offset-distance: 0%;   }
          to   { offset-distance: 100%; }
        }

        /* Hatch: 0deg = closed (line on border, invisible). -90deg = open (flap sticks right).
           Hinge at (160,125). */
        @keyframes hatchSequence {
          0%    { transform: rotate(0deg);   }
          11.4% { transform: rotate(-90deg); }
          81.8% { transform: rotate(-90deg); }
          93.2% { transform: rotate(0deg);   }
          100%  { transform: rotate(0deg);   }
        }

        /* White mask: hidden at start and end so border looks perfect when closed */
        @keyframes maskAppear {
          0%    { opacity: 0; }
          5%    { opacity: 1; }
          88%   { opacity: 1; }
          95%   { opacity: 0; }
          100%  { opacity: 0; }
        }

        /* Figure: fully opaque while visible, snaps to 0 right as it steps back through border */
        @keyframes figureOpacity {
          0%    { opacity: 0; }
          8%    { opacity: 1; }
          84%   { opacity: 1; }
          84.1% { opacity: 0; }
          100%  { opacity: 0; }
        }

        /* Figure walks on the floor (box bottom = y=160, crotch anchor y=152) */
        @keyframes figureWalkOut {
          from { transform: translate(164px, 152px); }
          to   { transform: translate(200px, 152px); }
        }
        @keyframes figureWalkIn {
          from { transform: translate(200px, 152px); }
          to   { transform: translate(164px, 152px); }
        }

        /* Leg swing — rotate around hip (0,0) in leg-group local space */
        @keyframes legSwingL {
          0%   { transform: rotate(-25deg); }
          50%  { transform: rotate(25deg);  }
          100% { transform: rotate(-25deg); }
        }
        @keyframes legSwingR {
          0%   { transform: rotate(25deg);  }
          50%  { transform: rotate(-25deg); }
          100% { transform: rotate(25deg);  }
        }

        /* Arm fold — arms come together as if holding paper airplane */
        @keyframes armFoldL {
          0%   { transform: rotate(0deg);  }
          60%  { transform: rotate(50deg); }
          100% { transform: rotate(45deg); }
        }
        @keyframes armFoldR {
          0%   { transform: rotate(0deg);   }
          60%  { transform: rotate(-50deg); }
          100% { transform: rotate(-45deg); }
        }
        @keyframes armUnfoldL {
          from { transform: rotate(45deg);  }
          to   { transform: rotate(0deg);   }
        }
        @keyframes armUnfoldR {
          from { transform: rotate(-45deg); }
          to   { transform: rotate(0deg);   }
        }

        /* Plane appears at figure's raised hands (x=208, y=135), then flies a parabola:
           starts horizontal/slight climb, then banks steeply upward like a growth curve.
           No opacity fade — it clips off-screen naturally (SVG overflow:visible + far translate). */
        @keyframes planeAppear {
          from { opacity: 0; transform: translate(210px, 138px) scale(0.4) rotate(0deg); }
          to   { opacity: 1; transform: translate(210px, 138px) scale(1)   rotate(0deg); }
        }
        @keyframes planeFly {
          0%   { transform: translate(210px, 138px) rotate(0deg);   }
          20%  { transform: translate(270px, 130px) rotate(-8deg);  }
          45%  { transform: translate(340px, 100px) rotate(-30deg); }
          70%  { transform: translate(420px,  48px) rotate(-62deg); }
          100% { transform: translate(560px, -80px) rotate(-85deg); }
        }

        /* ── DefineScene ── */
        /* Total = 5000ms. Timeline:
           0ms     hatch opens
           400ms   figure walks out (600ms → arrives 1000ms)
           1000ms  arrives at pile, dives forward (28%)
           1000–2700ms rummage (head bobs 3×)
           2700ms  resurface (60%)
           3000ms  upright, paper in hand
           3300ms  walks back (600ms → arrives 3900ms)
           3900ms  clips into box (78%), hatch closes
           5000ms  total */

        /* Hatch opens at 9% (450ms), stays open until 79% (3950ms), closes by 90% (4500ms) */
        @keyframes defineHatchSequence {
          0%   { transform: rotate(0deg);  }
          9%   { transform: rotate(90deg); }
          79%  { transform: rotate(90deg); }
          90%  { transform: rotate(0deg);  }
          100% { transform: rotate(0deg);  }
        }

        @keyframes defineMaskAppear {
          0%    { opacity: 0; }
          5%    { opacity: 1; }
          80%   { opacity: 1; }
          91%   { opacity: 0; }
          100%  { opacity: 0; }
        }

        /* Figure snaps invisible at 78% (3900ms = walk-in complete) */
        @keyframes defineFigureOpacity {
          0%    { opacity: 0; }
          9%    { opacity: 1; }
          78%   { opacity: 1; }
          78.1% { opacity: 0; }
          100%  { opacity: 0; }
        }

        /* Walk out to pile (pile center x=-52, 48px from box left).
           Walk back same distance. Both 600ms — same pace as DEPLOY figure. */
        @keyframes defineFigureWalkOut {
          from { transform: translate(-4px,  152px); }
          to   { transform: translate(-52px, 152px); }
        }
        @keyframes defineFigureWalkIn {
          from { transform: translate(-52px, 152px); }
          to   { transform: translate(-4px,  152px); }
        }

        /* Body tilts forward 60° when diving (arrives 1000ms=20%, tilts by 1400ms=28%).
           Stays in pile until 2700ms=54%. Resurfaces upright by 3000ms=60%. */
        @keyframes defineDive {
          0%   { transform: rotate(0deg);  }
          20%  { transform: rotate(0deg);  }
          28%  { transform: rotate(60deg); }
          54%  { transform: rotate(60deg); }
          60%  { transform: rotate(0deg);  }
          100% { transform: rotate(0deg);  }
        }

        /* Arms flail forward on dive, return on resurface */
        @keyframes defineArmBendL {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(-80deg); }
        }
        @keyframes defineArmBendR {
          from { transform: rotate(0deg);  }
          to   { transform: rotate(80deg); }
        }
        @keyframes defineArmReturnL {
          from { transform: rotate(-80deg); }
          to   { transform: rotate(0deg);   }
        }
        @keyframes defineArmReturnR {
          from { transform: rotate(80deg); }
          to   { transform: rotate(0deg);  }
        }

        /* Legs kick UP when diving */
        @keyframes defineLegKickL {
          from { transform: rotate(0deg);    }
          to   { transform: rotate(-100deg); }
        }
        @keyframes defineLegKickR {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(100deg); }
        }

        /* Paper in hand — appears right as figure resurfaces */
        @keyframes definePaperPickup {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Pile papers — gentle nudge during rummage (1000–2700ms), settle back during walk-back.
           nudge = small shift + slight rotation, then return. */
        @keyframes nudgeA {
          0%   { transform: translate(0px,  0px)  rotate(0deg);  }
          20%  { transform: translate(0px,  0px)  rotate(0deg);  }
          32%  { transform: translate(-5px,-4px)  rotate(-8deg); }
          54%  { transform: translate(-5px,-4px)  rotate(-8deg); }
          70%  { transform: translate(0px,  0px)  rotate(0deg);  }
          100% { transform: translate(0px,  0px)  rotate(0deg);  }
        }
        @keyframes nudgeB {
          0%   { transform: translate(0px, 0px)  rotate(0deg); }
          20%  { transform: translate(0px, 0px)  rotate(0deg); }
          36%  { transform: translate(4px,-3px)  rotate(6deg); }
          54%  { transform: translate(4px,-3px)  rotate(6deg); }
          70%  { transform: translate(0px, 0px)  rotate(0deg); }
          100% { transform: translate(0px, 0px)  rotate(0deg); }
        }
        @keyframes nudgeC {
          0%   { transform: translate(0px, 0px)  rotate(0deg);  }
          20%  { transform: translate(0px, 0px)  rotate(0deg);  }
          40%  { transform: translate(-4px, 3px) rotate(-5deg); }
          54%  { transform: translate(-4px, 3px) rotate(-5deg); }
          70%  { transform: translate(0px,  0px) rotate(0deg);  }
          100% { transform: translate(0px,  0px) rotate(0deg);  }
        }

        /* Top paper of pile hides when figure picks it up (at 60% = 3000ms),
           stays hidden until scene unmounts (falling paper takes its place). */
        @keyframes topPaperHide {
          0%    { opacity: 1; }
          59.9% { opacity: 1; }
          60%   { opacity: 0; }
          100%  { opacity: 0; }
        }

        /* Falling paper: starts 160px above its resting position, drops down to land.
           Polygon has base transform="translate(-52,-10) rotate(-3)" to match Paper 9.
           paperFall adds translateY(160px) to land at translate(-52,150) = Paper 9 position. */
        @keyframes paperFall {
          0%   { transform: translateY(0px);    opacity: 0; }
          62%  { transform: translateY(0px);    opacity: 0; }
          65%  { transform: translateY(0px);    opacity: 1; }
          78%  { transform: translateY(160px);  opacity: 1; }
          100% { transform: translateY(160px);  opacity: 1; }
        }

        /* Box shake — quick jitter to celebrate loop reset */
        @keyframes boxShake {
          0%   { transform: translateX(0px);  }
          10%  { transform: translateX(-4px); }
          25%  { transform: translateX(4px);  }
          40%  { transform: translateX(-3px); }
          55%  { transform: translateX(3px);  }
          70%  { transform: translateX(-2px); }
          85%  { transform: translateX(2px);  }
          100% { transform: translateX(0px);  }
        }
      `}</style>

      <div style={{ background:'white', width:'100vw', height:'100vh',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'7rem' }}>
        {BOX_DATA.map((box, i) => (
          <Box
            key={box.id}
            label={box.label}
            closedLabel={box.closedLabel}
            words={box.words}
            boxPhase={phases[i]}
            onClick={() => handleClick(i)}
            onGatherDone={() => handleGatherDone(i)}
            onClosingDone={() => handleClosingDone(i)}
            showScene={box.id === 'deploy' && allClosed}
            onDeployDone={box.id === 'deploy' ? handleDeployDone : undefined}
            showDefineScene={box.id === 'define' && defineSceneActive}
            isPileBox={box.id === 'define'}
            onDefineDone={box.id === 'define' ? handleDefineDone : undefined}
            isShaking={isShaking}
            resetKey={resetKey}
          />
        ))}
      </div>
    </>
  );
}
