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
    return config;
  },
};

export default nextConfig;
