import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const protectedRoutes = ["/home", "/account", "/defect-history"]; // Define protected routes
const publicApiRoutes = ["/api/auth/login", "/api/auth/verify"];
const authPages = ["/login", "/setup"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("session_token")?.value;
  const machineId = request.cookies.get("machine_id")?.value;
  const hasValidCookies = sessionToken && machineId;

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow non-protected routes even if not authenticated
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from login/setup pages
  if (authPages.some((route) => pathname.startsWith(route))) {
    if (hasValidCookies) {
      try {
        const { payload } = await jwtVerify(sessionToken, secret);

        if (Date.now() < payload.exp * 1000 && payload.machineId === machineId) {
          return NextResponse.redirect(new URL("/home", request.url));
        }
      } catch (error) {
        console.error("Session verification error:", error);
        const response = NextResponse.next();
        response.cookies.delete("session_token");
        response.cookies.delete("machine_id");
        return response;
      }
    }
    return NextResponse.next();
  }

  // If accessing protected routes, require authentication
  if (!hasValidCookies) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionToken, secret);

    if (Date.now() >= payload.exp * 1000) {
      throw new Error("Token expired");
    }

    if (payload.machineId !== machineId) {
      throw new Error("Machine ID mismatch");
    }

    const response = NextResponse.next();
    response.headers.set("X-Machine-ID", machineId);
    return response;
  } catch (error) {
    console.error("Authentication error:", error);

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_token");
    response.cookies.delete("machine_id");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|api/auth/logout|api/auth/session).*)",
  ],
};
