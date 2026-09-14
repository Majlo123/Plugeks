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

      // Rolland mašine (plavi program za obradu zemljišta) su skinute sa sajta
      // odlukom vlasnika. Njihove adrese su bile indeksirane, pa svaka vodi na
      // stranu tipa u kome danas stoji zelena (Hofman) mašina istog posla —
      // tanjirače na tanjirače, valjci na valjke, agregati i podrivači na
      // grubere i setvospremače.
      ...[
        ["podrivac-deeper-gbm-michel-4706", "obrada-zemljista"],
        ["podrivac-deeper-gbk-kret-4705", "obrada-zemljista"],
        ["laki-bezoranicni-agregat-grander-abl-4704", "obrada-zemljista"],
        ["bezoranicni-agregat-grander-ab-4703", "obrada-zemljista"],
        ["polunoseni-tanjirasti-agregat-atp-4692", "obrada-zemljista"],
        ["polunosena-tanjiraca-btp-4577", "tanjirace"],
        ["hidraulicna-polunosena-tanjiraca-bh-pb-4576", "tanjirace"],
        ["hidraulicna-polunosena-tanjiraca-bh-pa-4575", "tanjirace"],
        ["valjci-za-obradu-zemljista-4397", "valjci"],
        ["tanjiraca-field-bt-4396", "tanjirace"],
        ["tanjirasti-agregat-field-at-4395", "obrada-zemljista"],
        ["hidraulicna-tanjiraca-field-hawk-bh-4394", "tanjirace"],
      ].map(([slug, tip]) => ({
        source: `/proizvod/${slug}`,
        destination: `/masine/${tip}`,
        permanent: true,
      })),
      { source: "/masine/agregati", destination: "/masine/obrada-zemljista", permanent: true },
      { source: "/masine/podrivaci", destination: "/masine/obrada-zemljista", permanent: true },

      // Tip „Predplužna daska" je spojen sa „Daska predplužnjaka" (isti deo pod
      // dva imena iz izvornog kataloga).
      { source: "/delovi/predpluzna-daska", destination: "/delovi/daska-predpluznjaka", permanent: true },
      {
        source: "/delovi/predpluzna-daska/:brend",
        destination: "/delovi/daska-predpluznjaka/:brend",
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
