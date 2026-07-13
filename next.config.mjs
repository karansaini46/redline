/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "argon2"],
  },
  webpack: (config, { dev }) => {
    // Fix for react-pdf Object.defineProperty called on non-object error
    if (dev) {
      config.devtool = 'source-map';
    }
    // Required for react-pdf server-side
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Fix for Terser failing to parse the minified pdf.worker file in production builds
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?(js|mjs)$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
