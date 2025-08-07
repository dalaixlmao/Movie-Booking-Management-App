import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/provider";
// import Appbar from '@repo/ui/appbar'
import { Open_Sans } from "next/font/google";
import { Poppins } from "next/font/google";
import { RecoilRoot } from "recoil";
import dynamic from "next/dynamic";

// Import CookieConsentBanner with client-side only rendering
const CookieConsentBanner = dynamic(
  () => import("/tmp/repo/components/CookieConsentBanner"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });
const open_sans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Movie Booking App",
  description: "Book movie tickets online for the latest movies near you. Select seats, make secure payments, and enjoy your favorite movies at local cinemas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="privacy-policy" href="/docs.codexhub.ai/privacy-policy.md" />
        <link rel="terms-of-service" href="/docs.codexhub.ai/terms-of-service.md" />
      </head>
      <Providers>
        <body className={`${open_sans.className}`}>
          <div className="h-screen z-1 bg-black overflow-y-auto">
            {children}
            <footer className="mt-auto py-4 text-white/60 text-sm text-center border-t border-white/10">
              <div className="container mx-auto">
                <div className="mb-2">
                  © 2025 Movie Booking App. All rights reserved.
                </div>
                <nav aria-label="Legal">
                  <ul className="flex justify-center space-x-4">
                    <li>
                      <a href="/docs.codexhub.ai/privacy-policy.md" className="hover:text-white transition-colors">Privacy Policy</a>
                    </li>
                    <li>
                      <a href="/docs.codexhub.ai/terms-of-service.md" className="hover:text-white transition-colors">Terms of Service</a>
                    </li>
                    <li>
                      <a href="/docs.codexhub.ai/cookie-policy.md" className="hover:text-white transition-colors">Cookie Policy</a>
                    </li>
                  </ul>
                </nav>
              </div>
            </footer>
            <CookieConsentBanner />
          </div>
        </body>
      </Providers>
    </html>
  );
}
