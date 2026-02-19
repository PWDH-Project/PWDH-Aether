import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModalProvider } from "@/components/providers/modal-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PWDH-Aether",
  description: "Die ultimative Gaming-Kommunikationsplattform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <TooltipProvider delayDuration={200}>
          <ModalProvider />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
