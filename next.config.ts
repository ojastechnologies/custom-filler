/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'customfiller.com',
      'vrfpayooyasvetbxkjam.supabase.co', // Add your Supabase project domain here
    ],
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
