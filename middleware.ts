import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (!claims && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    response.headers.forEach((value, name) => {
      if (["cache-control", "expires", "pragma"].includes(name.toLowerCase())) redirect.headers.set(name, value);
    });
    return redirect;
  }

  if (claims && pathname === "/login") {
    const destination = request.nextUrl.searchParams.get("next");
    const safeDestination = destination?.startsWith("/") && !destination.startsWith("//") ? destination : "/workspace";
    const redirect = NextResponse.redirect(new URL(safeDestination, request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }

  if (claims && pathname === "/") {
    const redirect = NextResponse.redirect(new URL("/workspace", request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    response.headers.forEach((value, name) => {
      if (["cache-control", "expires", "pragma"].includes(name.toLowerCase())) redirect.headers.set(name, value);
    });
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
