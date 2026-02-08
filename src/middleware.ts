import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    "/api/security/log"
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

// Shared Arcjet + Identity logic applied to any response
async function applySecurityLayer(req: NextRequest, response: NextResponse) {
    const ajKey = process.env.ARCJET_KEY;
    if (!ajKey || ajKey === "aj_mock_key" || ajKey.length < 10) return response;

    const aj = arcjet({
        key: ajKey,
        rules: [
            shield({ mode: "LIVE" }),
            detectBot({ mode: "LIVE", allow: [] }),
            slidingWindow({ mode: "LIVE", interval: "1m", max: 60 }),
        ],
    });

    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        console.warn("THREAT DETECTED (NON-BLOCKING):", decision.reason);
        response.headers.set("x-arcjet-threat-detected", "true");
        if (decision.reason.isBot()) {
            response.headers.set("x-arcjet-threat-type", "BOT_ARMY");
        } else if (decision.reason.isRateLimit()) {
            response.headers.set("x-arcjet-threat-type", "DDoS_ATTEMPT");
        } else if (decision.reason.isShield()) {
            response.headers.set("x-arcjet-threat-type", "INJECTION_ATTACK");
        } else {
            response.headers.set("x-arcjet-threat-type", "ANOMALY");
        }
    }

    // FINGERPRINT / IDENTITY PERSISTENCE
    // 1. Arcjet Fingerprint (Priority if available)
    const fingerprint = (decision as { fingerprint?: string }).fingerprint;
    if (fingerprint) {
        response.headers.set("x-arcjet-fingerprint", fingerprint);
    }

    // 2. Persistent Cookie (Fallback/Stable ID)
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

    return response;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const path = req.nextUrl.pathname;

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
        return applySecurityLayer(req, response);
    }

    // Si la ruta no es pública, entonces está protegida.
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    const baseResponse = NextResponse.next();
    return applySecurityLayer(req, baseResponse);
});
