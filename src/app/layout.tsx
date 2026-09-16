import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "THE WATCHTOWER | Active Defense Node",
    template: "%s | THE WATCHTOWER",
  },
  description: "A live threat-hunting infrastructure and active defense honeypot system. Monitor real-time cyber threats, analyze attack vectors, and engage with advanced security countermeasures.",
  keywords: ["Cybersecurity", "SOC", "Threat Hunting", "Honeypot", "Active Defense", "Blue Team", "SecOps", "Network Security", "Andres Henao", "The Watchtower"],
  authors: [{ name: "Andres Henao", url: "https://www.cv.andreshenao.com.au" }],
  creator: "Andres Henao",
  publisher: "Andres Henao",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/logo_black.png",
    shortcut: "/logo_black.png",
    apple: "/logo_black.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "THE WATCHTOWER | Active Defense Node",
    description: "Real-time threat monitoring and active defense infrastructure.",
    siteName: "THE WATCHTOWER",
    images: [
      {
        // 1200x630 shot of the access gate. Scrapers cache by URL, so a new
        // card needs a new filename here, not a replaced file.
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "The Watchtower access gate: perimeter monitoring active",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE WATCHTOWER | Active Defense Node",
    description: "Real-time threat monitoring and active defense infrastructure.",
    images: ["/og-cover.png"],
    creator: "@andreshenao", // Placeholder or actual handle if known
  },
  metadataBase: new URL("https://sentinel.andreshenao.com.au"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ClientProviders>
            {children}
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
