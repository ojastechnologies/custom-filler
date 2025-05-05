import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
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
          <MenuProvider>
            {children}
          </MenuProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
