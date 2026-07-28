import "./globals.css";

const siteUrl = "https://www.prepa-fpc.fr";
const siteName = "Prépa FPC";
const description = "Préparez le concours FPC infirmier (passerelle IFSI) avec des QCM de maths, calculs de doses, simulations d'oral et cours de culture sanitaire et sociale. La plateforme de référence pour les aides-soignants et auxiliaires de puériculture.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Prépa FPC — Préparation au concours infirmier passerelle IFSI",
    template: "%s | Prépa FPC",
  },
  description,
  keywords: [
    "concours FPC infirmier",
    "passerelle IFSI",
    "préparation concours infirmier",
    "concours aide-soignant infirmier",
    "concours auxiliaire puériculture infirmier",
    "QCM concours infirmier",
    "calculs de doses IFSI",
    "oral concours FPC",
    "formation professionnelle continue infirmier",
    "reconversion infirmier",
    "annales concours FPC",
    "exercices maths concours infirmier",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName,
    title: "Prépa FPC — Préparation au concours infirmier passerelle IFSI",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prépa FPC - Préparation concours infirmier FPC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prépa FPC — Préparation au concours infirmier passerelle IFSI",
    description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.png",
  },
};

import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Prépa FPC",
          "alternateName": "Prépa FPC - La passerelle IFSI",
          "url": "https://www.prepa-fpc.fr",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.prepa-fpc.fr/blog?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "LP Labs",
          "legalName": "LP Labs SAS",
          "url": "https://www.prepa-fpc.fr",
          "logo": "https://www.prepa-fpc.fr/favicon.svg",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "support@prepa-fpc.fr",
            "contactType": "customer service",
            "availableLanguage": "French"
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "20 route de la Rousserie",
            "addressLocality": "Monthuchon",
            "postalCode": "50200",
            "addressCountry": "FR"
          },
          "sameAs": []
        })}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Prépa FPC",
          "description": "Plateforme de préparation au concours FPC d'entrée en IFSI",
          "url": "https://www.prepa-fpc.fr",
          "offers": [
            {
              "@type": "Offer",
              "name": "Abonnement mensuel",
              "price": "12.99",
              "priceCurrency": "EUR",
              "url": "https://www.prepa-fpc.fr/tarifs"
            },
            {
              "@type": "Offer",
              "name": "Pack annuel",
              "price": "89.99",
              "priceCurrency": "EUR",
              "url": "https://www.prepa-fpc.fr/tarifs"
            }
          ]
        })}} />
        {/* Console analytics maison (data centralisée multi-sites) */}
        <Script src="https://analytics-hub-gamma.vercel.app/tracker.js" data-site="prj_TB7RoDx1hEwM9VmDg9LJ829eEEMf" strategy="afterInteractive" />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-W24Z96D93P" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-W24Z96D93P');
        `}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
