/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com','customfiller.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
    ignoreDevelopment: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
