import React from "react";
import {
  AbsoluteFill,
  Img,
  Video,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  staticFile,
} from "remotion";

// ============================================================================
// MAUKA MAUKA DECODED — v8 Remotion Composition
// 540x960 vertical, 77s (2310 frames @ 30fps)
// Live brain analysis demo with actual ad footage
// ============================================================================

export interface SceneProps {
  narrationSrc?: string;
  musicSrc?: string;
  captions?: Array<{ word: string; startMs: number; endMs: number }>;
}

// ── Design System (Aurora v2) ──────────────────────────────────────────────
const C = {
  navy: "#0E1122",
  cardBg: "#161A2C",
  teal: "#60A4A1",
  crimson: "#C71B52",
  gold: "#F0B429",
  text: "#EEF0F4",
  muted: "#9AA3B2",
  pink: "#E91E8C",
};

// ── Brain Data (LOCKED) ────────────────────────────────────────────────────
const MAUKA = { EP: 88, ED: 77, Abs: 26, Att: 43, Mom: 44, End: 28 };
const AD2024 = { EP: 64, ED: 45, Abs: 10, Att: 38, Mom: 76, End: 65 };

// ── Scene timing (frames at 30fps) ─────────────────────────────────────────
const SCENES = {
  s1: { start: 0, end: 420 },       // 0-14s   Hook
  s2: { start: 420, end: 840 },     // 14-28s  Demo + Live Brain
  s3: { start: 840, end: 1260 },    // 28-42s  Radar Comparison
  s4: { start: 1260, end: 1560 },   // 42-52s  Brain Timeline
  s5: { start: 1560, end: 1860 },   // 52-62s  Verdict
  s6: { start: 1860, end: 2310 },   // 62-77s  CTA
};

