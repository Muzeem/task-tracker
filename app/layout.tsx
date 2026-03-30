import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tracker.kelby.in"),
  title: {
    default: "Focus · Tasks & Notes",
    template: "%s · Focus",
  },
  description:
    "Simple task and note tracker with local-first storage for quick daily planning.",
  applicationName: "Focus",
  keywords: [
    "task tracker",
    "notes app",
    "todo",
    "productivity",
    "local storage",
  ],
  authors: [{ name: "Focus" }],
  creator: "Focus",
  publisher: "Focus",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://tracker.kelby.in",
    siteName: "Focus",
    title: "Focus · Tasks & Notes",
    description:
      "Simple task and note tracker with local-first storage for quick daily planning.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Focus · Tasks & Notes",
    description:
      "Simple task and note tracker with local-first storage for quick daily planning.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
