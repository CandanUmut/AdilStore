import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AdilStore · Privacy-First App Store",
    template: "%s · AdilStore",
  },
  description:
    "A fair, ad-free app store where ranking is purely merit-based. No promoted placements, no ads, no pay-to-win. Ever.",
  keywords: ["app store", "privacy", "ad-free", "fair ranking", "open source apps"],
  authors: [{ name: "Umut Candan", url: "https://github.com/CandanUmut" }],
  creator: "Umut Candan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "AdilStore",
    title: "AdilStore · Privacy-First App Store",
    description: "A fair, ad-free app store. No promoted placements, no ads, no pay-to-win.",
    images: [
      {
        url: "/adilstore-icon.png",
        width: 512,
        height: 512,
        alt: "AdilStore logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AdilStore · Privacy-First App Store",
    description: "A fair, ad-free app store. No promoted placements, no ads, no pay-to-win.",
    images: ["/adilstore-icon.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/adilstore-icon.png",
    apple: "/adilstore-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-page-gradient min-h-screen text-[var(--text)] antialiased">
        <div
          className="fixed inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.08) 0, transparent 40%), " +
              "radial-gradient(circle at 80% 20%, rgba(94,234,212,0.08) 0, transparent 35%), " +
              "radial-gradient(circle at 20% 80%, rgba(59,130,246,0.08) 0, transparent 35%)",
            filter: "blur(90px)",
            zIndex: 0,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
        {/* Theme initializer — avoids flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('adilstore-theme');
                  if (t === 'light' || t === 'dark') {
                    document.documentElement.setAttribute('data-theme', t);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