// ── Helper: CountUp ────────────────────────────────────────────────────────
const CountUp: React.FC<{
  value: number;
  frame: number;
  startFrame: number;
  durationFrames: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({ value, frame, startFrame, durationFrames, suffix = "", prefix = "", decimals = 0, style }) => {
  const progress = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = value * eased;
  const display = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();
  return (
    <span style={style}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

// ── Helper: Vignette overlay ───────────────────────────────────────────────
const Vignette: React.FC<{ intensity?: number }> = ({ intensity = 0.6 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${intensity}) 100%)`,
      pointerEvents: "none",
      zIndex: 50,
    }}
  />
);

// ── Helper: ViewBrain logo ─────────────────────────────────────────────────
const ViewBrainLogo: React.FC<{ size?: number; opacity?: number }> = ({ size = 24, opacity = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, opacity }}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke={C.teal} strokeWidth="2" />
      <path d="M10 16 Q10 10 16 10 Q22 10 22 16 Q22 22 16 22 Q10 22 10 16" fill={C.teal} fillOpacity="0.2" stroke={C.teal} strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="3" fill={C.gold}/>
    </svg>
    <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: size * 0.7, color: C.text, letterSpacing: -0.5 }}>
      View<span style={{ color: C.teal }}>Brain</span>
    </span>
  </div>
);

// ── Helper: Animated line chart for brain waves ─────────────────────────────
const BrainWaveChart: React.FC<{
  frame: number;
  width: number;
  height: number;
  color: string;
  label: string;
  dataSeed: number;
  maxPoints?: number;
  progress: number; // 0 to 1, how much of the chart is "filled in"
}> = ({ frame, width, height, color, label, dataSeed, progress }) => {
  const totalPoints = 60; // 30 seconds * 2 points per second
  const visiblePoints = Math.floor(progress * totalPoints);

  // Generate deterministic brain wave data
  const generateData = (i: number) => {
    const phase = i * 0.35 + dataSeed * 1.7;
    const baseVal = 0.5 + 0.25 * Math.sin(phase) + 0.15 * Math.sin(phase * 2.3) + 0.1 * Math.sin(phase * 0.7);
    // Add some peaks and valleys for emotional response
    const peakBoost = i > 10 && i < 25 ? 0.2 * Math.sin((i - 10) * 0.4) : 0;
    return Math.max(0.1, Math.min(0.9, baseVal + peakBoost));
  };

  const points: string[] = [];
  for (let i = 0; i <= visiblePoints; i++) {
    const x = (i / totalPoints) * width;
    const val = generateData(i);
    const y = height - val * height;
    points.push(`${x},${y}`);
  }

  // Fill area under the curve
  const fillPoints = visiblePoints > 0 
    ? `0,${height} ` + points.join(" ") + ` ${(visiblePoints / totalPoints) * width},${height}`
    : "";

  return (
    <div style={{ position: "relative", width, height, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
      {/* Label */}
      <div style={{ position: "absolute", top: 2, left: 6, zIndex: 2 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color, letterSpacing: 1 }}>
          {label}
        </span>
      </div>
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {/* Fill */}
        {fillPoints && (
          <polygon points={fillPoints} fill={color} fillOpacity={0.08} />
        )}
        {/* Line */}
        {points.length > 1 && (
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Current value dot */}
        {visiblePoints > 0 && visiblePoints < totalPoints && (
          <circle
            cx={(visiblePoints / totalPoints) * width}
            cy={height - generateData(visiblePoints) * height}
            r={3}
            fill={color}
          >
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
};

// ============================================================================
// SCENE 1: HOOK (0-14s, frames 0-420)
// ============================================================================
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const thumbSpring = spring({ frame, fps, config: { damping: 14, stiffness: 60 } });
  const titleSpring = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 80 } });
  const subSpring = spring({ frame: frame - 45, fps, config: { damping: 12, stiffness: 50 } });
  const punchSpring = spring({ frame: frame - 70, fps, config: { damping: 10, stiffness: 100 } });
  const logoSpring = spring({ frame: frame - 90, fps, config: { damping: 14, stiffness: 40 } });

  const thumbScale = interpolate(thumbSpring, [0, 1], [0.7, 1]);
  const thumbOpacity = interpolate(thumbSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const punchScale = interpolate(punchSpring, [0, 1], [0.5, 1]);
  const punchOpacity = interpolate(punchSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: C.navy, justifyContent: "center", alignItems: "center" }}>
      <Vignette intensity={0.7} />

      {/* Thumbnail with teal outline */}
      <div
        style={{
          transform: `scale(${thumbScale})`,
          opacity: thumbOpacity,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: `2px solid ${C.teal}`,
            boxShadow: `0 0 40px ${C.teal}30`,
            width: 320,
            height: 180,
          }}
        >
          <Img
            src={staticFile("thumb-mauka-2015.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 6,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: C.teal,
            letterSpacing: 2,
          }}
        >
          STAR SPORTS · 2015
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
          padding: "0 30px",
        }}
      >
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 32,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          You remember{" "}
          <span style={{ color: C.teal }}>Mauka Mauka</span>
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
            fontWeight: 400,
            color: C.muted,
            marginTop: 14,
          }}
        >
          But the ad they ran in 2024?
        </div>
      </div>

      {/* Gold punchline */}
      <div
        style={{
          transform: `scale(${punchScale})`,
          opacity: punchOpacity,
          marginTop: 30,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 40,
            fontWeight: 900,
            color: C.gold,
            letterSpacing: -1,
            textShadow: `0 0 30px ${C.gold}40`,
          }}
        >
          No? Exactly.
        </div>
      </div>

      {/* Logo at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          opacity: interpolate(logoSpring, [0, 1], [0, 1]),
        }}
      >
        <ViewBrainLogo size={28} />
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2: LIVE BRAIN ANALYSIS (14-28s, frames 420-840)
// ============================================================================
const Scene2LiveBrain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame; // Inside Sequence, useCurrentFrame returns local frame (0-based)

  // Video starts at local frame 15, plays for 450 frames (15s)
  const videoStartFrame = 15;
  const videoDuration = 450;
  const videoProgress = interpolate(local, [videoStartFrame, videoStartFrame + videoDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Brain wave charts animate in sync with video progress
  const chartProgress = interpolate(local, [videoStartFrame, videoStartFrame + videoDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // KPI card animations
  const kpiDelay = [videoStartFrame + 60, videoStartFrame + 120, videoStartFrame + 180];
  const insightDelay = [videoStartFrame + 240, videoStartFrame + 280, videoStartFrame + 320];
  const comparisonDelay = videoStartFrame + 360;

  const headerSpring = spring({ frame: local, fps, config: { damping: 12, stiffness: 80 } });
  const liveBadgeOpacity = interpolate(local, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.navy, padding: "16px 20px" }}>
      <Vignette intensity={0.5} />

      {/* Header */}
      <div
        style={{
          opacity: interpolate(headerSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(headerSpring, [0, 1], [20, 0])}px)`,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
          Your brain, second by second
        </div>
      </div>

      {/* LIVE BRAIN badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 8,
          opacity: liveBadgeOpacity,
        }}
      >
        <div
          style={{
            background: `${C.crimson}20`,
            border: `1px solid ${C.crimson}60`,
            borderRadius: 20,
            padding: "3px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.crimson,
              boxShadow: `0 0 8px ${C.crimson}`,
              opacity: 0.5 + 0.5 * Math.abs(Math.sin(local * 0.15)),
            }}
          />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.crimson, letterSpacing: 1.5 }}>
            LIVE BRAIN
          </span>
        </div>
      </div>

      {/* Video area */}
      <div
        style={{
          width: "100%",
          height: 200,
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${C.teal}40`,
          position: "relative",
          background: "#000",
        }}
      >
        {local >= videoStartFrame && (
          <Video
            src={staticFile("mauka-mauka-clip-15s.mp4")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            muted
            volume={0}
          />
        )}
      </div>

      {/* Progress bar below video */}
      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 4, position: "relative" }}>
        <div
          style={{
            width: `${videoProgress * 100}%`,
            height: "100%",
            background: C.teal,
            borderRadius: 2,
            boxShadow: `0 0 8px ${C.teal}80`,
          }}
        />
        {/* Moving dot */}
        <div
          style={{
            position: "absolute",
            left: `${videoProgress * 100}%`,
            top: -2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: C.teal,
            boxShadow: `0 0 10px ${C.teal}`,
            transform: "translateX(-50%)",
            opacity: videoProgress > 0 && videoProgress < 1 ? 1 : 0,
          }}
        />
      </div>

      {/* Three brain wave charts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
        <BrainWaveChart frame={local} width={480} height={45} color={C.gold} label="ATTENTION" dataSeed={1.2} progress={chartProgress} />
        <BrainWaveChart frame={local} width={480} height={45} color={C.pink} label="EMOTION" dataSeed={2.7} progress={chartProgress} />
        <BrainWaveChart frame={local} width={480} height={45} color={C.teal} label="ENGAGEMENT" dataSeed={3.5} progress={chartProgress} />
      </div>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {[
          { label: "Mean Eng.", value: 55.9, suffix: "%", decimals: 1, color: C.gold, delay: kpiDelay[0] },
          { label: "Emo. Seconds", value: 22, suffix: "/30", decimals: 0, color: C.pink, delay: kpiDelay[1] },
          { label: "Limbic Act.", value: 75.7, suffix: "%", decimals: 1, color: C.teal, delay: kpiDelay[2] },
        ].map((kpi, i) => {
          const kpiSpring = spring({ frame: local - kpi.delay, fps, config: { damping: 12, stiffness: 60 } });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: C.cardBg,
                borderRadius: 8,
                padding: "8px 6px",
                textAlign: "center",
                borderLeft: `3px solid ${kpi.color}`,
                opacity: interpolate(kpiSpring, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(kpiSpring, [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 600, color: C.muted, letterSpacing: 0.5, marginBottom: 4 }}>
                {kpi.label}
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>
                <CountUp value={kpi.value} frame={local} startFrame={kpi.delay + 5} durationFrames={40} suffix={kpi.suffix} decimals={kpi.decimals} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight cards */}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {[
          { label: "Peak Attention", icon: "▲", color: C.gold, delay: insightDelay[0] },
          { label: "Emotion Surge", icon: "♥", color: C.pink, delay: insightDelay[1] },
          { label: "Flow State", icon: "◈", color: C.teal, delay: insightDelay[2] },
        ].map((insight, i) => {
          const insp = spring({ frame: local - insight.delay, fps, config: { damping: 12, stiffness: 50 } });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: `${C.cardBg}80`,
                borderRadius: 6,
                padding: "6px 4px",
                textAlign: "center",
                opacity: interpolate(insp, [0, 1], [0, 1]),
                transform: `scale(${interpolate(insp, [0, 1], [0.8, 1])})`,
              }}
            >
              <span style={{ color: insight.color, fontSize: 10, marginRight: 3 }}>{insight.icon}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 600, color: C.text }}>
                {insight.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Comparison preview bars */}
      {(() => {
        const compSpring = spring({ frame: local - comparisonDelay, fps, config: { damping: 12, stiffness: 50 } });
        return (
          <div
            style={{
              marginTop: 8,
              opacity: interpolate(compSpring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(compSpring, [0, 1], [15, 0])}px)`,
              background: C.cardBg,
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>
              COMPARISON PREVIEW
            </div>
            {[
              { label: "EP", mauka: MAUKA.EP, ad: AD2024.EP },
              { label: "ED", mauka: MAUKA.ED, ad: AD2024.ED },
              { label: "MOM", mauka: MAUKA.Mom, ad: AD2024.Mom },
            ].map((row, i) => {
              const rowDelay = comparisonDelay + i * 15;
              const rowSpring = spring({ frame: local - rowDelay, fps, config: { damping: 14, stiffness: 60 } });
              const barProgress = interpolate(rowSpring, [0, 1], [0, 1]);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 700, color: C.muted, width: 28 }}>{row.label}</span>
                  {/* Mauka bar */}
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{ width: `${row.mauka * barProgress}%`, height: "100%", background: C.teal, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 700, color: C.teal, width: 20, textAlign: "right" }}>
                    {Math.round(row.mauka * barProgress)}
                  </span>
                  <div style={{ width: 6 }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 700, color: C.muted, width: 20, textAlign: "left" }}>
                    {Math.round(row.ad * barProgress)}
                  </span>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{ width: `${row.ad * barProgress}%`, height: "100%", background: C.crimson, borderRadius: 3, marginLeft: "auto" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 600, color: C.teal }}>Mauka Mauka</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 600, color: C.crimson }}>2024 Ad</span>
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3: RADAR COMPARISON (28-42s, frames 840-1260)
// ============================================================================
const Scene3Radar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame; // Inside Sequence, useCurrentFrame returns local frame (0-based)

  const titleSpring = spring({ frame: local, fps, config: { damping: 12, stiffness: 80 } });
  const radarSpring = spring({ frame: local - 20, fps, config: { damping: 14, stiffness: 50, mass: 1 } });
  const legendSpring = spring({ frame: local - 60, fps, config: { damping: 12, stiffness: 50 } });
  const statsSpring = spring({ frame: local - 90, fps, config: { damping: 12, stiffness: 50 } });

  const radarProgress = interpolate(radarSpring, [0, 1], [0, 1]);
  const radarScale = interpolate(radarSpring, [0, 1], [0.5, 1]);

  const axes = [
    { name: "Emotional\nPower", key: "EP", max: 100 },
    { name: "Emotional\nDepth", key: "ED", max: 100 },
    { name: "Absorption", key: "Abs", max: 100 },
    { name: "Attention", key: "Att", max: 100 },
    { name: "Momentum", key: "Mom", max: 100 },
    { name: "End Score", key: "End", max: 100 },
  ];

  const centerX = 270;
  const centerY = 320;
  const radius = 150;

  // Calculate hexagonal radar points
  const getPolygonPoints = (data: typeof MAUKA, progress: number) => {
    return axes
      .map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const value = (data[axis.key as keyof typeof MAUKA] / axis.max) * progress;
        const x = centerX + Math.cos(angle) * radius * value;
        const y = centerY + Math.sin(angle) * radius * value;
        return `${x},${y}`;
      })
      .join(" ");
  };

  // Axis lines and labels
  const axisElements = axes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const x1 = centerX;
    const y1 = centerY;
    const x2 = centerX + Math.cos(angle) * radius;
    const y2 = centerY + Math.sin(angle) * radius;
    const labelX = centerX + Math.cos(angle) * (radius + 20);
    const labelY = centerY + Math.sin(angle) * (radius + 20);
    return { x1, y1, x2, y2, labelX, labelY, name: axis.name, angle };
  });

  // Grid rings
  const gridRings = [0.25, 0.5, 0.75, 1.0].map((ring) => {
    const points = axes
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius * ring;
        const y = centerY + Math.sin(angle) * radius * ring;
        return `${x},${y}`;
      })
      .join(" ");
    return points;
  });

  return (
    <AbsoluteFill style={{ background: C.navy, padding: 20 }}>
      <Vignette intensity={0.5} />

      {/* Title */}
      <div
        style={{
          opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
          How the two ads compare
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ position: "relative", width: 540, height: 400, transform: `scale(${radarScale})`, transformOrigin: "center" }}>
        <svg width={540} height={400} style={{ position: "absolute", top: 0, left: 0 }}>
          {/* Grid rings */}
          {gridRings.map((ring, i) => (
            <polygon
              key={i}
              points={ring}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {axisElements.map((axis, i) => (
            <line key={i} x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          ))}

          {/* 2024 Ad shape (crimson) */}
          <polygon
            points={getPolygonPoints(AD2024, radarProgress)}
            fill={C.crimson}
            fillOpacity={0.12}
            stroke={C.crimson}
            strokeWidth={2}
          />

          {/* Mauka Mauka shape (teal) */}
          <polygon
            points={getPolygonPoints(MAUKA, radarProgress)}
            fill={C.teal}
            fillOpacity={0.15}
            stroke={C.teal}
            strokeWidth={2}
          />

          {/* Axis labels */}
          {axisElements.map((axis, i) => {
            const lines = axis.name.split("\n");
            return (
              <text
                key={i}
                x={axis.labelX}
                y={axis.labelY}
                fill={C.muted}
                fontSize={10}
                fontFamily="Inter, sans-serif"
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={axis.labelX} dy={li === 0 ? -6 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend with thumbnails */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 30,
          marginTop: 5,
          opacity: interpolate(legendSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(legendSpring, [0, 1], [15, 0])}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ borderRadius: 4, overflow: "hidden", border: `2px solid ${C.teal}` }}>
            <Img src={staticFile("thumb-mauka-2015.jpg")} style={{ width: 40, height: 24, objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.teal }}>Mauka Mauka</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ borderRadius: 4, overflow: "hidden", border: `2px solid ${C.crimson}` }}>
            <Img src={staticFile("thumb-indvpak-2024.jpg")} style={{ width: 40, height: 24, objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.crimson }}>2024 Ad</span>
        </div>
      </div>

      {/* Key stats row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 10,
          opacity: interpolate(statsSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(statsSpring, [0, 1], [15, 0])}px)`,
        }}
      >
        {[
          { label: "Emotionally Engaged", mauka: "22/30", ad: "6/30", color: C.teal },
          { label: "Emotional Power", mauka: "88", ad: "64", color: C.gold },
          { label: "Momentum", mauka: "44", ad: "76", color: C.crimson },
        ].map((stat, i) => (
          <div key={i} style={{ background: C.cardBg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 600, color: C.muted, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 900, color: C.teal }}>{stat.mauka}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 900, color: C.crimson }}>{stat.ad}</span>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4: BRAIN TIMELINE (42-52s, frames 1260-1560)
// ============================================================================
const Scene4Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame; // Inside Sequence, useCurrentFrame returns local frame (0-based)

  const titleSpring = spring({ frame: local, fps, config: { damping: 12, stiffness: 80 } });
  const timelineSpring = spring({ frame: local - 30, fps, config: { damping: 14, stiffness: 50 } });
  const timelineProgress = interpolate(timelineSpring, [0, 1], [0, 1]);

  // Segment data — 10 segments per ad
  const maukaSegments = [
    { start: 0, end: 10, intensity: 0.4, label: "0-3s" },
    { start: 10, end: 20, intensity: 0.7, label: "3-6s" },
    { start: 20, end: 30, intensity: 0.85, label: "6-9s" },
    { start: 30, end: 40, intensity: 0.9, label: "9-12s" },
    { start: 40, end: 50, intensity: 0.75, label: "12-15s" },
    { start: 50, end: 60, intensity: 0.6, label: "15-18s" },
    { start: 60, end: 70, intensity: 0.8, label: "18-21s" },
    { start: 70, end: 80, intensity: 0.95, label: "21-24s" },
    { start: 80, end: 90, intensity: 0.7, label: "24-27s" },
    { start: 90, end: 100, intensity: 0.55, label: "27-30s" },
  ];

  const ad2024Segments = [
    { start: 0, end: 10, intensity: 0.3, label: "0-3s" },
    { start: 10, end: 20, intensity: 0.35, label: "3-6s" },
    { start: 20, end: 30, intensity: 0.3, label: "6-9s" },
    { start: 30, end: 40, intensity: 0.4, label: "9-12s" },
    { start: 40, end: 50, intensity: 0.35, label: "12-15s" },
    { start: 50, end: 60, intensity: 0.3, label: "15-18s" },
    { start: 60, end: 70, intensity: 0.35, label: "18-21s" },
    { start: 70, end: 80, intensity: 0.4, label: "21-24s" },
    { start: 80, end: 90, intensity: 0.35, label: "24-27s" },
    { start: 90, end: 100, intensity: 0.3, label: "27-30s" },
  ];

  const renderTimeline = (segments: typeof maukaSegments, color: string, yOff: number, label: string, thumbSrc: string) => {
    const segWidth = 440 / segments.length;
    return (
      <div style={{ marginBottom: 15 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ borderRadius: 3, overflow: "hidden", border: `1.5px solid ${color}` }}>
            <Img src={staticFile(thumbSrc)} style={{ width: 30, height: 18, objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color }}>{label}</span>
        </div>
        <div style={{ display: "flex", gap: 1, height: 50 }}>
          {segments.map((seg, i) => {
            const segProg = interpolate(timelineProgress, [seg.start / 100, seg.end / 100], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: C.cardBg,
                  borderRadius: 3,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${seg.intensity * segProg * 100}%`,
                    background: `linear-gradient(to top, ${color}, ${color}60)`,
                    transition: "height 0.05s",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: C.navy, padding: "30px 20px" }}>
      <Vignette intensity={0.5} />

      {/* Title */}
      <div
        style={{
          opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>
          2024 kept brains <span style={{ color: C.crimson }}>cold</span>.
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.3, marginTop: 4 }}>
          Mauka Mauka kept brains <span style={{ color: C.teal }}>emotionally alive</span>.
        </div>
      </div>

      {/* Timelines */}
      <div style={{ marginTop: 10 }}>
        {renderTimeline(maukaSegments, C.teal, 0, "Mauka Mauka 2015", "thumb-mauka-2015.jpg")}
        {renderTimeline(ad2024Segments, C.crimson, 60, "2024 Ad", "thumb-indvpak-2024.jpg")}
      </div>

      {/* Time axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, padding: "0 4px" }}>
        {["0s", "6s", "12s", "18s", "24s", "30s"].map((t, i) => (
          <span key={i} style={{ fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 500, color: C.muted }}>
            {t}
          </span>
        ))}
      </div>

      {/* Caption */}
      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          opacity: interpolate(timelineSpring, [0.3, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: C.muted, fontStyle: "italic" }}>
          Segment by segment, the data tells the same story.
        </div>
      </div>

      {/* Color scale legend */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 15 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 500, color: C.muted }}>Low engagement</span>
        <div style={{ width: 100, height: 8, background: `linear-gradient(to right, ${C.cardBg}, ${C.teal})`, borderRadius: 4 }} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 500, color: C.muted }}>High engagement</span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5: VERDICT (52-62s, frames 1560-1860)
// ============================================================================
const Scene5Verdict: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame; // Inside Sequence, useCurrentFrame returns local frame (0-based)

  const line1Spring = spring({ frame: local, fps, config: { damping: 12, stiffness: 60 } });
  const soulSpring = spring({ frame: local - 25, fps, config: { damping: 10, stiffness: 80 } });
  const line3Spring = spring({ frame: local - 55, fps, config: { damping: 12, stiffness: 50 } });
  const line4Spring = spring({ frame: local - 75, fps, config: { damping: 12, stiffness: 50 } });
  const badgeSpring = spring({ frame: local - 100, fps, config: { damping: 12, stiffness: 50 } });

  return (
    <AbsoluteFill style={{ background: C.navy, justifyContent: "center", alignItems: "center", padding: 30 }}>
      <Vignette intensity={0.6} />

      {/* Line 1 */}
      <div
        style={{
          opacity: interpolate(line1Spring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(line1Spring, [0, 1], [20, 0])}px)`,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 500, color: C.muted }}>
          The 2024 ad was{" "}
          <span style={{ color: C.crimson, fontWeight: 700 }}>mechanically perfect</span>.
        </div>
      </div>

      {/* SOUL — large gold */}
      <div
        style={{
          opacity: interpolate(soulSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(soulSpring, [0, 1], [0.5, 1])})`,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 56,
            fontWeight: 900,
            color: C.gold,
            letterSpacing: -2,
            textShadow: `0 0 40px ${C.gold}40`,
            lineHeight: 1,
          }}
        >
          Mauka Mauka
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 56,
            fontWeight: 900,
            color: C.gold,
            letterSpacing: -2,
            textShadow: `0 0 40px ${C.gold}40`,
            lineHeight: 1.1,
            marginTop: 4,
          }}
        >
          had SOUL.
        </div>
      </div>

      {/* Lines 3-4 */}
      <div
        style={{
          opacity: interpolate(line3Spring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(line3Spring, [0, 1], [15, 0])}px)`,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 400, color: C.text, lineHeight: 1.5 }}>
          That's why nobody remembers the 2024 ad.
        </div>
      </div>
      <div
        style={{
          opacity: interpolate(line4Spring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(line4Spring, [0, 1], [15, 0])}px)`,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: C.teal, lineHeight: 1.5 }}>
          That's why everyone still remembers Mauka Mauka.
        </div>
      </div>

      {/* Validated badge */}
      <div
        style={{
          opacity: interpolate(badgeSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(badgeSpring, [0, 1], [0.8, 1])})`,
        }}
      >
        <div
          style={{
            border: `1.5px solid ${C.teal}60`,
            borderRadius: 20,
            padding: "8px 20px",
            background: `${C.teal}10`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke={C.teal} strokeWidth="1.5" />
            <path d="M5 8 L7 10 L11 6" stroke={C.teal} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 1 }}>
            Validated by fMRI Neural Data
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 6: CTA (62-77s, frames 1860-2310)
// ============================================================================
const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame; // Inside Sequence, useCurrentFrame returns local frame (0-based)

  const borderSpring = spring({ frame: local, fps, config: { damping: 12, stiffness: 40 } });
  const logoSpring = spring({ frame: local - 20, fps, config: { damping: 14, stiffness: 60 } });
  const taglineSpring = spring({ frame: local - 40, fps, config: { damping: 12, stiffness: 50 } });
  const descSpring = spring({ frame: local - 60, fps, config: { damping: 12, stiffness: 50 } });
  const urlSpring = spring({ frame: local - 80, fps, config: { damping: 12, stiffness: 50 } });

  // Gold glow border pulse
  const glowPulse = 0.4 + 0.3 * Math.abs(Math.sin(local * 0.05));
  const borderOpacity = interpolate(borderSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: C.navy, justifyContent: "center", alignItems: "center" }}>
      <Vignette intensity={0.6} />

      {/* Gold glow border */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: `2px solid ${C.gold}`,
          borderRadius: 16,
          opacity: borderOpacity,
          boxShadow: `0 0 ${30 * glowPulse}px ${C.gold}40, inset 0 0 ${30 * glowPulse}px ${C.gold}20`,
        }}
      />

      {/* Content */}
      <div style={{ textAlign: "center", zIndex: 1, padding: 40 }}>
        {/* Logo */}
        <div
          style={{
            opacity: interpolate(logoSpring, [0, 1], [0, 1]),
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.5, 1])})`,
            marginBottom: 20,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ViewBrainLogo size={40} />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: interpolate(taglineSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(taglineSpring, [0, 1], [15, 0])}px)`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: -1 }}>
            Brain decoded advertising
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            opacity: interpolate(descSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(descSpring, [0, 1], [15, 0])}px)`,
            marginBottom: 24,
            maxWidth: 380,
          }}
        >
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 400, color: C.muted, lineHeight: 1.5 }}>
            We measure what audiences{" "}
            <span style={{ color: C.teal, fontWeight: 600 }}>feel</span>,
            not what they <span style={{ color: C.crimson, fontWeight: 600 }}>click</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            opacity: interpolate(urlSpring, [0, 1], [0, 1]),
            transform: `scale(${interpolate(urlSpring, [0, 1], [0.8, 1])})`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: `${C.gold}15`,
              border: `1px solid ${C.gold}40`,
              borderRadius: 24,
              padding: "10px 28px",
            }}
          >
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: C.gold, letterSpacing: 0.5 }}>
              viewbrain.ai
            </span>
          </div>
        </div>

        {/* Brain wave animation at bottom */}
        <div style={{ marginTop: 30 }}>
          <svg width={300} height={40} style={{ opacity: 0.4 }}>
            <polyline
              points={Array.from({ length: 60 }, (_, i) => {
                const x = (i / 59) * 300;
                const phase = local * 0.08 + i * 0.25;
                const y = 20 + Math.sin(phase) * 12 * (0.5 + 0.5 * Math.sin(i * 0.12));
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke={C.teal}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const Scene: React.FC<SceneProps> = () => {
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      {/* Audio tracks — works on Mac with GPU */}
      <Audio src={staticFile("narration-v6-eleven.mp3")} volume={1.0} />
      <Audio src={staticFile("music.mp3")} volume={0.08} />

      <Sequence from={SCENES.s1.start} durationInFrames={SCENES.s1.end - SCENES.s1.start}>
        <Scene1Hook />
      </Sequence>
      <Sequence from={SCENES.s2.start} durationInFrames={SCENES.s2.end - SCENES.s2.start}>
        <Scene2LiveBrain />
      </Sequence>
      <Sequence from={SCENES.s3.start} durationInFrames={SCENES.s3.end - SCENES.s3.start}>
        <Scene3Radar />
      </Sequence>
      <Sequence from={SCENES.s4.start} durationInFrames={SCENES.s4.end - SCENES.s4.start}>
        <Scene4Timeline />
      </Sequence>
      <Sequence from={SCENES.s5.start} durationInFrames={SCENES.s5.end - SCENES.s5.start}>
        <Scene5Verdict />
      </Sequence>
      <Sequence from={SCENES.s6.start} durationInFrames={SCENES.s6.end - SCENES.s6.start}>
        <Scene6CTA />
      </Sequence>
    </AbsoluteFill>
  );
};

export const calculateMetadata = () => ({
  durationInFrames: 2310,
  fps: 30,
  width: 1080,
  height: 1920,
});