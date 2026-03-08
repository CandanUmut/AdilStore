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
  themeColor: "#010b18",
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
        {/* Manifest link with basePath applied manually — Next.js metadata.manifest does not prepend basePath */}
        <link rel="manifest" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.json`} />
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
              "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(56,189,248,0.10) 0, transparent 55%), " +
              "radial-gradient(ellipse 60% 45% at 85% 5%, rgba(129,140,248,0.09) 0, transparent 55%), " +
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(52,211,153,0.06) 0, transparent 55%)",
            filter: "blur(80px)",
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
