import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statsbudsjettet",
  description:
    "Statsbudsjettet presenterer regjeringens forslag til statsbudsjett for allmennheten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
