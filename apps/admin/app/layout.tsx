import type { Metadata } from "next";
import { AppProvider } from "./contexts/AppContext";
import "./styles.css";

export const metadata: Metadata = {
  title: "RecallFlow Admin",
  description: "RecallFlow 家长后台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
