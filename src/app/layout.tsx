import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novel AI イラスト生成ツール",
  description:
    "Novel AI を利用して、複数キャラクターのイラストを同じ品質・構図で生成するためのツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
