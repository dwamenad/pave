/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "places.googleapis.com"
      }
    ]
  }
};

export default nextConfig;
