import "@livekit/components-styles";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { PWARegister } from "@/components/PWARegister";
import { ParallaxBackground } from "@/components/ParallaxBackground";

export const metadata: Metadata = {
  title: "Watch Together",
  description: "Hang out, watch movies, share screens, in sync.",
  appleWebApp: { capable: true, title: "Watch Together", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ParallaxBackground />
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
