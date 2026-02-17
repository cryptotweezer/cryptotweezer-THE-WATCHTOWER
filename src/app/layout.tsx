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
  authors: [{ name: "Andres Henao", url: "https://www.andreshenao.com.au" }],
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
    url: "https://www.andreshenao.com.au",
    title: "THE WATCHTOWER | Active Defense Node",
    description: "Real-time threat monitoring and active defense infrastructure.",
    siteName: "THE WATCHTOWER",
    images: [
      {
        url: "/logo_black.png", // Ideally a larger OG image, using logo for now
        width: 1200,
        height: 630,
        alt: "The Watchtower System Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE WATCHTOWER | Active Defense Node",
    description: "Real-time threat monitoring and active defense infrastructure.",
    images: ["/logo_black.png"],
    creator: "@andreshenao", // Placeholder or actual handle if known
  },
  metadataBase: new URL("https://www.andreshenao.com.au"),
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
