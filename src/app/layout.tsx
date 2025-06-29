import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { MenuProvider } from "@/context/MenuContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.customfiller.com'

export const metadata: Metadata = {
  title: 'Custom Filler',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  description: 'Professional custom filling services including 1-inch filling, 20mm filling, non-flammable propellant, and laser cryogen solutions.',
  keywords: ['custom filling', 'aerosol filling', '1 inch filling', '20mm filling', 'non-flammable propellant', 'laser cryogen'],
  authors: [{ name: 'Custom Filler' }],
  creator: 'Custom Filler',
  publisher: 'Custom Filler',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'Custom Filler - Professional Filling Services',
    description: 'Professional custom filling services including 1-inch filling, 20mm filling, non-flammable propellant, and laser cryogen solutions.',
    siteName: 'Custom Filler',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Filler - Professional Filling Services',
    description: 'Professional custom filling services including 1-inch filling, 20mm filling, non-flammable propellant, and laser cryogen solutions.',
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={baseUrl} />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider>
          <MenuProvider>
            <AuthProvider>
              <CartProvider>{children}</CartProvider>
            </AuthProvider>
          </MenuProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
