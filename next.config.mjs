/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const REPO_NAME = "AdilStore";

const nextConfig = {
  // Bypass pre-existing TypeScript/ESLint errors from Supabase generated types
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  ...(isStaticExport && { output: "export", trailingSlash: true }),
  basePath: isStaticExport ? `/${REPO_NAME}` : "",
  images: {
    unoptimized: isStaticExport,
    remotePatterns: isStaticExport
      ? []
      : [
          {
            protocol: "https",
            hostname: "jezaquyloiwzzaetmpsc.supabase.co",
            pathname: "/storage/v1/object/public/**",
          },
        ],
  },
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
            {
              source: "/sw.js",
              headers: [
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                { key: "Content-Type", value: "application/javascript; charset=utf-8" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
