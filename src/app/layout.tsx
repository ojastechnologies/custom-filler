import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { MenuProvider } from "@/context/MenuContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";
import Script from 'next/script';

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
  const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  return (
    <html lang="en">
      <head>
        {/* ...existing code... */}
        {(googleTagId || googleAnalyticsId) && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId || googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${googleTagId ? `gtag('config', '${googleTagId}');` : ''}
                ${googleAnalyticsId ? `gtag('config', '${googleAnalyticsId}');` : ''}
              `}
            </Script>
          </>
        )}
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
