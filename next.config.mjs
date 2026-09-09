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
  async redirects() {
    return [
      // Prikolice su iz opšteg kataloga preseljene na `/prikolice` (izbor po
      // slici umesto fasete). Stari linkovi — iz Google-a, zapamćeni, deljeni —
      // vode na istu ponudu: ako nose program, pravo u njega.
      {
        source: "/proizvodi",
        has: [
          { type: "query", key: "vrsta", value: "prikolice" },
          { type: "query", key: "program", value: "(?<program>[a-z0-9-]+)" },
        ],
        destination: "/prikolice/:program",
        permanent: true,
      },
      {
        source: "/proizvodi",
        has: [{ type: "query", key: "vrsta", value: "prikolice" }],
        destination: "/prikolice",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Next po podrazumevanom serviranju `public/` šalje `max-age=0`, pa se
        // svaka slika dohvata iznova. Google Images sporo servirane slike ređe
        // indeksira, a i posetiocu se katalog otvara sporije.
        //
        // Namerno BEZ `immutable` i bez godine dana: ime fajla je kataloski broj
        // i ostaje isto kad se žigosana fotografija zameni sopstvenom (vidi
        // README, `npm run slike`). Uz `immutable` bi stari posetioci još godinu
        // dana gledali staru sliku. Dan svežine + nedelja u pozadini je dovoljno.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
