/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      child_process: false,
      net: false,
      dns: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
