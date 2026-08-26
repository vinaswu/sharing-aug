import type { Metadata } from "next";
import "animate.css/animate.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "金字塔原理 · 第三章",
  description: "如何搭起一座金字塔 - 即時互動簡報",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
