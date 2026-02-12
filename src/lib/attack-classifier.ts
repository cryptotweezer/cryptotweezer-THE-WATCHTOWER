// Edge-compatible attack classifier for Kali CID external integration.
// Pure functions — no DB, no side effects, regex only.

export const CID_REGEX = /^CID-\d{3}-[A-Z0-9]$/;

export interface AttackClassification {
    technique: string;
    payload: string;
    confidence: number;
}

/**
 * Extract CID from 7 possible delivery sources.
 * Returns validated CID string or null.
 */
export function extractCID(req: Request): string | null {
    const url = new URL(req.url);

    // 1. X-CID header (primary method)
    const xCid = req.headers.get("x-cid");
    if (xCid && CID_REGEX.test(xCid)) return xCid;

    // 2. X-Sentinel-CID header (internal rewrite)
    const sentinelCid = req.headers.get("x-sentinel-cid");
    if (sentinelCid && CID_REGEX.test(sentinelCid)) return sentinelCid;

    // 3. ?cid= query parameter
    const queryCid = url.searchParams.get("cid");
    if (queryCid && CID_REGEX.test(queryCid)) return queryCid;

    // 4. Authorization: CID <value>
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
        const match = authHeader.match(/^CID\s+(.+)$/i);
        if (match && CID_REGEX.test(match[1])) return match[1];
    }

    // 5. Cookie: watchtower_cid=<value>
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
        const match = cookieHeader.match(/watchtower_cid=([^;]+)/);
        if (match && CID_REGEX.test(match[1])) return match[1];
    }

    // 6. Referer header (e.g., curl -H "Referer: CID-442-X")
    const referer = req.headers.get("referer");
    if (referer) {
        const match = referer.match(/(CID-\d{3}-[A-Z0-9])/);
        if (match && CID_REGEX.test(match[1])) return match[1];
    }

    // 7. User-Agent (sneaky — e.g., curl -A "CID-442-X nikto/2.5")
    const ua = req.headers.get("user-agent");
    if (ua) {
        const match = ua.match(/(CID-\d{3}-[A-Z0-9])/);
        if (match && CID_REGEX.test(match[1])) return match[1];
    }

    return null;
}

// Attack detection patterns — regex only (Edge-compatible)
const ATTACK_PATTERNS: { technique: string; patterns: RegExp[]; confidence: number }[] = [
    {
        technique: "EXT_SQLI",
        patterns: [
            /('|"|;)\s*(OR|AND|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\s/i,
            /\b(UNION\s+SELECT|ORDER\s+BY\s+\d|GROUP\s+BY\s+\d)/i,
            /('|")\s*(--|#|\/\*)/,
            /\bSLEEP\s*\(\d/i,
            /\bBENCHMARK\s*\(/i,
            /1\s*=\s*1/,
            /'\s*OR\s*'.*'\s*=\s*'/i,
        ],
        confidence: 0.85,
    },
    {
        technique: "EXT_XSS",
        patterns: [
            /<script[\s>]/i,
            /javascript\s*:/i,
            /on(error|load|click|mouseover|focus)\s*=/i,
            /<img[^>]+onerror/i,
            /<svg[^>]+onload/i,
            /\balert\s*\(/i,
            /\bdocument\.(cookie|location|write)/i,
        ],
        confidence: 0.80,
    },
    {
        technique: "EXT_PATH_TRAVERSAL",
        patterns: [
            /\.\.\//,
            /\.\.%2[fF]/,
            /\/etc\/(passwd|shadow|hosts)/i,
            /\/proc\/self/i,
            /\/windows\/system32/i,
        ],
        confidence: 0.90,
    },
    {
        technique: "EXT_CMD_INJECTION",
        patterns: [
            /[;|`]\s*(ls|cat|id|whoami|uname|pwd|curl|wget|nc)\b/i,
            /\$\(.*\)/,
            /\beval\s*\(/i,
            /\bexec\s*\(/i,
            /\bsystem\s*\(/i,
        ],
        confidence: 0.85,
    },
    {
        technique: "EXT_SSRF",
        patterns: [
            /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d|172\.(1[6-9]|2\d|3[01])|192\.168)/i,
            /https?:\/\/169\.254\.169\.254/i,
            /https?:\/\/metadata\./i,
        ],
        confidence: 0.80,
    },
    {
        technique: "EXT_LFI",
        patterns: [
            /\binclude\s*\(/i,
            /\brequire\s*\(/i,
            /php:\/\/(filter|input|data)/i,
            /file:\/\//i,
            /data:text\/html/i,
        ],
        confidence: 0.75,
    },
    {
        technique: "EXT_HEADER_INJECTION",
        patterns: [
            /%0[dDaA]/,
            /\r\n/,
            /\\r\\n/,
            /Content-Type\s*:/i,
            /Set-Cookie\s*:/i,
        ],
        confidence: 0.70,
    },
    {
        technique: "EXT_SCANNER",
        patterns: [
            /\b(nikto|sqlmap|nmap|burp|dirbuster|gobuster|wfuzz|masscan|nuclei|ffuf)\b/i,
        ],
        confidence: 0.65,
    },
];

/**
 * Classify attack from request URL, query params, headers, and common payload locations.
 * Returns the highest-confidence match or EXT_GENERIC_PROBE fallback if CID is present.
 */
export function classifyAttack(req: Request): AttackClassification | null {
    const url = new URL(req.url);

    // Collect all scannable surfaces
    const surfaces: string[] = [
        url.pathname,
        url.search,
        ...Array.from(url.searchParams.values()),
    ];

    // Also scan select headers that tools commonly use for payloads
    const payloadHeaders = ["x-payload", "x-sentinel-payload", "x-attack", "user-agent"];
    for (const name of payloadHeaders) {
        const val = req.headers.get(name);
        if (val) surfaces.push(val);
    }

    const fullText = surfaces.join(" ");

    // Check each pattern set
    let bestMatch: AttackClassification | null = null;

    for (const category of ATTACK_PATTERNS) {
        for (const pattern of category.patterns) {
            const match = fullText.match(pattern);
            if (match) {
                if (!bestMatch || category.confidence > bestMatch.confidence) {
                    bestMatch = {
                        technique: category.technique,
                        payload: match[0].substring(0, 500),
                        confidence: category.confidence,
                    };
                }
                break; // One match per category is enough
            }
        }
    }

    // Fallback: if CID was provided but no specific attack matched,
    // the caller should decide whether to use EXT_GENERIC_PROBE.
    // We return null here to let middleware decide.
    return bestMatch;
}
