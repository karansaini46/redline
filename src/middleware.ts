import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis & Ratelimit (requires REST URL for Edge runtime)
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;

const redis =
  redisUrl && redisToken && redisUrl.startsWith("https")
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
      analytics: true,
    })
  : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting for specific routes
  const rateLimitRoutes = [
    /^\/api\/auth(\/.*)?$/,
    /^\/api\/password-reset(\/.*)?$/,
    /^\/api\/export(\/.*)?$/,
    /^\/api\/webhooks(\/.*)?$/,
  ];

  const requiresRateLimit = rateLimitRoutes.some((route) =>
    route.test(pathname),
  );

  if (requiresRateLimit) {
    if (ratelimit) {
      const ip =
        request.headers.get("x-forwarded-for") ?? request.ip ?? "127.0.0.1";
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      if (!success) {
        const response = new NextResponse("Too Many Requests", { status: 429 });
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());
        response.headers.set(
          "Retry-After",
          Math.ceil((reset - Date.now()) / 1000).toString(),
        );
        return response;
      }
    } else {
      console.warn(
        "Rate limiting is enabled for this route but Upstash Redis REST credentials are not configured.",
      );
    }
  }

  // 2. CSRF Protection for state-changing API routes
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Simple CSRF check: Ensure Origin matches Host
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse("Forbidden: CSRF", { status: 403 });
        }
      } catch {
        return new NextResponse("Forbidden: Invalid Origin", { status: 403 });
      }
    } else if (!origin && process.env.NODE_ENV === "production") {
      // In production, require origin for browser requests, though server-to-server
      // might not have it. Usually browsers always send origin for POST.
      // We will let it pass if no origin, assuming it's a programmatic API call.
    }
  }

  const response = NextResponse.next();

  // 3. Security Headers
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
