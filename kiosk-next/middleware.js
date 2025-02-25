import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const publicRoutes = [
  "/login",
  "/setup",
  "/api/auth/login",
  "/api/auth/verify", 
]

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get("session_token")?.value
  const machineId = request.cookies.get("machine_id")?.value

  if (!sessionToken || !machineId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(sessionToken, secret)

    if (Date.now() >= payload.exp * 1000) {
      throw new Error("Token expired")
    }

    if (payload.machineId !== machineId) {
      throw new Error("Machine ID mismatch")
    }

    const response = NextResponse.next()

    response.headers.set("X-Machine-ID", machineId)

    return response
  } catch (error) {
    console.error("Authentication error:", error)

    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("session_token")
    response.cookies.delete("machine_id")

    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}

