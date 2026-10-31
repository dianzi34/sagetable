import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SageTable — Great minds are listening",
  description:
    "SageTable lets users bring a real question to a roundtable of great figures, with answers grounded in their public-domain writings and explained in plain English.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600&family=Literata:ital,opsz,wght@1,7..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
