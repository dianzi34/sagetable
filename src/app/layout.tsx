import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SageTable | Historical Roundtable',
  description: 'Brings historical figures to answer real questions grounded in their writings and explained in plain English.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
