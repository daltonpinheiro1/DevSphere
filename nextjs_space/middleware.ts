import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/chat", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin") || path.startsWith("/chat") || path.startsWith("/settings") || path.startsWith("/profile")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/chat/:path*", "/settings/:path*", "/profile/:path*", "/whatsapp-admin/:path*"],
};
