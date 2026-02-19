import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Statsbudsjettet",
    template: "%s | Statsbudsjettet",
  },
  description:
    "Statsbudsjettet presenterer regjeringens forslag til statsbudsjett for allmennheten.",
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Statsbudsjettet.no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <head>
        {/* Forhåndslast Google Fonts med font-display: swap */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Hopp til hovedinnhold
        </a>
        {children}
      </body>
    </html>
  );
}
