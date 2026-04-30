import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "RecallFlow",
  description: "家庭学习复习系统"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
