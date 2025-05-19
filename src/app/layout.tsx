import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { MenuProvider } from '@/context/MenuContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import WhatsAppChat from '@/components/WhatsAppChat';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Custom Filler',
  description: 'Custom Aerosol Filling Services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <MenuProvider>
            <AuthProvider>
              <CartProvider>
                {children}
                <WhatsAppChat />
              </CartProvider>
            </AuthProvider>
          </MenuProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
