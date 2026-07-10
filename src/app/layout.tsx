import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { KeyboardAssistant } from "@/components/assistant/KeyboardAssistant";
import { AvailabilityProvider } from "@/components/providers/AvailabilityProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KeySol — Find the World's Best Keyboards",
  description:
    "Discover top keyboard brands including Wooting, Razer, Corsair, and more. Your unbiased guide to gaming, productivity, and enthusiast keyboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <AvailabilityProvider>
          {children}
          <KeyboardAssistant />
        </AvailabilityProvider>
      </body>
    </html>
  );
}
