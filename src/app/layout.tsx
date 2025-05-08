import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { MenuProvider } from "@/context/MenuContext";

export const metadata: Metadata = {
  title: "Aero Tech Labs",
  description: "Contract Aerosol Filling and Laser Cryogen Specialists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <CartProvider>
            <MenuProvider>
              {children}
            </MenuProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
