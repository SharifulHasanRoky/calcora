import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CALCORA — Every Calculation. One Beautiful Experience.",
    template: "%s · CALCORA",
  },
  description:
    "CALCORA is a premium all-in-one calculator platform: basic, scientific, financial, tax, health, business, marketing, unit converters, date & time — fast, accurate, private. No registration required.",
  keywords: [
    "calculator", "scientific calculator", "percentage calculator", "BMI calculator",
    "income tax calculator", "loan calculator", "compound interest", "unit converter",
    "CALCORA", "online calculator", "free calculator", "financial calculator",
  ],
  authors: [{ name: "CALCORA" }],
  applicationName: "CALCORA",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "CALCORA — Every Calculation. One Beautiful Experience.",
    description: "From everyday math to taxes, health, finance and advanced scientific calculations. Get accurate answers instantly.",
    siteName: "CALCORA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CALCORA",
    description: "Every Calculation. One Beautiful Experience.",
  },
  category: "productivity",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
