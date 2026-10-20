"use client";

import { geoBounds, geoCentroid, geoContains, geoInterpolate, geoOrthographic } from "d3-geo";
import { animate, AnimatePresence, motion } from "framer-motion";
import type { Feature, Geometry } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Line,
  Marker,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { CityScene } from "@/components/map/CityScene";
import { TerrainFeatures } from "@/components/map/TerrainFeatures";
import { monthIndex } from "@/lib/dates";
import { countryFlag } from "@/lib/countryFlag";
import { withBasePath } from "@/lib/basePath";
import type { TravelDestination, WorkExperience } from "@/lib/profile";

// 50m-resolution country boundaries (Natural Earth data, via the
// world-atlas package) — noticeably more accurate shapes than the default
// 110m set, especially for smaller countries like Sri Lanka.
const GEO_URL = withBasePath("/world-50m.json");

interface View {
  center: [number, number];
  zoom: number;
}

// Frame the overview around Europe and South Asia so the highlighted work
// countries stay readable while the map still shows the wider world.
const GLOBE_ROTATION: [number, number] = [-49, -30];
const GLOBE_SCALE = 300;
const DEFAULT_VIEW: View = { center: [49, 30], zoom: 1 };
const COUNTRY_ZOOM = 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const ZOOM_STEP_FACTOR = 1.6;
const CITY_ZOOM = 11;

// Matches the site's own design tokens (--accent indigo, --travel amber)
// instead of an unrelated teal/cyan palette, so the map reads as part of
// the same product rather than an embedded third-party widget. Indigo for
// the work story (pins, highlighted countries, the journey line) mirrors
// how the rest of the app already uses --accent for "serious" content;
// amber stays reserved for travel/fun, exactly like the Activities tab.
const PIN_COLOR = "#818cf8";
const TRAVEL_COLOR = "#f59e0b";
const PIN_SCALE = 0.5;
const COMPANY_DOT_COLOR = "#f43f5e";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 645;
const OVERVIEW_COUNTRY_SCALE = 1.1;
const SRI_LANKA_OVERVIEW_SCALE = 1.2;
const PROJECTION = geoOrthographic()
  .scale(GLOBE_SCALE)
  .rotate(GLOBE_ROTATION)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

// Classic teardrop map-pin: tip anchored at the marker's geo coordinate
// (0,0), bulb centered above it — matches a standard map-pin silhouette.
const PIN_BULB_CY = -13;
const PIN_PATH = "M0,0 C-0.8,-2 -7,-7.5 -7,-13 A7,7 0 1,1 7,-13 C7,-7.5 0.8,-2 0,0 Z";

interface WorldMapProps {
  workExperience: WorkExperience[];
  travelDestinations: TravelDestination[];
  selectedExperienceId: string | null;
  onSelectExperience: (id: string) => void;
  onSelectTravel: (id: string) => void;
}

interface Cluster {
  key: string;
  location: WorkExperience["location"];
  items: WorkExperience[];
}

interface AmbientLight {
  id: string;
  lng: number;
  lat: number;
  seed: number;
  country: string;
}

// Deterministic pseudo-random float in [0, 1) from two integers — avoids
// Math.random() so the scattered lights are stable across re-renders
// instead of jumping around every time React re-evaluates this.
function hash2(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Scatters points across a country's actual landmass (not just its
// bounding box) by sampling a jittered grid and keeping only points
// d3-geo confirms are inside the polygon. Used for both the scattered
// "town light" dots and the denser forest-texture tree glyphs — same
// technique, different density/seed-offset so the two don't coincide.
function scatterPoints(
  geo: Feature<Geometry>,
  countryName: string,
  grid: number,
  seedOffset: number,
): AmbientLight[] {
  const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(geo);
  const points: AmbientLight[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const jx = hash2(r * 31 + c + seedOffset, countryName.length) - 0.5;
      const jy = hash2(c * 17 + r + seedOffset, countryName.length + 1) - 0.5;
      const lng = minLng + ((c + 0.5 + jx * 0.7) / grid) * (maxLng - minLng);
      const lat = minLat + ((r + 0.5 + jy * 0.7) / grid) * (maxLat - minLat);
      if (geoContains(geo, [lng, lat])) {
        points.push({
          id: `${countryName}-${seedOffset}-${r}-${c}`,
          lng,
          lat,
          seed: r * grid + c,
          country: countryName,
        });
      }
    }
  }
  return points;
}

function TreeGlyph({ counterScale, seed }: { counterScale: number; seed: number }) {
  const scale = 0.8 + (seed % 5) * 0.08;
  return (
    <g transform={`scale(${counterScale * scale})`} opacity={0.85}>
      <polygon points="0,-4.5 -2.6,1.8 2.6,1.8" fill="#1f6b4f" />
      <polygon points="0,-6.5 -1.9,-1 1.9,-1" fill="#2a8562" />
      <rect x={-0.5} y={1.8} width={1} height={1.4} fill="#4b3621" />
    </g>
  );
}

