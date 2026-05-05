import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/jwt";

const PROTECTED_ROUTES = ["/checkout", "/orders", "/profile", "/wishlist"];
const PUBLIC_AUTH_ROUTES = ["/login", "/verify"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("diaasa_auth")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
    }

    const payload = await verifyToken(token);

    if (!payload || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(payload.role)) {
      return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
    }

    return NextResponse.next();
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const token = request.cookies.get("diaasa_auth")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);

    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("diaasa_auth");
      return response;
    }
  }

  const isAuthPage = PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    const token = request.cookies.get("diaasa_auth")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const redirect = request.nextUrl.searchParams.get("redirect") || "/";
        return NextResponse.redirect(new URL(redirect, request.url));
      }
    }
  }

  const response = NextResponse.next();

  if (
    pathname.startsWith("/api/banners") ||
    pathname.startsWith("/api/products/featured")
  ) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
  }

  if (pathname === "/api/products" || pathname.startsWith("/api/products?")) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
  }

  if (pathname === "/api/reviews") {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );
  }

  if (/^\/product\/[^/]+$/.test(pathname)) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=7200"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};