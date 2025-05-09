import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { MenuProvider } from '@/context/MenuContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import WhatsAppChat from '@/components/WhatsAppChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Custom Filler - Aerosol Filling Services',
  description: 'Custom aerosol filling services for various industries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const whatsappNumber = "+9779843650962"; 
  
  return (
    <html lang="en" suppressHydrationWarning>
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
