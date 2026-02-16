"use client";

import { memo, useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Graticule,
} from "react-simple-maps";

// GeoJSON source
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Watchtower cyan accent
const CYAN = "#00f2ff";
const CYAN_RGB = "0, 242, 255";

// Glow tiers — intensity based on attack volume ratio
const GLOW_TIERS = [
    { fillOpacity: 0.2, shadow: `drop-shadow(0 0 6px rgba(${CYAN_RGB}, 0.7))` },
    { fillOpacity: 0.35, shadow: `drop-shadow(0 0 10px rgba(${CYAN_RGB}, 0.8)) drop-shadow(0 0 4px rgba(${CYAN_RGB}, 0.3))` },
    { fillOpacity: 0.5, shadow: `drop-shadow(0 0 16px rgba(${CYAN_RGB}, 0.9)) drop-shadow(0 0 6px rgba(${CYAN_RGB}, 0.5))` },
];

function getGlowTier(count: number, maxAttacks: number): number {
    const ratio = count / maxAttacks;
    if (ratio >= 0.66) return 2;
    if (ratio >= 0.33) return 1;
    return 0;
}

// Normalize location strings to ISO alpha-2 country codes
const TIMEZONE_TO_ALPHA2: Record<string, string> = {
    "australia": "AU", "america": "US", "europe/london": "GB", "europe/paris": "FR",
    "europe/berlin": "DE", "europe/moscow": "RU", "asia/tokyo": "JP", "asia/shanghai": "CN",
    "asia/kolkata": "IN", "asia/seoul": "KR", "asia/singapore": "SG", "pacific/auckland": "NZ",
    "america/toronto": "CA", "america/mexico": "MX", "america/sao_paulo": "BR",
    "america/bogota": "CO", "america/buenos_aires": "AR", "america/lima": "PE",
    "africa/johannesburg": "ZA", "africa/cairo": "EG", "africa/lagos": "NG",
    "asia/dubai": "AE", "asia/riyadh": "SA", "asia/jakarta": "ID", "asia/bangkok": "TH",
    "asia/manila": "PH", "asia/ho_chi_minh": "VN", "europe/amsterdam": "NL",
    "europe/warsaw": "PL", "europe/kiev": "UA", "europe/istanbul": "TR",
    "europe/rome": "IT", "europe/madrid": "ES", "europe/stockholm": "SE",
};

function normalizeCountryCode(raw: string): string | null {
    if (!raw || raw === "LOCAL" || raw === "UNKNOWN") return null;
    if (/^[A-Z]{2}$/.test(raw)) return raw;
    const lower = raw.toLowerCase();
    for (const [prefix, code] of Object.entries(TIMEZONE_TO_ALPHA2)) {
        if (lower.startsWith(prefix)) return code;
    }
    return null;
}

// ISO alpha-2 to ISO 3166-1 NUMERIC (world-atlas GeoJSON feature.id)
const ALPHA2_TO_NUMERIC: Record<string, string> = {
    US: "840", CN: "156", RU: "643", BR: "076", DE: "276",
    GB: "826", FR: "250", AU: "036", IN: "356", JP: "392",
    KR: "410", CA: "124", MX: "484", AR: "032", IT: "380",
    ES: "724", NL: "528", PL: "616", UA: "804", TR: "792",
    ID: "360", TH: "764", VN: "704", PH: "608", NG: "566",
    ZA: "710", EG: "818", SA: "682", IR: "364", PK: "586",
    BD: "050", CO: "170", CL: "152", PE: "604", VE: "862",
    SE: "752", NO: "578", FI: "246", DK: "208", BE: "056",
    CH: "756", AT: "040", PT: "620", GR: "300", CZ: "203",
    RO: "642", HU: "348", IL: "376", AE: "784", SG: "702",
    MY: "458", NZ: "554", IE: "372", KE: "404", GH: "288",
    BO: "068", UY: "858", PY: "600", EC: "218", PA: "591",
    CR: "188", CU: "192", JM: "388", TW: "158", LK: "144",
};

interface WorldAttackMapProps {
    attacksByCountry: { country: string; count: number }[];
    stressColor: string;
    pulsingCountries?: Set<string>;
}

