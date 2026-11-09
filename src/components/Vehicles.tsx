import { useId } from "react";

/**
 * Side-view vehicle illustrations wearing a sample Fleetcast wrap.
 * Pure SVG so they scale crisply and need no photos.
 * Colors come from CSS variables, wheels spin via `.veh__spokes` (see home.css).
 */

/** Decorative QR-style glyph (not a scannable code). */
export function QrGlyph({ x = 0, y = 0, size = 40 }: { x?: number; y?: number; size?: number }) {
  const n = 21;
  let d = "";
  const finder = (r: number, c: number) => {
    const inTL = r < 8 && c < 8;
    const inTR = r < 8 && c >= n - 8;
    const inBL = r >= n - 8 && c < 8;
    if (!inTL && !inTR && !inBL) return null;
    const lr = r < 8 ? r : r - (n - 7);
    const lc = c < 8 ? c : c - (n - 7);
    if (lr < 0 || lc < 0 || lr > 6 || lc > 6) return false; // separator
    return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const f = finder(r, c);
      const on = f === null ? (((r * 73856093) ^ (c * 19349663) ^ (r * c * 83492791)) >>> 0) % 7 < 3 : f;
      if (on) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="-2 -2 25 25" aria-hidden="true">
      <rect x="-2" y="-2" width="25" height="25" rx="2" fill="#fff" />
      <path d={d} fill="var(--navy)" />
    </svg>
  );
}

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g className="veh__wheel">
      <circle cx={cx} cy={cy} r={r} fill="#101b2d" />
      <circle cx={cx} cy={cy} r={r * 0.58} fill="#c8ced8" />
      <g className="veh__spokes">
        <rect x={cx - 2} y={cy - r * 0.52} width="4" height={r * 1.04} rx="2" fill="#8a93a3" />
        <rect x={cx - r * 0.52} y={cy - 2} width={r * 1.04} height="4" rx="2" fill="#8a93a3" />
        <circle cx={cx} cy={cy} r={r * 0.16} fill="#5d6677" />
      </g>
    </g>
  );
}

export function Bus({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`veh veh--bus ${className}`} viewBox="0 0 560 220" role="img" aria-label="City bus with a full brand wrap and QR code">
      <defs>
        <clipPath id={`bus-${id}`}>
          <rect x="12" y="22" width="536" height="150" rx="20" />
        </clipPath>
      </defs>
      <ellipse cx="280" cy="204" rx="250" ry="8" fill="rgba(0,0,0,.18)" />
      <rect x="12" y="22" width="536" height="150" rx="20" fill="var(--orange)" />
      <g clipPath={`url(#bus-${id})`}>
        <path d="M0 146 C150 118 300 186 560 118 L560 180 L0 180Z" fill="var(--mint)" />
        <path d="M0 160 C160 138 320 196 560 140 L560 180 L0 180Z" fill="var(--navy)" />
      </g>
      {[40, 106, 172, 238, 304, 370].map((x) => (
        <rect key={x} x={x} y="38" width="58" height="50" rx="7" fill="#0b2a55" />
      ))}
      <rect x="436" y="38" width="44" height="130" rx="6" fill="#0b2a55" />
      <line x1="458" y1="40" x2="458" y2="166" stroke="#1d4580" strokeWidth="2" />
      <path d="M494 34 L536 34 Q546 34 546 46 L546 108 L494 108Z" fill="#0b2a55" />
      <path d="M44 42 L70 42 L50 84 L44 84Z" fill="#fff" opacity=".12" />
      <text x="44" y="124" className="veh__brand veh__brand--light" fontSize="26">
        YOUR BRAND
      </text>
      <text x="226" y="123" className="veh__tag veh__tag--light" fontSize="14">
        rides here →
      </text>
      <QrGlyph x={376} y={96} size={44} />
      <rect x="532" y="134" width="12" height="10" rx="3" fill="#ffe7a8" />
      <circle cx="120" cy="172" r="33" fill="var(--navy-deep)" />
      <circle cx="432" cy="172" r="33" fill="var(--navy-deep)" />
      <Wheel cx={120} cy={172} r={26} />
      <Wheel cx={432} cy={172} r={26} />
    </svg>
  );
}

