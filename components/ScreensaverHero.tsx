'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

type BoxPhase = 'idle' | 'active' | 'gathering' | 'closing' | 'closed';

interface Particle {
  id: number;
  word: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Word bounce zone:
//   BOUNCE area = 160×160 square where physics runs (words never bounce below BOUNCE_H)
//   The zone div is taller: BOUNCE_H + GAP, reaching exactly to the box top border.
//   overflow:hidden on the zone clips words the instant they cross the box border.
const BOUND_W       = 160;
const BOUNCE_H      = 160;    // physics ceiling — words bounce within this square
const GAP           = 16;     // visible gap between word zone bottom and box top
const BOUND_H       = BOUNCE_H; // word zone height (physics area only)
const SPEED         = 0.35;
const REP_DIST      = 60;
const REP_FORCE     = 0.25;

// Column gather: stack centred in BOUND_W, bottom word near physics floor
const COL_SPACING   = 20;
const COL_X         = BOUND_W / 2;
const COL_BOTTOM_Y  = BOUNCE_H - 12; // stay within physics area

function colY(i: number) {
  return COL_BOTTOM_Y - i * COL_SPACING;
}

// Magnetize target: well inside the box (past the top border) so overflow:hidden clips them
// In word-zone coords: BOUND_H + GAP = box top border, +80 = box centre
const BOX_CX = BOUND_W / 2;
const BOX_CY = BOUND_H + GAP + 80;

const BOX_DATA = [
  {
    id:          'define',
    label:       'DEFINE',
    closedLabel: 'DEFINED',
    words: ['Assumptions', 'Context', 'History', 'Processes', 'Problem', 'Constraints'],
  },
  {
    id:          'decide',
    label:       'DECIDE',
    closedLabel: 'DECIDED',
    words: ['Options', 'Trade-offs', 'Modeling', 'ROI', 'Risk', 'Sensitivity'],
  },
  {
    id:          'deploy',
    label:       'DEPLOY',
    closedLabel: 'DEPLOYED',
    words: ['Alignment', 'Ownership', 'Sequencing', 'Execution', 'Measurement', 'Feedback'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createParticles(words: string[]): Particle[] {
  return words.map((word, i) => {
    const angle = rand(0, Math.PI * 2);
    return {
      id: i, word,
      x: rand(16, BOUND_W - 16),
      y: rand(16, BOUNCE_H - 16),
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WordParticles
// ─────────────────────────────────────────────────────────────────────────────

interface WordParticlesProps {
  words: string[];
  boxPhase: BoxPhase;
  onGatherDone: () => void;   // called when column is formed → triggers closing
  onClosingDone: () => void;  // called when magnetize completes → unmount
}

function WordParticles({ words, boxPhase, onGatherDone, onClosingDone }: WordParticlesProps) {
  const particlesRef  = useRef<Particle[]>([]);   // populated client-side only (avoids SSR hydration mismatch)
  const rafRef        = useRef<number | null>(null);
  const frozenRef     = useRef<{ x: number; y: number }[] | null>(null);
  const [, setTick]   = useState(0);
  const gatherFired   = useRef(false);
  const closingFired  = useRef(false);

  // ── physics loop (runs during idle + active) ────────────────────────────
  const animate = useCallback(() => {
    const ps = particlesRef.current;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      // Wall bounce
      if (p.x <= 0)       { p.x = 0;       p.vx =  Math.abs(p.vx); }
      if (p.x >= BOUND_W) { p.x = BOUND_W; p.vx = -Math.abs(p.vx); }
      if (p.y <= 0)        { p.y = 0;        p.vy =  Math.abs(p.vy); }
      if (p.y >= BOUNCE_H) { p.y = BOUNCE_H; p.vy = -Math.abs(p.vy); }
      // Repulsion
      for (let j = i + 1; j < ps.length; j++) {
        const q  = ps[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d  = Math.hypot(dx, dy);
        if (d < REP_DIST && d > 0) {
          const f  = ((REP_DIST - d) / REP_DIST) * REP_FORCE;
          const nx = dx / d;
          const ny = dy / d;
          p.vx += nx * f;  p.vy += ny * f;
          q.vx -= nx * f;  q.vy -= ny * f;
        }
      }
      // Normalise to constant speed
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 0) { p.vx = (p.vx / spd) * SPEED; p.vy = (p.vy / spd) * SPEED; }
      p.x += p.vx;
      p.y += p.vy;
    }
    setTick(t => t + 1);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ── start physics (idle / active) ───────────────────────────────────────
  useEffect(() => {
    if (boxPhase === 'idle' || boxPhase === 'active') {
      gatherFired.current  = false;
      closingFired.current = false;
      frozenRef.current    = null;
      // Initialise particles on first client-side run (empty on SSR to avoid hydration mismatch).
      // After that, keep existing positions so words don't jump when this box becomes 'active'.
      if (particlesRef.current.length === 0) {
        particlesRef.current = createParticles(words);
      }
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxPhase, animate]);

  // ── gathering: stop physics, snap to column via CSS transition ──────────
  useEffect(() => {
    if (boxPhase !== 'gathering') return;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    // Snapshot current live positions so the column transition starts from them
    frozenRef.current = particlesRef.current.map(p => ({ x: p.x, y: p.y }));
    setTick(t => t + 1);
    if (!gatherFired.current) {
      gatherFired.current = true;
      // Give CSS transition time to complete (620ms) then trigger closing
      const t = setTimeout(onGatherDone, 660);
      return () => clearTimeout(t);
    }
  }, [boxPhase, onGatherDone]);

  // ── closing: words magnetize from column into box ───────────────────────
  useEffect(() => {
    if (boxPhase !== 'closing') return;
    // frozenRef already holds column positions (set in gathering phase)
    setTick(t => t + 1);
    if (!closingFired.current) {
      closingFired.current = true;
      const t = setTimeout(onClosingDone, 560);
      return () => clearTimeout(t);
    }
  }, [boxPhase, onClosingDone]);

  // ── render ───────────────────────────────────────────────────────────────
  const isGathering = boxPhase === 'gathering';
  const isClosing   = boxPhase === 'closing';
  const frozen      = frozenRef.current;

  return (
    <>
      {particlesRef.current.map((p, idx) => {
        // Base position: live during physics, frozen snapshot during gather/close
        const px = (frozen && (isGathering || isClosing)) ? frozen[p.id].x : p.x;
        const py = (frozen && (isGathering || isClosing)) ? frozen[p.id].y : p.y;

        // Target positions
        const gatherX = COL_X;           // column x (centred)
        const gatherY = colY(idx);        // stacked y — idx 0 at bottom, 5 at top

        // During gathering: transition from live pos → column slot
        // During closing:   transition from column slot → box centre
        let targetTransform = 'translate(-50%, -50%)';
        let transition = 'none';

        if (isGathering) {
          // Animate from frozen chaos position → column slot
          // left/top stay at chaos coords; transform carries the word to column position
          const dx = gatherX - px;
          const dy = gatherY - py;
          targetTransform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          const delay = idx * 40;
          transition = `transform 520ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`;
        } else if (isClosing) {
          // left/top STAY at frozen chaos coords — no jump.
          // Full delta from chaos pos → deep inside box; clipped at the border by overflow:hidden.
          const dx = BOX_CX - px;
          const dy = BOX_CY - py;
          targetTransform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          const delay = idx * 25;
          transition = `transform 420ms cubic-bezier(0.55,0,1,0.8) ${delay}ms`;
        }

        return (
          <span
            key={p.id}
            style={{
              position:      'absolute',
              left:          px,
              top:           py,
              transform:     targetTransform,
              transition,
              whiteSpace:    'nowrap',
              pointerEvents: 'none',
              userSelect:    'none',
              fontSize:      '1rem',
              fontFamily:    'var(--font-mono, monospace)',
              fontWeight:    700,
              letterSpacing: '0.03em',
              color:         '#000',
            }}
          >
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
  // The SVG is positioned relative to the outer box wrapper (160×160).
  // pad gives the circle room as it rounds corners without being clipped.
  // Border is 2px, so centerline is 1px in from each edge → SVG coords: pad+1.
  const pad      = 12;
  const size     = 160;
  const total    = size + pad * 2;
  const c        = pad + 1;        // border centerline in SVG space
  const rectPath = `path("M ${c} ${c} L ${c + size - 2} ${c} L ${c + size - 2} ${c + size - 2} L ${c} ${c + size - 2} Z")`;
  return (
    <svg style={{
      position: 'absolute', top: -pad, left: -pad,
      width: total, height: total,
      pointerEvents: 'none', overflow: 'visible', zIndex: 10,
    }}>
      <circle r={3} fill="#000" style={{
        offsetPath: rectPath, offsetDistance: '0%',
        animation: 'sparkOrbit 5s linear infinite',
      } as React.CSSProperties} />
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
}

function Box({ label, closedLabel, words, boxPhase, onGatherDone, onClosingDone, onClick }: BoxProps) {
  const isClosed   = boxPhase === 'closed';
  const isActive   = boxPhase === 'active';
  const showWords  = boxPhase !== 'closed';

  return (
    <div
      onClick={isActive ? onClick : undefined}
      style={{
        position:   'relative',
        width:      160,
        height:     160,
        flexShrink: 0,
        cursor:     isActive ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Word zone — floats above the box, no clipping at all.
          Words travel out the bottom during closing and get clipped
          by overflow:hidden on the box face below. */}
      <div style={{
        position:      'absolute',
        bottom:        `calc(100% + ${GAP}px)`,
        left:          0,
        width:         BOUND_W,
        height:        BOUND_H,
        pointerEvents: 'none',
      }}>
        {showWords && (
          <WordParticles
            words={words}
            boxPhase={boxPhase}
            onGatherDone={onGatherDone}
            onClosingDone={onClosingDone}
          />
        )}
      </div>

      {/* Box face — extends upward by GAP so overflow:hidden catches words
          as soon as they leave the word zone, with no visible gap where
          words could be seen floating between zone and box. */}
      <div style={{
        position:       'absolute',
        top:            -GAP,
        left:           0,
        width:          160,
        height:         160 + GAP,
        overflow:       'hidden',   // clips words the instant they cross the word zone bottom
      }}>
        {/* Visual box — pushed down by GAP so it renders at the correct position */}
        <div style={{
          position:       'absolute',
          top:            GAP,
          left:           0,
          width:          160,
          height:         160,
          border:         '2px solid black',
          background:     'white',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'visible',  // let spark SVG extend outside border
        }}>
          <span
            className={isClosed ? 'font-black' : 'font-normal'}
            style={{
              fontSize:      '1.35rem',
              fontFamily:    'var(--font-mono, monospace)',
              letterSpacing: '0.1em',
              color:         '#000',
              userSelect:    'none',
              textAlign:     'center',
              display:       'block',
              width:         '100%',
              padding:       '0 6px',
              boxSizing:     'border-box' as const,
            }}
          >
            {isClosed ? closedLabel : label}
          </span>
        </div>
        {/* end visual box */}
      </div>
      {/* end clip wrapper */}

      {/* Spark lives outside the clip wrapper so overflow:hidden can't cut it.
          Positioned over the visual box: outer wrapper is 160px, box is at y=0. */}
      {isActive && <Spark />}
    </div>
    // end outer box wrapper
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreensaverHero
// ─────────────────────────────────────────────────────────────────────────────

export default function ScreensaverHero() {
  const [phases, setPhases] = useState<[BoxPhase, BoxPhase, BoxPhase]>(
    ['active', 'idle', 'idle']
  );

  // Click → start gather phase
  const handleClick = useCallback((i: number) => {
    setPhases(prev => {
      const n = [...prev] as [BoxPhase, BoxPhase, BoxPhase];
      n[i] = 'gathering';
      return n;
    });
  }, []);

  // Column formed → start magnetize phase
  const handleGatherDone = useCallback((i: number) => {
    setPhases(prev => {
      const n = [...prev] as [BoxPhase, BoxPhase, BoxPhase];
      n[i] = 'closing';
      return n;
    });
  }, []);

  // Magnetize done → close box, unlock next
  const handleClosingDone = useCallback((i: number) => {
    setPhases(prev => {
      const n = [...prev] as [BoxPhase, BoxPhase, BoxPhase];
      n[i] = 'closed';
      if (i + 1 < n.length) n[i + 1] = 'active';
      return n;
    });
  }, []);

  return (
    <>
      <style>{`
        @keyframes sparkOrbit {
          from { offset-distance: 0%;   }
          to   { offset-distance: 100%; }
        }
      `}</style>

      <div style={{
        background:      'white',
        width:           '100vw',
        height:          '100vh',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             '7rem',
      }}>
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
          />
        ))}
      </div>
    </>
  );
}
