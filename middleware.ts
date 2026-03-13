import { NextResponse } from "next/server";

export function middleware() {
    return NextResponse.next();
}

export const config = {
    matcher: ["/lessons/:path*", "/chat/:path*", "/home/:path*"],
};