const parseStartYear = monthIndex;

// Greedy word wrap into at most maxLines lines, ellipsizing the last one.
function wrapWords(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && `${current} ${word}`.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:]$/, "")}…`;
    return kept;
  }
  return lines;
}

function clusterByLocation(workExperience: WorkExperience[]): Cluster[] {
  const byKey = new Map<string, Cluster>();
  for (const exp of workExperience) {
    const key = `${exp.location.city}|${exp.location.country}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.items.push(exp);
    } else {
      byKey.set(key, { key, location: exp.location, items: [exp] });
    }
  }
  return [...byKey.values()];
}

interface CompanyDot {
  latest: WorkExperience;
  stints: WorkExperience[];
}

// Groups a cluster's experiences by employer, most recent employer first.
function companyDots(items: WorkExperience[]): CompanyDot[] {
  const byCompany = new Map<string, WorkExperience[]>();
  for (const item of items) {
    byCompany.set(item.company, [...(byCompany.get(item.company) ?? []), item]);
  }
  return [...byCompany.values()]
    .map((stints) => ({
      stints,
      latest: stints.reduce((a, b) => (parseStartYear(b.from) > parseStartYear(a.from) ? b : a)),
    }))
    .sort((a, b) => parseStartYear(b.latest.from) - parseStartYear(a.latest.from));
}

