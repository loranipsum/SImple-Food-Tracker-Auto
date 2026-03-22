import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Food Tracker",
  description: "Personal calorie & nutrition tracker",
  manifest: "/manifest.json",
  themeColor: "#1B4F3A",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Food Tracker" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
