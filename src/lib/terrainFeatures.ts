export interface GeoPoint {
  lng: number;
  lat: number;
}

export interface TerrainConfig {
  mountains?: GeoPoint[];
  // Only genuinely snow-capped peaks (e.g. Sweden's Kjölen range) should
  // render with white caps — Sri Lanka's central highlands are tropical
  // hill country, not snow mountains.
  mountainsSnowCapped?: boolean;
  lakes?: GeoPoint[];
  // A chain of waypoints from high ground down toward the work-location
  // city, rendered as a glowing "road" — purely decorative, approximate
  // real-world placement, not real routing data.
  roadWaypoints?: GeoPoint[];
  // Scattered around the coastline, not just near the city — evokes the
  // "boats dotted around the island" look of the reference image.
  boats?: GeoPoint[];
  // A single standout landmark icon (e.g. a stupa), purely decorative.
  landmark?: GeoPoint;
}

// Approximate, illustrative coordinates for real landmarks (Kebnekaise and
// the Åre mountains for Sweden, the central highlands for Sri Lanka, etc.)
// — decorative set-dressing for the map, not navigational data.
export const TERRAIN_BY_COUNTRY: Record<string, TerrainConfig> = {
  Sweden: {
    mountains: [
      { lng: 18.0, lat: 68.1 },
      { lng: 17.0, lat: 67.3 },
      { lng: 15.6, lat: 65.0 },
      { lng: 13.1, lat: 63.4 },
    ],
    mountainsSnowCapped: true,
    lakes: [
      { lng: 13.3, lat: 58.9 },
      { lng: 14.6, lat: 58.4 },
      { lng: 16.3, lat: 60.0 },
    ],
    roadWaypoints: [
      { lng: 18.0, lat: 68.1 },
      { lng: 16.3, lat: 63.8 },
      { lng: 15.0, lat: 60.5 },
      { lng: 18.0686, lat: 59.3293 },
    ],
    boats: [
      { lng: 18.2, lat: 59.32 },
      { lng: 18.32, lat: 59.3 },
      { lng: 17.9, lat: 58.8 },
      { lng: 17.3, lat: 61.5 },
    ],
  },
  "Sri Lanka": {
    mountains: [
      { lng: 80.78, lat: 6.97 },
      { lng: 80.6, lat: 6.82 },
    ],
    lakes: [{ lng: 80.78, lat: 7.75 }],
    roadWaypoints: [
      { lng: 80.78, lat: 6.97 },
      { lng: 80.3, lat: 6.95 },
      { lng: 79.8612, lat: 6.9271 },
    ],
    // Ringed around the coastline rather than clustered at one spot —
    // echoes the reference image's boats scattered all around the island.
    boats: [
      { lng: 79.845, lat: 6.93 },
      { lng: 79.83, lat: 6.915 },
      { lng: 80.0, lat: 9.68 },
      { lng: 81.6, lat: 8.75 },
      { lng: 81.75, lat: 7.5 },
      { lng: 81.3, lat: 6.1 },
      { lng: 80.6, lat: 5.98 },
      { lng: 79.95, lat: 6.3 },
      { lng: 79.78, lat: 7.9 },
      { lng: 79.9, lat: 9.25 },
    ],
    landmark: { lng: 80.6337, lat: 7.2906 },
  },
};