// Small deterministic offsets so clustered markers at the same city don't
// overlap once the cluster expands. Expressed in degrees rather than
// pixels so the spread stays sensible specifically at city-level zoom,
// where expansion happens.
function clusterOffset(index: number, total: number): [number, number] {
  if (total <= 1) return [0, 0];
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 0.6;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

// Module scope, not component state: the Map tab unmounts/remounts on
// every tab switch, but the intro should only ever play once per actual
// page load.
let hasPlayedIntro = false;

export function WorldMap({
  workExperience,
  travelDestinations,
  selectedExperienceId,
  onSelectExperience,
  onSelectTravel,
}: WorldMapProps) {
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [geographies, setGeographies] = useState<Feature<Geometry>[]>([]);
  // Intro reveal sequence: nothing highlighted on first paint, then the
  // map walks the work history in order — origin country lights up, the
  // route draws, destination country lights up. The map tab unmounts and
  // remounts every time the user switches tabs and back, so the "already
  // played" flag lives at module scope (survives remounts, resets only on
  // an actual page load) — otherwise this would replay every tab switch
  // instead of once per site visit. When it's already played, initialize
  // straight to the fully-revealed end state instead of empty.
  const [revealedCountries, setRevealedCountries] = useState<Set<string>>(() =>
    hasPlayedIntro ? new Set(workExperience.map((exp) => exp.location.country)) : new Set(),
  );
  const [revealedSegmentKeys, setRevealedSegmentKeys] = useState<Set<string>>(() => {
    if (!hasPlayedIntro) return new Set();
    // Mirrors journeySegments' own flatMap exactly (same index semantics)
    // so the pre-filled keys actually match what gets rendered.
    const sorted = [...workExperience].sort((a, b) => parseStartYear(a.from) - parseStartYear(b.from));
    const keys = sorted.slice(1).flatMap((exp, i) => {
      const prev = sorted[i];
      if (prev.location.city === exp.location.city && prev.location.country === exp.location.country) {
        return [];
      }
      return [`${prev.id}-${exp.id}`];
    });
    return new Set(keys);
  });
  const introStartedRef = useRef(hasPlayedIntro);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Fetched once, independent of the per-frame <Geographies> render below —
  // this feeds the ambient-light point-in-polygon computation, which would
  // be far too expensive to redo on every animation frame of a zoom.
  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const collection = feature(topology, topology.objects.countries as GeometryCollection);
        setGeographies(collection.features);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const clusters = useMemo(() => clusterByLocation(workExperience), [workExperience]);
  const expandedCluster = clusters.find((c) => c.key === expandedClusterKey) ?? null;

  // Countries where actual work happened are the "serious" highlight on
  // the map; everything else (including travel-only countries) stays
  // muted. Derived from the data rather than hardcoded so it generalizes
  // to however many countries the work history ends up covering.
  const highlightedCountries = useMemo(
    () => new Set(workExperience.map((exp) => exp.location.country)),
    [workExperience],
  );

  const countryCentroids = useMemo(() => {
    const centroids = new Map<string, [number, number]>();
    for (const geo of geographies) {
      const name = (geo.properties as { name?: string })?.name ?? "";
      if (highlightedCountries.has(name)) centroids.set(name, geoCentroid(geo));
    }
    return centroids;
  }, [geographies, highlightedCountries]);

  const ambientLights = useMemo(() => {
    const lights: AmbientLight[] = [];
    for (const geo of geographies) {
      const name = (geo.properties as { name?: string })?.name ?? "";
      if (!highlightedCountries.has(name)) continue;
      lights.push(...scatterPoints(geo, name, 5, 0));
    }
    return lights;
  }, [geographies, highlightedCountries]);

  const trees = useMemo(() => {
    const points: AmbientLight[] = [];
    for (const geo of geographies) {
      const name = (geo.properties as { name?: string })?.name ?? "";
      if (!highlightedCountries.has(name)) continue;
      points.push(...scatterPoints(geo, name, 13, 97));
    }
    return points;
  }, [geographies, highlightedCountries]);

  // Skip segments between two entries at the same city (e.g. two jobs in
  // the same town) — only draw the journey line where the location
  // actually changes, so "moved from Sri Lanka to Sweden" falls out of
  // the seeded dates rather than being hardcoded.
  const journeySegments = useMemo(() => {
    const chronological = [...workExperience].sort(
      (a, b) => parseStartYear(a.from) - parseStartYear(b.from),
    );
    return chronological.slice(1).flatMap((exp, i) => {
      const prev = chronological[i];
      if (prev.location.city === exp.location.city && prev.location.country === exp.location.country) {
        return [];
      }
      return [{ key: `${prev.id}-${exp.id}`, from: prev.location, to: exp.location }];
    });
  }, [workExperience]);

  // Chronological, de-duplicated country order — the sequence the intro
  // reveal walks through. Derived from the data instead of hardcoded so
  // it still makes sense if a third work country is ever added.
  const countryRevealOrder = useMemo(() => {
    const sorted = [...workExperience].sort(
      (a, b) => parseStartYear(a.from) - parseStartYear(b.from),
    );
    const seen = new Set<string>();
    const order: string[] = [];
    for (const exp of sorted) {
      if (!seen.has(exp.location.country)) {
        seen.add(exp.location.country);
        order.push(exp.location.country);
      }
    }
    return order;
  }, [workExperience]);

  // Runs once, after the country shapes have actually loaded (so there's
  // something to light up) — plays the "load map, highlight origin, draw
  // the route, highlight destination" sequence a single time.
  useEffect(() => {
    if (introStartedRef.current) return;
    if (geographies.length === 0 || countryRevealOrder.length === 0) return;
    introStartedRef.current = true;

    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    (async () => {
      // Let the porthole's own scale-in/rotate entrance (~1.3s, defined in
      // MapTab) finish landing before the country-reveal story starts —
      // otherwise both animations compete for attention at once.
      await sleep(1500);
      if (cancelled) return;
      setRevealedCountries(new Set([countryRevealOrder[0]]));

      for (const segment of journeySegments) {
        await sleep(1100);
        if (cancelled) return;
        setRevealedSegmentKeys((prev) => new Set(prev).add(segment.key));

        await sleep(1000);
        if (cancelled) return;
        setRevealedCountries((prev) => new Set(prev).add(segment.to.country));
      }

      if (!cancelled) hasPlayedIntro = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [geographies, countryRevealOrder, journeySegments]);

  function animateView(target: View, durationMs: number) {
    const start = viewRef.current;
    return new Promise<void>((resolve) => {
      animate(0, 1, {
        duration: durationMs / 1000,
        ease: "easeInOut",
        onUpdate: (t) => {
          const next: View = {
            center: [
              start.center[0] + (target.center[0] - start.center[0]) * t,
              start.center[1] + (target.center[1] - start.center[1]) * t,
            ],
            zoom: start.zoom + (target.zoom - start.zoom) * t,
          };
          viewRef.current = next;
          setView(next);
        },
        onComplete: resolve,
      });
    });
  }

  async function handleClusterClick(cluster: Cluster) {
    if (isAnimating) return;
    setIsAnimating(true);
    setExpandedClusterKey(null);
    setHighlightedIds([]);
    const target: [number, number] = [cluster.location.lng, cluster.location.lat];
    await animateView({ center: target, zoom: COUNTRY_ZOOM }, 700);
    await animateView({ center: target, zoom: CITY_ZOOM }, 700);
    setExpandedClusterKey(cluster.key);
    setHighlightedIds(cluster.items.map((item) => item.id));
    setIsAnimating(false);
  }

  async function handleReset() {
    if (isAnimating) return;
    setIsAnimating(true);
    setExpandedClusterKey(null);
    setHighlightedIds([]);
    await animateView(DEFAULT_VIEW, 700);
    setIsAnimating(false);
  }

  // Zoom buttons only change magnification, not what's currently expanded
  // or selected — matches how zoom controls behave on every map people
  // already know (Google Maps, Apple Maps), where zooming never discards
  // your current focus.
  async function handleZoomStep(factor: number) {
    if (isAnimating) return;
    setIsAnimating(true);
    const targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewRef.current.zoom * factor));
    await animateView({ center: viewRef.current.center, zoom: targetZoom }, 300);
    setIsAnimating(false);
  }

  const isZoomedIn = view.zoom > DEFAULT_VIEW.zoom + 0.1;
  const counterScale = 1 / view.zoom;

  // Keep land, pins, lights, and routes on their actual geographic
  // coordinates at every zoom. Scaling individual countries pulls them
  // away from the map and creates oversized, disconnected glow patches.
  const warp = (lng: number, lat: number): [number, number] => [lng, lat];

  // Detailed symbols are reserved for the close-up; at world scale the
  // country fill and glow should read as one continuous highlighted shape.
  const showDetail = isZoomedIn;
  const detailScale = counterScale;

  const clusterByCountry = useMemo(() => {
    const m = new Map<string, Cluster>();
    for (const cluster of clusters) {
      if (!m.has(cluster.location.country)) m.set(cluster.location.country, cluster);
    }
    return m;
  }, [clusters]);

  return (
    <div className="h-full w-full">
      <div className="relative h-full w-full overflow-hidden ">
        {/* Globe lighting: specular highlight upper-left plus a darkened
            limb, drawn over the SVG so the flat projection reads as a
            sphere. Sized to the globe (93% of the viewport) not the box. */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[5] aspect-square w-[93%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 26%, rgba(199,210,254,0.22), transparent 38%), radial-gradient(circle at 50% 50%, transparent 58%, rgba(10,8,32,0.55) 100%)",
            boxShadow: "0 0 60px 6px rgba(129,140,248,0.35), inset 0 0 40px rgba(129,140,248,0.25)",
          }}
        />
        {/* The map now sits inside a circular porthole (clipped with
            overflow-hidden + rounded-full in MapTab), so controls live in
            a safe bottom-center zone rather than the corners — the
            corners of this bounding box fall outside the visible disk. */}
        <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2">
          {isZoomedIn && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur hover:bg-black/65"
            >
              ← World view
            </button>
          )}

          <div className="flex overflow-hidden rounded-full border border-white/15 bg-black/50 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => handleZoomStep(ZOOM_STEP_FACTOR)}
              disabled={isAnimating || view.zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="flex h-8 w-8 items-center justify-center text-base font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
            <div className="w-px bg-white/15" />
            <button
              type="button"
              onClick={() => handleZoomStep(1 / ZOOM_STEP_FACTOR)}
              disabled={isAnimating || view.zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="flex h-8 w-8 items-center justify-center text-base font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>
          </div>
        </div>

        <div className="h-full w-full" style={{ perspective: 1400, perspectiveOrigin: "50% 12%" }}>
        <div
          className="h-full w-full"
          style={{
            transform: `rotateX(${isZoomedIn ? 38 : 0}deg) scale(${isZoomedIn ? 1.12 : 1})`,
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
            transition: "transform 0.7s ease-in-out",
          }}
        >
        <ComposableMap
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          projection="geoOrthographic"
          projectionConfig={{ scale: GLOBE_SCALE, rotate: GLOBE_ROTATION }}
          // The porthole is a square, the map's own viewBox is landscape
          // (1000x645) — "slice" crops to fill the circle edge-to-edge
          // instead of letterboxing with empty space top and bottom.
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <radialGradient id="world-ocean" cx="38%" cy="32%" r="80%">
              <stop offset="0%" stopColor="#3730a3" />
              <stop offset="55%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0a0820" />
            </radialGradient>
            <radialGradient id="terrain-fill" cx="35%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#c7d2fe" />
              <stop offset="38%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#3730a3" />
            </radialGradient>
            <filter id="terrain-texture" x="-18%" y="-12%" width="136%" height="124%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.065 0.09"
                numOctaves="4"
                seed="17"
                result="terrain-noise"
              />
              <feColorMatrix in="terrain-noise" type="saturate" values="0.35" result="muted-terrain" />
              <feComponentTransfer in="muted-terrain" result="soft-terrain">
                <feFuncA type="table" tableValues="0 0.65" />
              </feComponentTransfer>
              <feComposite in="soft-terrain" in2="SourceAlpha" operator="in" result="clipped-terrain" />
              <feBlend in="SourceGraphic" in2="clipped-terrain" mode="multiply" />
            </filter>
            <linearGradient id="stockholm-scene" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#45a8dc" />
              <stop offset="55%" stopColor="#d69d73" />
              <stop offset="100%" stopColor="#135175" />
            </linearGradient>
            <linearGradient id="colombo-scene" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ab9ed" />
              <stop offset="55%" stopColor="#ffb763" />
              <stop offset="100%" stopColor="#075b75" />
            </linearGradient>
            <clipPath id="callout-photo-clip">
              <rect x={151} y={7} width={62} height={68} rx={5} />
            </clipPath>
          </defs>

          
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            // Touch is left to the page (scroll), not the map: a finger on the
            // globe would otherwise drag it away. Mouse drag, the wheel and the
            // +/- buttons still work; pins stay tappable.
            filterZoomEvent={(event: Event) => {
              if (event.type.startsWith("touch")) return false;
              const mouse = event as MouseEvent;
              return !mouse.ctrlKey && !mouse.button;
            }}
            onMoveEnd={({ coordinates, zoom }) => {
              if (isAnimating || !coordinates || zoom === undefined) return;
              // Commit where the drag actually left it first — animateView
              // reads viewRef.current as its start point, so skipping this
              // made the "snap back" below a same-point no-op while the
              // globe stayed at d3-zoom's last imperative transform.
              const next = { center: coordinates, zoom };
              viewRef.current = next;
              setView(next);
              // At world-view zoom a drag has nowhere purposeful to go, so
              // spring it back rather than leaving the globe stuck wherever
              // it was dragged to. Once zoomed into a cluster, panning is
              // deliberate exploration and sticks until "World view" is
              // clicked.
              if (zoom <= DEFAULT_VIEW.zoom + 0.1) {
                setIsAnimating(true);
                void animateView(DEFAULT_VIEW, 500).then(() => setIsAnimating(false));
              }
            }}
          >
            <Sphere id="globe-sphere" fill="url(#world-ocean)" stroke="#818cf8" strokeWidth={1.2 * counterScale} />
            <Graticule stroke="#818cf8" strokeWidth={0.4 * counterScale} style={{ opacity: 0.22 }} step={[15, 15]} />
            <Geographies geography={geographies}>
              {({ geographies }) =>
                [...geographies]
                  .sort((left, right) => {
                    const leftName = (left.properties as { name?: string })?.name ?? "";
                    const rightName = (right.properties as { name?: string })?.name ?? "";
                    return Number(highlightedCountries.has(leftName)) - Number(highlightedCountries.has(rightName));
                  })
                  .map((geo) => {
                  const countryName = (geo.properties as { name?: string })?.name ?? "";
                  const isHighlighted = highlightedCountries.has(countryName);

                  if (!isHighlighted) {
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#1e1b4b"
                        stroke="#4338ca"
                        className="outline-none transition-colors duration-150 hover:fill-[#2e2a6b]"
                        style={{ strokeWidth: 0.85 * counterScale, opacity: 0.94 }}
                      />
                    );
                  }

                  const cluster = clusterByCountry.get(countryName);
                  const centroid = countryCentroids.get(countryName);
                  const projectedCentroid = centroid ? PROJECTION(centroid) : null;
                  const countryScale = countryName === "Sri Lanka"
                    ? SRI_LANKA_OVERVIEW_SCALE
                    : OVERVIEW_COUNTRY_SCALE;
                  const transform = !isZoomedIn && projectedCentroid
                    ? `translate(${projectedCentroid[0]} ${projectedCentroid[1]}) scale(${countryScale}) translate(${-projectedCentroid[0]} ${-projectedCentroid[1]})`
                    : undefined;
                  // Revealed once the intro sequence (or, after first
                  // load, the data itself) says this country's turn has
                  // come. Until then it sits underneath looking like any
                  // other country — see the plain fill just below.
                  const isRevealed = revealedCountries.has(countryName);
                  return (
                    <g key={geo.rsmKey}>
                      {/* Plain base fill underneath — what you see before
                          this country's reveal, and what shows through at
                          the edges once scaled up for the overview. */}
                      <Geography
                        geography={geo}
                        fill="#1e1b4b"
                        stroke="#4338ca"
                        className="pointer-events-none outline-none"
                        style={{ strokeWidth: 0.85 * counterScale, opacity: 0.94 }}
                      />
                      <g
                        transform={transform}
                        style={{
                          opacity: isRevealed ? 1 : 0,
                          pointerEvents: isRevealed ? "auto" : "none",
                          transition: "opacity 1.1s ease-out",
                        }}
                      >
                        <Geography
                          geography={geo}
                          fill="#6366f1"
                          stroke="none"
                          className="pointer-events-none"
                          style={{ filter: `blur(${3 * counterScale}px)`, opacity: 0.9 }}
                        />
                        <Geography
                          geography={geo}
                          fill="none"
                          stroke="#a5b4fc"
                          className="pointer-events-none"
                          style={{
                            strokeWidth: 4.5 * counterScale,
                            filter: `blur(${2 * counterScale}px)`,
                            opacity: 0.88,
                          }}
                        />
                        <Geography
                          geography={geo}
                          fill="none"
                          stroke="#e0e7ff"
                          className="pointer-events-none"
                          style={{
                            strokeWidth: 1.5 * counterScale,
                            opacity: 1,
                          }}
                        />
                        {/* The whole country is the click target, not just
                            the small pin — a far larger, easier hit area. */}
                        <Geography
                          geography={geo}
                          // At world scale, use a flatter and brighter color so
                          // tiny highlighted countries read as filled regions.
                          // Keep the terrain gradient for the close-up scene.
                          fill="url(#terrain-fill)"
                          stroke="#c7d2fe"
                          role={cluster ? "button" : undefined}
                          aria-label={
                            cluster
                              ? `${countryName} — ${cluster.items.length} work experience${cluster.items.length === 1 ? "" : "s"}, click to explore`
                              : undefined
                          }
                          onClick={() => cluster && handleClusterClick(cluster)}
                          className="outline-none transition-[filter] duration-200 hover:brightness-125"
                          style={{
                            filter: "url(#terrain-texture)",
                            strokeWidth: (isZoomedIn ? 2 : 1.8) * counterScale,
                            cursor: cluster && !isAnimating ? "pointer" : "default",
                          }}
                        />
                      </g>
                    </g>
                  );
                })
              }
            </Geographies>

            
            {showDetail &&
              trees.map((tree) => (
                <Marker key={tree.id} coordinates={warp(tree.lng, tree.lat)}>
                  <TreeGlyph counterScale={detailScale} seed={tree.seed} />
                </Marker>
              ))}

            {showDetail &&
              [...highlightedCountries].map((country) => (
                <TerrainFeatures
                  key={country}
                  countryName={country}
                  counterScale={detailScale}
                  transformPoint={(lng, lat) => warp(lng, lat)}
                />
              ))}

            {showDetail && ambientLights.map((light) => (
              <Marker key={light.id} coordinates={warp(light.lng, light.lat)}>
                <g transform={`scale(${counterScale})`} className="pointer-events-none">
                  <circle
                    r={1.3}
                    fill="#ffe8a8"
                    className="animate-window-glow"
                    style={{
                      animationDuration: `${2.2 + (light.seed % 4)}s`,
                      animationDelay: `${(light.seed % 11) * 0.3}s`,
                    }}
                  />
                </g>
              </Marker>
            ))}

            {journeySegments.map((segment) => (
              <Line
                key={segment.key}
                from={warp(segment.from.lng, segment.from.lat)}
                to={warp(segment.to.lng, segment.to.lat)}
                stroke={PIN_COLOR}
                strokeWidth={1.5 * counterScale}
                strokeDasharray={`${5 * counterScale} ${4 * counterScale}`}
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 0 5px rgba(251,191,36,0.75))",
                  opacity: revealedSegmentKeys.has(segment.key) ? 0.95 : 0,
                  transition: "opacity 1s ease-out",
                }}
              />
            ))}

            {!isZoomedIn && journeySegments.map((segment) => {
              if (!revealedSegmentKeys.has(segment.key)) return null;
              const from = warp(segment.from.lng, segment.from.lat);
              const to = warp(segment.to.lng, segment.to.lat);
              const interpolate = geoInterpolate(from, to);
              const coordinates = interpolate(0.5) as [number, number];
              const before = PROJECTION(interpolate(0.49));
              const after = PROJECTION(interpolate(0.51));
              if (!before || !after) return null;
              const angle = Math.atan2(after[1] - before[1], after[0] - before[0]) * 180 / Math.PI + 90;
              return (
                <Marker key={`plane-${segment.key}`} coordinates={coordinates}>
                  <g
                    transform={`scale(${counterScale}) rotate(${angle})`}
                    style={{ filter: "drop-shadow(0 0 4px rgba(255,216,74,0.85))" }}
                    className="pointer-events-none"
                  >
                    <path
                      d="M0,-7 L1.4,-1.6 L5,1.3 L5,2.5 L1.2,1.5 L1.5,5 L3,6 L3,7 L0,6 L-3,7 L-3,6 L-1.5,5 L-1.2,1.5 L-5,2.5 L-5,1.3 L-1.4,-1.6 Z"
                      fill="#ffd84a"
                    />
                  </g>
                </Marker>
              );
            })}

            {clusters.map((cluster) => {
              if (cluster.key === expandedClusterKey) return null;
              if (!revealedCountries.has(cluster.location.country)) return null;
              const flag = countryFlag(cluster.location.country);
              if (!flag) return null;
              return (
                <Marker
                  key={`flag-${cluster.key}`}
                  coordinates={warp(cluster.location.lng, cluster.location.lat)}
                >
                  <g transform={`scale(${counterScale})`} className="pointer-events-none animate-pop-in">
                    <text
                      textAnchor="middle"
                      y={-16}
                      fontSize={16}
                      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                    >
                      {flag}
                    </text>
                  </g>
                </Marker>
              );
            })}

            {clusters.map((cluster) => {
              if (!revealedCountries.has(cluster.location.country)) return null;
              if (cluster.key !== expandedClusterKey) {
                return (
                  <Marker
                    key={cluster.key}
                    coordinates={warp(cluster.location.lng, cluster.location.lat)}
                  >
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={`${cluster.location.city}, ${cluster.location.country} — ${cluster.items.length} work experience${cluster.items.length === 1 ? "" : "s"}`}
                      onClick={() => handleClusterClick(cluster)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleClusterClick(cluster);
                        }
                      }}
                      transform={`scale(${counterScale * PIN_SCALE})`}
                      className="outline-none animate-pop-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      style={{ cursor: isAnimating ? "default" : "pointer" }}
                    >
                      <path
                        d={PIN_PATH}
                        fill={PIN_COLOR}
                        stroke="#fffbeb"
                        strokeWidth={1.2}
                        style={{ filter: "drop-shadow(0 0 5px rgba(251,191,36,0.8))" }}
                      />
                      <circle cx={0} cy={PIN_BULB_CY} r={2.8} fill="#fffbeb" />
                      {cluster.items.length > 1 && (
                        <text
                          x={0}
                          y={PIN_BULB_CY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={3.4}
                          fontWeight={700}
                          fill="#1c1206"
                        >
                          {cluster.items.length}
                        </text>
                      )}
                    </g>
                  </Marker>
                );
              }

              // One dot per company: several stints at the same employer
              // (e.g. four roles at Rebtel) share a dot that opens its most
              // recent role. Offices in one city are fanned out slightly,
              // since at city scale they'd otherwise sit on top of each other.
              const companies = companyDots(cluster.items);
              return companies.map(({ latest, stints }, i) => {
                const [dLng, dLat] = clusterOffset(i, companies.length);
                const selected = stints.some((s) => s.id === selectedExperienceId);
                const highlighted = highlightedIds.includes(latest.id);
                const labelWidth = latest.company.length * 6.4 + 18;
                return (
                  <Marker
                    key={latest.company}
                    coordinates={[cluster.location.lng + dLng, cluster.location.lat + dLat]}
                  >
                    <g
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      aria-label={`${latest.company}, ${latest.location.city} — ${stints.length} role${stints.length === 1 ? "" : "s"}`}
                      onClick={() => onSelectExperience(latest.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectExperience(latest.id);
                        }
                      }}
                      transform={`scale(${counterScale})`}
                      className="outline-none animate-pop-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      style={{ cursor: "pointer" }}
                    >
                      {(highlighted || selected) && (
                        <circle r={8} fill="none" stroke={COMPANY_DOT_COLOR} strokeWidth={1.5} opacity={0.7}>
                          <animate attributeName="r" values="7;18;7" dur="1.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        r={selected ? 8 : 6.5}
                        fill={COMPANY_DOT_COLOR}
                        stroke="#fff1f2"
                        strokeWidth={1.6}
                        style={{ filter: "drop-shadow(0 0 6px rgba(244,63,94,0.9))" }}
                      />
                      <g transform="translate(13,-9)">
                        <rect
                          width={labelWidth}
                          height={18}
                          rx={9}
                          fill="#1e1b4b"
                          stroke={COMPANY_DOT_COLOR}
                          strokeWidth={0.9}
                          opacity={0.95}
                        />
                        <text x={9} y={12.4} fontSize={10.5} fontWeight={600} fill="#f8fafc">
                          {latest.company}
                        </text>
                      </g>
                      <title>{`${latest.company} — ${stints.length} role${stints.length === 1 ? "" : "s"}`}</title>
                    </g>
                  </Marker>
                );
              });
            })}
            {!isZoomedIn && clusters.map((cluster) => {
              if (!revealedCountries.has(cluster.location.country)) return null;
              const experience = cluster.items.reduce((latest, item) =>
                parseStartYear(item.from) > parseStartYear(latest.from) ? item : latest,
              );
              const flag = countryFlag(cluster.location.country);
              const isSriLanka = cluster.location.country === "Sri Lanka";
              const photo = cluster.items.map((item) => item.location.photo).find(Boolean) ?? null;
              const CARD_WIDTH = 220;
              const CARD_HEIGHT = 82;
              // Sri Lanka's card opens left of its pin (the pin sits near the
              // right edge of the globe). Sweden's opens to the right, into the
              // empty space over Russia, so it doesn't cover Western Europe
              // where the travel pins are.
              const dx = isSriLanka ? -CARD_WIDTH - 8 : 60;
              const dy = isSriLanka ? -(CARD_HEIGHT + 28) : 22;
              // Nearest point on the card's boundary to the pin at (0,0) —
              // works for any dx/dy combination, not just a centered card.
              const nearX = dx > 0 ? dx : dx + CARD_WIDTH < 0 ? dx + CARD_WIDTH : 0;
              const nearY = dy < 0 ? dy + CARD_HEIGHT : dy;
              const fallbackBlurb = isSriLanka
                ? "Rich culture, stunning nature, and warm people."
                : "Cold winters, vibrant cities, and endless opportunities.";
              const [firstLine, secondLine] = wrapWords(experience.summary || fallbackBlurb, 36, 2);
              const roleLine = experience.role.length > 36 ? `${experience.role.slice(0, 35)}…` : experience.role;
              return (
                <Marker
                  key={`callout-${cluster.key}`}
                  coordinates={warp(cluster.location.lng, cluster.location.lat)}
                >
                  <g transform={`scale(${counterScale})`} className="pointer-events-none animate-pop-in max-sm:hidden">
                    <path
                      d={`M0,0 L${nearX},${nearY}`}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth={1.4}
                      opacity={0.95}
                    />
                    <g transform={`translate(${dx},${dy})`} style={{ filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.55))" }}>
                      <rect width={CARD_WIDTH} height={82} rx={8} fill="#1e1b4b" stroke="#6366f1" strokeWidth={1.2} />
                      <rect x={1} y={1} width={CARD_WIDTH - 2} height={80} rx={7} fill="none" stroke="#4338ca" strokeWidth={0.5} />
                      <text x={10} y={19} fontSize={11} fontWeight={700} fill="#f8fafc">
                        {`${flag}  ${cluster.location.country}`}
                      </text>
                      <text x={10} y={38} fontSize={9} fill="#d8e5f2">
                        {`⌖  ${cluster.location.city} · ${experience.company}`}
                      </text>
                      <text x={10} y={54} fontSize={7.2} fontWeight={600} fill="#dce9f4">
                        {roleLine}
                      </text>
                      <text x={10} y={67} fontSize={6.6} fill="#b8cad8">
                        {firstLine}
                      </text>
                      {secondLine && (
                        <text x={10} y={76} fontSize={6.6} fill="#b8cad8">
                          {secondLine}
                        </text>
                      )}
                      {photo ? (
                        <g>
                          <image
                            href={withBasePath(photo.src)}
                            x={151}
                            y={7}
                            width={62}
                            height={68}
                            preserveAspectRatio={`${photo.focus === "left" ? "xMin" : photo.focus === "right" ? "xMax" : "xMid"}YMid slice`}
                            clipPath="url(#callout-photo-clip)"
                          />
                          <rect x={151} y={7} width={62} height={68} rx={5} fill="none" stroke="#818cf8" strokeOpacity={0.6} strokeWidth={0.8} />
                        </g>
                      ) : (
                      <g>
                        <rect x={151} y={7} width={62} height={68} rx={5} fill={isSriLanka ? "url(#colombo-scene)" : "url(#stockholm-scene)"} />
                        {isSriLanka ? (
                          <>
                            <path d="M151 57h62v18h-62z" fill="#07516c" opacity={0.9} />
                            <path d="M158 57V40h8v17m3 0V32h9v25m3 0V45h9v12m3 0V38h8v19" fill="#183b50" />
                            <path d="M195 56V20h3V14h2v6h3v36" fill="#233f52" />
                            <circle cx={196} cy={14} r={2.4} fill="#ff4d92" />
                            <path d="M154 62q10-4 20 0t20 0t19 0" fill="none" stroke="#7bd5e9" strokeWidth={1} opacity={0.8} />
                          </>
                        ) : (
                          <>
                            <path d="M151 53h62v22h-62z" fill="#12516b" opacity={0.9} />
                            <path d="M155 53V40h8v13m2 0V34h9v19m3 0V43h8v10m2 0V37h9v16m3 0V45h9v8" fill="#734c43" />
                            <path d="M188 51V22h3V15h2v7h4v29" fill="#334154" />
                            <path d="M151 59q13-4 25 0t25 0t12 0" fill="none" stroke="#8ad9ec" strokeWidth={1} opacity={0.85} />
                          </>
                        )}
                      </g>
                      )}
                    </g>
                  </g>
                </Marker>
              );
            })}

            {travelDestinations.map((dest) => {
              const hasPhoto = dest.images.length > 0;
              const label = `${dest.location.city}, ${dest.location.country}`;
              return (
                <Marker key={dest.id} coordinates={warp(dest.location.lng, dest.location.lat)}>
                  <g
                    role={hasPhoto ? "button" : undefined}
                    tabIndex={hasPhoto ? 0 : undefined}
                    aria-label={hasPhoto ? `${label} — view photo` : undefined}
                    onClick={hasPhoto ? () => onSelectTravel(dest.id) : undefined}
                    onKeyDown={
                      hasPhoto
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectTravel(dest.id);
                            }
                          }
                        : undefined
                    }
                    transform={`scale(${counterScale * PIN_SCALE * 0.8})`}
                    className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                    style={{ cursor: hasPhoto ? "pointer" : "default" }}
                  >
                    <path
                      d={PIN_PATH}
                      fill={TRAVEL_COLOR}
                      stroke="#fffbeb"
                      strokeWidth={1.2}
                      style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.8))" }}
                    />
                    <circle cx={0} cy={PIN_BULB_CY} r={2.8} fill="#fffbeb" />
                    <circle cx={0} cy={PIN_BULB_CY} r={12} fill="transparent" />
                    <title>{hasPhoto ? `${label} — click to see a photo` : label}</title>
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
        </div>
        </div>
      </div>

      <AnimatePresence>
        {expandedCluster && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2">
              <CityScene
                label={`${expandedCluster.location.city}, ${expandedCluster.location.country}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
