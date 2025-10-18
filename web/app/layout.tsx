import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "KI - AI-Powered Thought Clarification",
  description:
    "Capture scattered thinking and transform it into prompt-ready clarity",
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
