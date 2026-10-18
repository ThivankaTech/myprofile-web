"use client";

interface Building {
  x: number;
  width: number;
  height: number;
  tower?: boolean;
}

// Fixed, hand-placed skyline — not meant to be a literal map of either
// city, just an evocative "tech hub at night" vignette shown once you've
// zoomed all the way in to a work location.
const BUILDINGS: Building[] = [
  { x: 14, width: 30, height: 46 },
  { x: 50, width: 22, height: 70 },
  { x: 78, width: 34, height: 58 },
  { x: 118, width: 26, height: 92, tower: true },
  { x: 150, width: 30, height: 54 },
  { x: 186, width: 20, height: 40 },
  { x: 212, width: 32, height: 76 },
  { x: 250, width: 24, height: 60 },
  { x: 280, width: 36, height: 50 },
  { x: 322, width: 22, height: 84, tower: true },
  { x: 350, width: 28, height: 44 },
];

function Windows({ building, groundY }: { building: Building; groundY: number }) {
  const cols = Math.max(2, Math.floor(building.width / 9));
  const rows = Math.max(2, Math.floor(building.height / 11));
  const windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = building.x + 4 + c * ((building.width - 8) / Math.max(1, cols - 1 || 1));
      const wy = groundY - building.height + 8 + r * ((building.height - 16) / Math.max(1, rows - 1 || 1));
      const seed = (r + 1) * 7 + (c + 1) * 13 + building.x;
      windows.push(
        <rect
          key={`${r}-${c}`}
          x={wx - 1.5}
          y={wy - 1.5}
          width={3}
          height={3}
          fill="#fbbf24"
          className="animate-window-glow"
          style={{
            animationDuration: `${2.5 + (seed % 5)}s`,
            animationDelay: `${(seed % 13) * 0.25}s`,
          }}
        />,
      );
    }
  }
  return <>{windows}</>;
}

export function CityScene({ label }: { label: string }) {
  const groundY = 128;

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ height: 160 }}>
      <svg viewBox="0 0 400 150" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1220" />
            <stop offset="100%" stopColor="#060a12" />
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={400} height={150} fill="url(#city-sky)" />

        {[...Array(18)].map((_, i) => (
          <circle
            key={i}
            cx={(i * 53 + 17) % 400}
            cy={(i * 29 + 9) % 70}
            r={0.7}
            fill="#ffffff"
            opacity={0.25 + ((i * 7) % 10) / 20}
          />
        ))}

        {BUILDINGS.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x}
              y={groundY - b.height}
              width={b.width}
              height={b.height}
              fill="#111c2b"
              stroke="#22314a"
              strokeWidth={0.5}
            />
            {b.tower && (
              <>
                <line
                  x1={b.x + b.width / 2}
                  y1={groundY - b.height}
                  x2={b.x + b.width / 2}
                  y2={groundY - b.height - 14}
                  stroke="#3a4a66"
                  strokeWidth={1}
                />
                <circle
                  cx={b.x + b.width / 2}
                  cy={groundY - b.height - 14}
                  r={1.6}
                  fill="#fb7185"
                  className="animate-window-glow"
                  style={{ animationDuration: "1.6s" }}
                />
              </>
            )}
            <Windows building={b} groundY={groundY} />
          </g>
        ))}

        <line x1={0} y1={groundY} x2={400} y2={groundY} stroke="#1c2a3f" strokeWidth={3} />
        <line
          x1={0}
          y1={groundY}
          x2={400}
          y2={groundY}
          stroke="#334155"
          strokeWidth={0.6}
          strokeDasharray="6 5"
        />

        <rect
          y={groundY - 2.5}
          width={7}
          height={3.5}
          rx={1}
          fill="#fde68a"
          className="animate-drive-right"
          style={{ animationDuration: "7s" }}
        />
        <rect
          y={groundY - 2.5}
          width={7}
          height={3.5}
          rx={1}
          fill="#fed7aa"
          className="animate-drive-left"
          style={{ animationDuration: "9s", animationDelay: "1.5s" }}
        />
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        ✨ {label}
      </div>
    </div>
  );
}
