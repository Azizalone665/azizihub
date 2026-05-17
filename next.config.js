/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',   // hero slider images
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',        // product images from Supabase storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // (optional) Google profile pictures
      },
      {
        protocol: 'http',
        hostname: 'localhost',              // local development
      },
    ],
    // Allow unoptimized images in development (faster)
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig