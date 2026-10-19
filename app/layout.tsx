import type { Metadata, Viewport } from 'next';
import { Raleway } from "next/font/google";

import './globals.css';

const raleway = Raleway({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: 'AFEXHub Financial Aid Information',
  description: 'Worksheet for gathering the information needed for the CSS Profile and college financial aid documents.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}