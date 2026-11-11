import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Literata } from "next/font/google";
import type { ReactElement, ReactNode } from "react";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-bricolage-grotesque",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SageTable",
  description: "Pull up a chair. Bring a real question to history's sharp minds.",
};

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Root HTML shell loading design fonts and global theme tokens.
 */
export default function RootLayout({ children }: Readonly<RootLayoutProps>): ReactElement {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${figtree.variable} ${literata.variable}`}
    >
      <body className="antialiased bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
