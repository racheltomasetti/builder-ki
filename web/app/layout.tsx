import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Ki",
  description: "AI toolkit for Self: explore, create & connect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-perpetua antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
