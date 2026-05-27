import type { Station } from "@/lib/types";

/**
 * Jetex global FBO destination roster — exactly the 48 destinations listed at
 * https://www.jetex.com/destinations/ as of 2026-05-27.
 *
 * Coordinates are the published airport positions (ICAO/IATA tracked back to
 * source via the OurAirports open dataset). The `tier` is a portfolio-only
 * classification used to drive zoom-dependent visibility on the map — there
 * is no official Jetex tiering. `isHQ` is reserved for Dubai International
 * (Global HQ).
 *
 * Why the (often unexpected) airport choices:
 *   - "Paris" → LFPB Le Bourget, the canonical business-jet field for Paris.
 *   - "London" → EGKB Biggin Hill, Jetex's London BizAv FBO.
 *   - "Miami" → KOPF Opa-locka Executive — Miami's main business-jet field.
 *   - "Singapore" → WSSL Seletar, Singapore's BizAv field (not Changi).
 *   - "Rome" → LIRA Ciampino, Rome's BizAv-friendly airport.
 *   - "Madrid" → LEMD Barajas (main field), "Madrid-Torrejón" → LETO.
 */
export const STATIONS: Station[] = [
  // ─────────────────────────────────────────────────────────────────────────
  //  UAE — Global HQ + sister fields
  // ─────────────────────────────────────────────────────────────────────────
  {
    icao: "OMDB",
    iata: "DXB",
    name: "Dubai International — Jetex Global HQ",
    city: "Dubai DXB",
    country: "UAE",
    region: "Middle East",
    lat: 25.2532,
    lon: 55.3657,
    tier: "Ultra-VIP",
    isHQ: true,
  },
  {
    icao: "OMDW",
    iata: "DWC",
    name: "Al Maktoum International",
    city: "Dubai DWC",
    country: "UAE",
    region: "Middle East",
    lat: 24.8967,
    lon: 55.1614,
    tier: "Ultra-VIP",
  },
  {
    icao: "OMAA",
    iata: "AUH",
    name: "Abu Dhabi International",
    city: "Abu Dhabi",
    country: "UAE",
    region: "Middle East",
    lat: 24.4330,
    lon: 54.6511,
    tier: "VIP",
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  Oman
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "OOMS", iata: "MCT", name: "Muscat International", city: "Muscat", country: "Oman", region: "Middle East", lat: 23.5933, lon: 58.2844, tier: "VIP" },
  { icao: "OOSA", iata: "SLL", name: "Salalah Airport", city: "Salalah", country: "Oman", region: "Middle East", lat: 17.0387, lon: 54.0913, tier: "Standard" },

  // ─────────────────────────────────────────────────────────────────────────
  //  Africa
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "DIAP", iata: "ABJ", name: "Abidjan Félix Houphouët-Boigny", city: "Abidjan", country: "Ivory Coast", region: "Africa", lat: 5.2614, lon: -3.9263, tier: "Standard" },
  { icao: "GMMN", iata: "CMN", name: "Casablanca Mohammed V", city: "Casablanca", country: "Morocco", region: "Africa", lat: 33.3675, lon: -7.5898, tier: "VIP" },
  { icao: "GMMX", iata: "RAK", name: "Marrakech Menara", city: "Marrakech", country: "Morocco", region: "Africa", lat: 31.6069, lon: -8.0363, tier: "VIP" },
  { icao: "GMME", iata: "RBA", name: "Rabat-Salé", city: "Rabat", country: "Morocco", region: "Africa", lat: 34.0515, lon: -6.7515, tier: "Standard" },
  { icao: "GMAD", iata: "AGA", name: "Agadir Al Massira", city: "Agadir", country: "Morocco", region: "Africa", lat: 30.3250, lon: -9.4131, tier: "Standard" },
  { icao: "GMMH", iata: "VIL", name: "Dakhla Airport", city: "Dakhla", country: "Morocco", region: "Africa", lat: 23.7183, lon: -15.9320, tier: "Standard" },

  // ─────────────────────────────────────────────────────────────────────────
  //  Europe — UK / Italy
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "EGKB", iata: "BQH", name: "London Biggin Hill", city: "London", country: "UK", region: "Europe", lat: 51.3308, lon: 0.0325, tier: "Ultra-VIP" },
  { icao: "LIRA", iata: "CIA", name: "Rome Ciampino", city: "Rome", country: "Italy", region: "Europe", lat: 41.7994, lon: 12.5949, tier: "VIP" },

  // ─────────────────────────────────────────────────────────────────────────
  //  Europe — France (Paris area + regional, 19 destinations)
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "LFPB", iata: "LBG", name: "Paris Le Bourget", city: "Paris", country: "France", region: "Europe", lat: 48.9694, lon: 2.4414, tier: "Ultra-VIP" },
  { icao: "LFPG", iata: "CDG", name: "Paris Charles de Gaulle", city: "Paris-Charles de Gaulle", country: "France", region: "Europe", lat: 49.0097, lon: 2.5479, tier: "VIP" },
  { icao: "LFPT", iata: "POX", name: "Pontoise–Cormeilles", city: "Paris-Pontoise", country: "France", region: "Europe", lat: 49.0967, lon: 2.0408, tier: "Standard" },
  { icao: "LFMA", iata: "QXB", name: "Aix-les-Milles", city: "Aix-les-Milles", country: "France", region: "Europe", lat: 43.5052, lon: 5.3675, tier: "Standard" },
  { icao: "LFJR", iata: "ANE", name: "Angers-Loire", city: "Angers Loire", country: "France", region: "Europe", lat: 47.5603, lon: -0.3122, tier: "Standard" },
  { icao: "LFLA", iata: "AUF", name: "Auxerre-Branches", city: "Auxerre", country: "France", region: "Europe", lat: 47.8500, lon: 3.4972, tier: "Standard" },
  { icao: "LFLD", iata: "BOU", name: "Bourges", city: "Bourges", country: "France", region: "Europe", lat: 47.0581, lon: 2.3700, tier: "Standard" },
  { icao: "LFLH", iata: "XCD", name: "Chalon-Champforgeuil", city: "Chalon-sur-Saône", country: "France", region: "Europe", lat: 46.7600, lon: 4.7967, tier: "Standard" },
  { icao: "LFRC", iata: "CER", name: "Cherbourg-Maupertus", city: "Cherbourg", country: "France", region: "Europe", lat: 49.6500, lon: -1.4700, tier: "Standard" },
  { icao: "LFSD", iata: "DIJ", name: "Dijon-Longvic", city: "Dijon", country: "France", region: "Europe", lat: 47.2689, lon: 5.0900, tier: "Standard" },
  { icao: "LFGJ", iata: "DLE", name: "Dole-Jura", city: "Dole", country: "France", region: "Europe", lat: 47.0392, lon: 5.4272, tier: "Standard" },
  { icao: "LFRH", iata: "LRT", name: "Lorient South Brittany", city: "Lorient", country: "France", region: "Europe", lat: 47.7606, lon: -3.4400, tier: "Standard" },
  { icao: "LFML", iata: "MRS", name: "Marseille Provence", city: "Marseille", country: "France", region: "Europe", lat: 43.4393, lon: 5.2214, tier: "VIP" },
  { icao: "LFTW", iata: "FNI", name: "Nîmes-Garons", city: "Nîmes", country: "France", region: "Europe", lat: 43.7574, lon: 4.4163, tier: "Standard" },
  { icao: "LFSR", iata: "RHE", name: "Reims-Champagne", city: "Reims", country: "France", region: "Europe", lat: 49.3097, lon: 4.0500, tier: "Standard" },
  { icao: "LFBO", iata: "TLS", name: "Toulouse Blagnac", city: "Toulouse", country: "France", region: "Europe", lat: 43.6294, lon: 1.3638, tier: "VIP" },
  { icao: "LFBF", iata: "TLF", name: "Toulouse Francazal", city: "Toulouse Francazal", country: "France", region: "Europe", lat: 43.5453, lon: 1.3681, tier: "Standard" },
  { icao: "LFOT", iata: "TUF", name: "Tours-Val de Loire", city: "Tours", country: "France", region: "Europe", lat: 47.4322, lon: 0.7275, tier: "Standard" },
  { icao: "LFQB", iata: "QYR", name: "Troyes-Barberey", city: "Troyes", country: "France", region: "Europe", lat: 48.3225, lon: 4.0167, tier: "Standard" },

  // ─────────────────────────────────────────────────────────────────────────
  //  Europe — Spain
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "LEBL", iata: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain", region: "Europe", lat: 41.2974, lon: 2.0784, tier: "VIP" },
  { icao: "LEIB", iata: "IBZ", name: "Ibiza", city: "Ibiza", country: "Spain", region: "Europe", lat: 38.8728, lon: 1.3731, tier: "VIP" },
  { icao: "LEMD", iata: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain", region: "Europe", lat: 40.4719, lon: -3.5626, tier: "VIP" },
  { icao: "LETO", iata: "TOJ", name: "Madrid-Torrejón", city: "Madrid-Torrejón", country: "Spain", region: "Europe", lat: 40.4972, lon: -3.4458, tier: "Standard" },
  { icao: "LEMG", iata: "AGP", name: "Málaga Costa del Sol", city: "Málaga", country: "Spain", region: "Europe", lat: 36.6749, lon: -4.4991, tier: "Standard" },
  { icao: "LERS", iata: "REU", name: "Reus–Catalonia", city: "Reus–Catalonia", country: "Spain", region: "Europe", lat: 41.1474, lon: 1.1672, tier: "Standard" },
  { icao: "LEZL", iata: "SVQ", name: "Seville", city: "Seville", country: "Spain", region: "Europe", lat: 37.4180, lon: -5.8931, tier: "Standard" },

  // ─────────────────────────────────────────────────────────────────────────
  //  Asia Pacific
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "ZBAA", iata: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", region: "Asia Pacific", lat: 40.0801, lon: 116.5846, tier: "VIP" },
  { icao: "RJTT", iata: "HND", name: "Tokyo Haneda", city: "Tokyo Haneda", country: "Japan", region: "Asia Pacific", lat: 35.5494, lon: 139.7798, tier: "VIP" },
  { icao: "RJAA", iata: "NRT", name: "Tokyo Narita", city: "Tokyo Narita", country: "Japan", region: "Asia Pacific", lat: 35.7647, lon: 140.3863, tier: "Standard" },
  { icao: "RJBB", iata: "KIX", name: "Osaka Kansai", city: "Osaka Kansai", country: "Japan", region: "Asia Pacific", lat: 34.4347, lon: 135.2440, tier: "Standard" },
  { icao: "WSSL", iata: "XSP", name: "Seletar Airport", city: "Seletar", country: "Singapore", region: "Asia Pacific", lat: 1.4170, lon: 103.8678, tier: "VIP" },

  // ─────────────────────────────────────────────────────────────────────────
  //  Americas
  // ─────────────────────────────────────────────────────────────────────────
  { icao: "KOPF", iata: "OPF", name: "Miami-Opa Locka Executive", city: "Miami", country: "USA", region: "Americas", lat: 25.9070, lon: -80.2784, tier: "Ultra-VIP" },
  { icao: "MMTO", iata: "TLC", name: "Toluca International", city: "Toluca", country: "Mexico", region: "Americas", lat: 19.3370, lon: -99.5660, tier: "Standard" },
  { icao: "SBGR", iata: "GRU", name: "São Paulo Guarulhos", city: "São Paulo", country: "Brazil", region: "Americas", lat: -23.4356, lon: -46.4731, tier: "VIP" },
  { icao: "SCEL", iata: "SCL", name: "Santiago Arturo Merino Benítez", city: "Santiago", country: "Chile", region: "Americas", lat: -33.3930, lon: -70.7858, tier: "Standard" },
];

export function getStation(icao: string): Station | undefined {
  return STATIONS.find((s) => s.icao.toUpperCase() === icao.toUpperCase());
}

export const REGIONS = [
  "Middle East",
  "Africa",
  "Europe",
  "Asia Pacific",
  "Americas",
] as const;
