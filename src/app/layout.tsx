import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./animations.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vórtex+ — Gerenciador de Lançamentos",
  description:
    "Plataforma de captação de leads com rotação automática de grupos WhatsApp.",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Vórtex+ — Gerenciador de Lançamentos",
    description:
      "Plataforma de captação de leads com rotação automática de grupos WhatsApp.",
    images: [
      {
        url: "https://vortexpages.online/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Vórtex+",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Vortex+" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Vórtex+",
              url: "https://vortexpages.online",
              logo: "https://vortexpages.online/web-app-manifest-512x512.png",
              description:
                "Plataforma de captação de leads com rotação automática de grupos WhatsApp.",
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
