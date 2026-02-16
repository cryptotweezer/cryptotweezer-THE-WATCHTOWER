import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractCID, classifyAttack } from "@/lib/attack-classifier";

// Define las rutas que NO requieren autenticación.
// Todas las demás rutas (incluyendo /war-room) serán protegidas por defecto.
const isPublicRoute = createRouteMatcher([
    "/",
    "/favicon.ico",
    "/cookies",
    "/legal",
    "/privacy",
    "/terms",
    "/api/sentinel",
    "/api/sentinel/external",
    "/api/sentinel/sync",
    "/api/security/log",
    "/api/arcjet",
    "/api/global-intel",
    "/api/__debug/session"
]);

// Ghost Route Detection: Routes that are valid pages (not honeypot targets)
const VALID_PAGES = ["/", "/cookies", "/legal", "/privacy", "/terms", "/war-room"];

const isStaticOrInternal = (path: string) =>
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes(".well-known") ||
    path.includes("favicon") ||
    path.endsWith(".ico");

const isApiRoute = (path: string) => path.startsWith("/api/");

// Real API routes that legitimately receive x-cid headers (e.g., Sentinel chat).
// These must NOT be intercepted by CID detection. Unknown /api/* paths (e.g.,
// /api/status, /api/admin) ARE honeypot targets and SHOULD be intercepted.
const REAL_API_PREFIXES = ["/api/sentinel", "/api/security", "/api/arcjet", "/api/global-intel", "/api/__debug"];
const isRealApiRoute = (path: string) => REAL_API_PREFIXES.some(p => path.startsWith(p));

export const config = {
    matcher: [
        // Omite los archivos internos de Next.js y los archivos estáticos
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Siempre ejecuta para las rutas de la API
        "/(api|trpc)(.*)",
    ],
};

// Lightweight Identity Layer (No Arcjet - moved to /api/arcjet)
function applyIdentityLayer(req: NextRequest, response: NextResponse) {
    // Persistent Cookie (Stable ID for anonymous users)
    let stableId = req.cookies.get("watchtower_node_id")?.value;

    if (!stableId) {
        stableId = "node_dev_" + Math.random().toString(36).substring(2, 10);
        response.cookies.set("watchtower_node_id", stableId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365, // 1 Year
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });
    }

    // Inject into Header for page.tsx to read
    response.headers.set("x-watchtower-node-id", stableId);

    // Extract Country Code from Vercel Geo Headers (production only)
    // In dev, we use "LOCAL" as fallback
    const countryCode = req.headers.get("x-vercel-ip-country")
        || (process.env.NODE_ENV === "development" ? "LOCAL" : "UNKNOWN");
    response.headers.set("x-watchtower-country", countryCode);

    return response;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const path = req.nextUrl.pathname;

    // ROLLING THUNDER REWRITE: /api/__debug/session → /api/sentinel/debug-session
    // Next.js treats folders starting with _ as private (no route generation).
    // We keep the aesthetic URL in the breadcrumb and rewrite here.
    if (path === "/api/__debug/session") {
        const url = req.nextUrl.clone();
        url.pathname = "/api/sentinel/debug-session";
        const response = NextResponse.rewrite(url);
        return applyIdentityLayer(req, response);
    }

    // KALI CID DETECTION: Intercept requests with a CID + attack payload.
    // Rewrites to /api/sentinel/external with classified headers.
    // Must run BEFORE ghost route detection — CID requests are tool probes, not humans navigating.
    // Excludes REAL API routes (they send x-cid legitimately for session tracking).
    // Unknown /api/* paths (e.g., /api/status) are honeypot targets and get intercepted.
    if (!isStaticOrInternal(path) && !isRealApiRoute(path)) {
        const cid = extractCID(req);
        if (cid) {
            const attack = classifyAttack(req);
            // Use classified technique or fall back to EXT_GENERIC_PROBE
            const technique = attack?.technique ?? "EXT_GENERIC_PROBE";
            const payload = attack?.payload ?? path;
            const confidence = attack?.confidence ?? 0.5;

            const url = req.nextUrl.clone();
            url.pathname = "/api/sentinel/external";

            // CRITICAL: Use request headers (not response headers) so the
            // rewritten route receives them. Response headers are sent to the
            // client and NOT forwarded to the destination on Vercel Edge.
            const requestHeaders = new Headers(req.headers);
            requestHeaders.set("x-sentinel-cid", cid);
            requestHeaders.set("x-sentinel-technique", technique);
            requestHeaders.set("x-sentinel-payload", payload.substring(0, 500));
            requestHeaders.set("x-sentinel-confidence", confidence.toString());

            const response = NextResponse.rewrite(url, {
                request: { headers: requestHeaders },
            });
            return applyIdentityLayer(req, response);
        }
    }

    // GHOST ROUTE DETECTION: Rewrite unknown routes to honeypot targets.
    // This MUST run before auth.protect() so unauthenticated visitors
    // probing routes are observed, not redirected to Clerk sign-in.
    const isWarRoomSubRoute = path.startsWith("/war-room/") && path !== "/war-room";
    const isGhostRoute = (!VALID_PAGES.includes(path) &&
        !isStaticOrInternal(path) &&
        !isApiRoute(path)) || isWarRoomSubRoute;

    if (isGhostRoute) {
        const url = req.nextUrl.clone();
        // War-room sub-routes rewrite to /war-room, everything else to /
        url.pathname = isWarRoomSubRoute ? "/war-room" : "/";
        const response = NextResponse.rewrite(url);
        response.headers.set("x-watchtower-ghost-path", path);
        return applyIdentityLayer(req, response);
    }

    // Si la ruta no es pública, entonces está protegida.
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    const baseResponse = NextResponse.next();
    return applyIdentityLayer(req, baseResponse);
});
