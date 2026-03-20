import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://signeo.app"),
  title: "Signeo",
  description: "Simple, secure document signing",
  openGraph: {
    title: "Signeo",
    description: "Simple, secure document signing",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Signeo",
    description: "Simple, secure document signing",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
