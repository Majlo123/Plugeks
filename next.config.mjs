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
  async headers() {
    return [
      {
        // Rolland fotografije nose njihov žig, pa ostaju vidljive na sajtu ali
        // se ne indeksiraju u Google Images. Header, a ne robots.txt Disallow:
        // zabrana obilaska bi sprečila Google da uopšte pročita ovo pravilo.
        //
        // Radi samo zato što ProductThumb slike servira `unoptimized`, dakle sa
        // sirovog puta. Ako se `unoptimized` ikad ukloni, slike odlaze na
        // /_next/image i ovaj source ih više ne pokriva.
        source: "/images/rolland/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
