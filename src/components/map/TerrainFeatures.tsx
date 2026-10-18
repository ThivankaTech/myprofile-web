"use client";

import { Line, Marker } from "react-simple-maps";
import { TERRAIN_BY_COUNTRY } from "@/lib/terrainFeatures";

interface TerrainFeaturesProps {
  countryName: string;
  counterScale: number;
  // Optional lng/lat transform applied to every feature point — used to
  // keep mountains/lakes/roads/boats aligned with an enlarged country
  // shape when the map is exaggerating it for emphasis.
  transformPoint?: (lng: number, lat: number) => [number, number];
}

function Mountain({ counterScale, snow }: { counterScale: number; snow: boolean }) {
  return (
    <g
      transform={`scale(${counterScale})`}
      style={{ filter: `drop-shadow(0 0 2px rgba(${snow ? "255,255,255" : "134,204,163"},0.5))` }}
    >
      <polygon points="-9,2 0,-11 9,2" fill={snow ? "#3a4a63" : "#3f5c3a"} stroke={snow ? "#4b5c78" : "#4e7049"} strokeWidth={0.4} />
      {snow ? (
        <polygon points="-3.2,-6.5 0,-11 3.2,-6.5 0,-3.5" fill="#f1f5f9" opacity={0.95} />
      ) : (
        <polygon points="-3.2,-6.5 0,-11 3.2,-6.5 0,-3.5" fill="#6b9c5f" opacity={0.9} />
      )}
    </g>
  );
}

function Lake({ counterScale }: { counterScale: number }) {
  return (
    <g transform={`scale(${counterScale})`}>
      <ellipse
        rx={4.5}
        ry={2.4}
        fill="#38bdf8"
        fillOpacity={0.5}
        stroke="#7dd3fc"
        strokeWidth={0.5}
        className="animate-halo-pulse"
      />
    </g>
  );
}

function Boat({ counterScale }: { counterScale: number }) {
  return (
    <g transform={`scale(${counterScale * 1.6})`} style={{ filter: "drop-shadow(0 0 1.5px rgba(255,255,255,0.6))" }}>
      <g className="animate-boat-drift">
        <polygon points="-3,0 3,0 1.8,2.2 -1.8,2.2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.3} />
        <line x1={0} y1={0} x2={0} y2={-3.5} stroke="#cbd5e1" strokeWidth={0.4} />
      </g>
    </g>
  );
}

function Stupa({ counterScale }: { counterScale: number }) {
  return (
    <g
      transform={`scale(${counterScale * 1.3})`}
      style={{ filter: "drop-shadow(0 0 3px rgba(248,250,252,0.8))" }}
    >
      <rect x={-6} y={1} width={12} height={1.6} fill="#e2e8f0" />
      <path d="M -5 1 A 5 5 0 0 1 5 1 Z" fill="#f8fafc" />
      <rect x={-0.5} y={-9} width={1} height={5.5} fill="#f8fafc" />
      <circle cx={0} cy={-9.5} r={1} fill="#fde68a" className="animate-window-glow" style={{ animationDuration: "2s" }} />
    </g>
  );
}

export function TerrainFeatures({ countryName, counterScale, transformPoint }: TerrainFeaturesProps) {
  const config = TERRAIN_BY_COUNTRY[countryName];
  if (!config) return null;

  const t = transformPoint ?? ((lng: number, lat: number): [number, number] => [lng, lat]);

  return (
    <>
      {config.roadWaypoints?.slice(1).map((point, i) => {
        const from = config.roadWaypoints![i];
        return (
          <Line
            key={`road-${i}`}
            from={t(from.lng, from.lat)}
            to={t(point.lng, point.lat)}
            stroke="#fde68a"
            strokeWidth={0.9 * counterScale}
            strokeLinecap="round"
            opacity={0.5}
            style={{ filter: "drop-shadow(0 0 2px rgba(253,230,138,0.6))" }}
          />
        );
      })}

      {config.lakes?.map((point, i) => (
        <Marker key={`lake-${i}`} coordinates={t(point.lng, point.lat)}>
          <Lake counterScale={counterScale} />
        </Marker>
      ))}

      {config.mountains?.map((point, i) => (
        <Marker key={`mountain-${i}`} coordinates={t(point.lng, point.lat)}>
          <Mountain counterScale={counterScale} snow={Boolean(config.mountainsSnowCapped)} />
        </Marker>
      ))}

      {config.boats?.map((point, i) => (
        <Marker key={`boat-${i}`} coordinates={t(point.lng, point.lat)}>
          <Boat counterScale={counterScale} />
        </Marker>
      ))}

      {config.landmark && (
        <Marker coordinates={t(config.landmark.lng, config.landmark.lat)}>
          <Stupa counterScale={counterScale} />
        </Marker>
      )}
    </>
  );
}
