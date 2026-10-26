import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain HTML/JS files in out/, uploaded to Bluehost. Sign-ups are saved
  // through the Rafiqi backend, so no server runs here. The redirects and
  // security headers the Next server used to send are in public/.htaccess.
  output: "export",
  // /ar/join/zain/ becomes ar/join/zain/index.html, which Apache serves as is.
  trailingSlash: true,
};

export default nextConfig;
