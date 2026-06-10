import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "HelpNet - Community Help Platform",
  description:
    "Connect with skilled neighbors who want to help. Free, fast, human-powered help board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans bg-surface text-gray-900 antialiased",
        dmSans.variable,
        dmSerifDisplay.variable,
      )}
    >
      <body className="min-h-screen bg-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
