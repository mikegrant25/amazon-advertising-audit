import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amazon Advertising Audit Tool",
  description: "Analyze and optimize your Amazon advertising performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
