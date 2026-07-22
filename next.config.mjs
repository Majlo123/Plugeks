/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Dozvoli udaljene placeholder slike. ZAMENI/ukloni domene kad ubaciš
    // prave fotografije u /public/images.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
