import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "K·I ~ EXTENSION OF THE MIND",
  description: "toolkit of Self designed to augment the journey of becoming",
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
