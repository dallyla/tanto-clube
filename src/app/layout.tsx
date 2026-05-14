import type { Metadata, Viewport } from "next";
import { Fraunces, Caveat, Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "opsz"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TANTO Clube",
    template: "%s · TANTO Clube",
  },
  description: "O fã-clube oficial de Diego Martins. Ouça, acumule pontos e ganhe prêmios.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TANTO Clube",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "TANTO Clube",
    title: "TANTO Clube",
    description: "O fã-clube oficial de Diego Martins",
  },
};

export const viewport: Viewport = {
  themeColor: "#c8a45c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fraunces.variable} ${caveat.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          themes={["dark", "light"]}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
