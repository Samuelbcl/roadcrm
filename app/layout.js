import "./globals.css";
import Providers from "@/components/Providers";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "RoadCRM",
  description: "Mini CRM de terrain pour commerciaux",
  manifest: "/manifest.json",
  themeColor: "#F5F5F4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RoadCRM",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-stone-100 text-stone-900 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}