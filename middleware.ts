import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for token in cookies (for production) or allow all access in development
  const accessToken = request.cookies.get("accessToken")?.value;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/"];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // In development, we'll bypass authentication checks if needed
  if (isDevelopment && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  // If it's not a public route and there's no access token, redirect to login
  if (!isPublicRoute && !accessToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // If it's the login route and there's an access token, redirect to dashboard
  if (pathname === "/login" && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}; 