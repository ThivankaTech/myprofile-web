// Maps a country name (as returned by the backend/seed data) to its flag
// emoji. Emoji flags are built from Unicode regional-indicator letters, so
// any ISO 3166-1 alpha-2 code works — this table only needs entries for
// countries that actually show up in the data.
const COUNTRY_ALPHA2: Record<string, string> = {
  Sweden: "SE",
  "Sri Lanka": "LK",
  France: "FR",
  Norway: "NO",
  Denmark: "DK",
};

export function countryFlag(countryName: string): string | null {
  const code = COUNTRY_ALPHA2[countryName];
  if (!code) return null;
  const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - "A".charCodeAt(0);
  return [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET))
    .join("");
}
