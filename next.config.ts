import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
    ];
    if (process.env.NODE_ENV === "production" && process.env.BETTER_AUTH_URL?.startsWith("https://")) {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
    }
    return [{ source: "/:path*", headers }];
  },
};

export default config;
