/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com','customfiller.com'],
  },
  // eslint: {
  //   ignoreDuringBuilds: false,
  //   ignoreDevelopment: false,
  // },
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
};

module.exports = nextConfig;