function WorldAttackMap({ attacksByCountry = [], pulsingCountries }: WorldAttackMapProps) {
    const { countryAttackMap, pulsingNumericIds, maxAttacks, activeCount } = useMemo(() => {
        const map: Record<string, number> = {};
        let max = 1;
        attacksByCountry.forEach(({ country, count }) => {
            const alpha2 = normalizeCountryCode(country);
            if (!alpha2) return;
            const numericId = ALPHA2_TO_NUMERIC[alpha2];
            if (!numericId) return;
            const numCount = typeof count === "string" ? parseInt(count, 10) : count;
            map[numericId] = (map[numericId] || 0) + numCount;
            if (map[numericId] > max) max = map[numericId];
        });

        // Build pulsing numeric ID set from raw country codes
        const pulseIds = new Set<string>();
        if (pulsingCountries) {
            pulsingCountries.forEach((raw) => {
                const alpha2 = normalizeCountryCode(raw);
                if (!alpha2) return;
                const numericId = ALPHA2_TO_NUMERIC[alpha2];
                if (numericId) pulseIds.add(numericId);
            });
        }

        return {
            countryAttackMap: map,
            pulsingNumericIds: pulseIds,
            maxAttacks: max,
            activeCount: Object.keys(map).length,
        };
    }, [attacksByCountry, pulsingCountries]);

    return (
        <div
            className="w-full h-full rounded-lg border border-cyan-900/30 overflow-hidden relative flex flex-col"
            style={{ background: "linear-gradient(180deg, rgba(0,242,255,0.03) 0%, rgba(0,0,0,0.95) 100%)" }}
        >
            {/* Header */}
            <div className="p-3 border-b border-cyan-900/30 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-mono text-blue-500 tracking-wider uppercase flex items-center gap-2">
                    <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse bg-blue-500"
                        style={{ boxShadow: `0 0 6px #3b82f6` }}
                    />
                    GLOBAL ATTACK ORIGINS
                </h3>

            </div>

            {/* Map — fills parent height */}
            <div className="relative w-full flex-1 min-h-0">
                <ComposableMap
                    width={900}
                    height={500}
                    projection="geoMercator"
                    projectionConfig={{ scale: 140, center: [0, 25] }}
                    style={{ width: "100%", height: "100%" }}
                >
                    {/* Holographic grid lines */}
                    <Graticule stroke={`rgba(${CYAN_RGB}, 0.06)`} strokeWidth={0.3} />

                    <Geographies geography={GEO_URL}>
                        {({ geographies }: { geographies: { id: string; rsmKey: string;[key: string]: unknown }[] }) =>
                            geographies.map((geo: { id: string; rsmKey: string;[key: string]: unknown }) => {
                                const geoId = geo.id;
                                const attacks = geoId ? countryAttackMap[geoId] : undefined;
                                const isPulsing = geoId ? pulsingNumericIds.has(geoId) : false;

                                if (isPulsing && attacks) {
                                    // PULSING — country has new activity, bright flash
                                    const tier = getGlowTier(attacks, maxAttacks);
                                    const cfg = GLOW_TIERS[tier];
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            style={{
                                                default: {
                                                    fill: `rgba(${CYAN_RGB}, ${cfg.fillOpacity})`,
                                                    stroke: CYAN,
                                                    strokeWidth: 0.8,
                                                    outline: "none",
                                                    filter: cfg.shadow,
                                                    transition: "fill 0.4s ease-in, stroke 0.4s ease-in, filter 0.4s ease-in, stroke-width 0.4s ease-in",
                                                },
                                                hover: {
                                                    fill: `rgba(${CYAN_RGB}, ${Math.min(cfg.fillOpacity + 0.15, 0.65)})`,
                                                    stroke: CYAN,
                                                    strokeWidth: 1,
                                                    outline: "none",
                                                    filter: cfg.shadow,
                                                    cursor: "pointer",
                                                },
                                                pressed: {
                                                    fill: `rgba(${CYAN_RGB}, 0.5)`,
                                                    stroke: CYAN,
                                                    outline: "none",
                                                },
                                            }}
                                        />
                                    );
                                }

                                // INACTIVE / FADING OUT — slow transition back to wireframe
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        style={{
                                            default: {
                                                fill: "transparent",
                                                stroke: "rgba(255, 255, 255, 0.25)",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                filter: "none",
                                                transition: "fill 3s ease-out, stroke 3s ease-out, filter 3s ease-out, stroke-width 3s ease-out",
                                            },
                                            hover: {
                                                fill: "rgba(255, 255, 255, 0.05)",
                                                stroke: "rgba(255, 255, 255, 0.4)",
                                                strokeWidth: 0.6,
                                                outline: "none",
                                            },
                                            pressed: {
                                                fill: "transparent",
                                                outline: "none",
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>

                {/* Vignette — darker edges */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.8) 100%)" }}
                />

                {/* Scanlines */}
                <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
                    style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,242,255,0.5) 2px, rgba(0,242,255,0.5) 3px)",
                    }}
                />

                {/* Legend */}
                <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] text-zinc-500 font-mono z-20">
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: CYAN, boxShadow: `0 0 8px ${CYAN}, 0 0 16px rgba(${CYAN_RGB}, 0.3)` }}
                        />
                        <span className="text-cyan-500/70">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full border border-white/30" />
                        <span>Inactive</span>
                    </div>
                </div>

                {/* Active count */}
                {activeCount > 0 && (
                    <div className="absolute top-3 right-3 text-right z-20">
                        <div className="text-[10px] text-zinc-600 font-mono tracking-wider">ACTIVE ORIGINS</div>
                        <div
                            className="text-2xl font-mono font-bold"
                            style={{ color: CYAN, textShadow: `0 0 10px rgba(${CYAN_RGB}, 0.5)` }}
                        >
                            {activeCount}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(WorldAttackMap);
