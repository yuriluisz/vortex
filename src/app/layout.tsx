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
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
