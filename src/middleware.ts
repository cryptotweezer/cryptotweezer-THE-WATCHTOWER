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
    "/api/global-intel"
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

    // KALI CID DETECTION: Intercept requests with a CID + attack payload.
    // Rewrites to /api/sentinel/external with classified headers.
    // Must run BEFORE ghost route detection — CID requests are tool probes, not humans navigating.
    if (!isStaticOrInternal(path) && !isApiRoute(path)) {
        const cid = extractCID(req);
        if (cid) {
            const attack = classifyAttack(req);
            if (attack) {
                const url = req.nextUrl.clone();
                url.pathname = "/api/sentinel/external";
                const response = NextResponse.rewrite(url);
                response.headers.set("x-sentinel-cid", cid);
                response.headers.set("x-sentinel-technique", attack.technique);
                response.headers.set("x-sentinel-payload", attack.payload.substring(0, 500));
                response.headers.set("x-sentinel-confidence", attack.confidence.toString());
                return applyIdentityLayer(req, response);
            }
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