export function Train({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const body = "M10 42 Q10 28 24 28 L596 28 Q640 28 664 72 L688 140 Q694 168 662 168 L24 168 Q10 168 10 154Z";
  return (
    <svg className={`veh veh--train ${className}`} viewBox="0 0 700 220" role="img" aria-label="Commuter train with a branded livery and QR code">
      <defs>
        <clipPath id={`train-${id}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <rect x="0" y="194" width="700" height="5" fill="#4b5568" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={i * 40 + 6} y="199" width="22" height="6" fill="#4b5568" opacity=".55" />
      ))}
      <path d="M300 28 L320 8 L360 8 M320 8 L340 28" stroke="#4b5568" strokeWidth="3" fill="none" />
      <path d={body} fill="var(--mint)" />
      <g clipPath={`url(#train-${id})`}>
        <path d="M0 110 C200 70 420 150 700 90 L700 180 L0 180Z" fill="var(--orange)" />
        <rect x="0" y="152" width="700" height="20" fill="var(--navy)" />
      </g>
      {[40, 104, 250, 314, 378, 524].map((x) => (
        <rect key={x} x={x} y="46" width="52" height="42" rx="8" fill="#0b2a55" />
      ))}
      {[176, 450].map((x) => (
        <g key={x}>
          <rect x={x} y="42" width="58" height="114" rx="5" fill="#dfe6d8" stroke="var(--navy)" strokeWidth="2" />
          <rect x={x + 6} y="50" width="20" height="44" rx="4" fill="#0b2a55" />
          <rect x={x + 32} y="50" width="20" height="44" rx="4" fill="#0b2a55" />
        </g>
      ))}
      <path d="M600 46 L632 46 Q646 50 656 72 L666 96 L600 96Z" fill="#0b2a55" />
      <text x="44" y="128" className="veh__brand veh__brand--light" fontSize="26">
        YOUR BRAND
      </text>
      <text x="252" y="128" className="veh__tag veh__tag--light" fontSize="13">
        next stop: your customers
      </text>
      <QrGlyph x={530} y={102} size={44} />
      <rect x="672" y="136" width="10" height="10" rx="3" fill="#ffe7a8" />
      {[70, 110, 560, 600].map((cx) => (
        <Wheel key={cx} cx={cx} cy={178} r={15} />
      ))}
    </svg>
  );
}

export type TaxiMode = "all" | "full" | "partial" | "windows" | "topper";

export function Taxi({ className = "", mode = "all" }: { className?: string; mode?: TaxiMode }) {
  const id = useId().replace(/:/g, "");
  const body =
    "M30 160 L30 128 Q30 112 48 108 L120 100 L172 58 Q182 50 196 50 L300 50 Q314 50 324 60 L366 100 L410 108 Q432 112 432 132 L432 160 Q432 168 424 168 L38 168 Q30 168 30 160Z";
  const winRear = "M184 62 L242 62 L242 100 L138 100Z";
  const winFront = "M252 62 L304 62 Q311 62 317 68 L350 100 L252 100Z";
  return (
    <svg
      className={`veh veh--taxi ${className}`}
      data-mode={mode}
      viewBox="0 0 460 220"
      role="img"
      aria-label={`Car with ${mode === "all" ? "a full wrap and digital roof topper" : mode + " branding"}`}
    >
      <defs>
        <clipPath id={`taxi-${id}`}>
          <path d={body} />
        </clipPath>
        <pattern id={`perf-${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="var(--orange)" />
          <circle cx="2.5" cy="2.5" r="1.3" fill="#0b2a55" />
        </pattern>
      </defs>
      <ellipse cx="231" cy="196" rx="200" ry="7" fill="rgba(0,0,0,.18)" />

      {/* roof topper */}
      <rect x="200" y="26" width="100" height="24" rx="5" fill="#2a3448" />
      <g className="veh__layer veh__topper">
        <rect x="203" y="29" width="94" height="18" rx="3" fill="var(--orange)" />
        <text x="250" y="42.5" textAnchor="middle" className="veh__topper-text" fontSize="11">
          YOUR AD · LIVE
        </text>
      </g>

      <path d={body} fill="#eef1f5" />
      <g clipPath={`url(#taxi-${id})`}>
        <g className="veh__layer veh__wrap-full">
          <rect x="0" y="40" width="460" height="140" fill="var(--orange)" />
          <path d="M0 140 C120 104 260 168 460 116 L460 180 L0 180Z" fill="var(--navy)" />
          <path d="M0 126 C120 92 260 150 460 102" stroke="var(--mint)" strokeWidth="5" fill="none" />
        </g>
        <g className="veh__layer veh__wrap-partial">
          <path d="M0 124 C140 110 280 140 460 120 L460 180 L0 180Z" fill="var(--orange)" />
        </g>
      </g>

      <path d={winRear} fill="#0b2a55" />
      <path d={winFront} fill="#0b2a55" />
      <g className="veh__layer veh__perf">
        <path d={winRear} fill={`url(#perf-${id})`} />
        <path d={winFront} fill={`url(#perf-${id})`} />
      </g>
      <line x1="247" y1="102" x2="247" y2="160" stroke="rgba(0,0,0,.25)" strokeWidth="2" />
      <rect x="200" y="112" width="18" height="4" rx="2" fill="rgba(0,0,0,.3)" />
      <rect x="290" y="112" width="18" height="4" rx="2" fill="rgba(0,0,0,.3)" />

      <g className="veh__layer veh__wrap-full">
        <text x="152" y="140" className="veh__brand veh__brand--light" fontSize="20">
          YOUR BRAND
        </text>
        <QrGlyph x={42} y={112} size={30} />
      </g>
      <g className="veh__layer veh__wrap-partial">
        <text x="156" y="154" className="veh__brand veh__brand--light" fontSize="17">
          YOUR BRAND
        </text>
        <QrGlyph x={44} y={126} size={27} />
      </g>

      <rect x="416" y="118" width="14" height="9" rx="3" fill="#ffe7a8" />
      <rect x="32" y="118" width="8" height="10" rx="2" fill="#e23b2e" />
      <circle cx="112" cy="166" r="34" fill="var(--navy-deep)" />
      <circle cx="352" cy="166" r="34" fill="var(--navy-deep)" />
      <Wheel cx={112} cy={166} r={27} />
      <Wheel cx={352} cy={166} r={27} />
    </svg>
  );
}
