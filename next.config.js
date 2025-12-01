/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 14+
  webpack: (config) => {
    // Ignore webworker-threads module used by natural library
    // This is only needed for parallel classifier training which we don't use
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'webworker-threads': false,
    };
    
    return config;
  },
}

module.exports = nextConfig

