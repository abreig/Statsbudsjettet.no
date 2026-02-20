/**
 * Admin-layout: ramme for alle /admin-sider.
 * Server Component som sjekker autentisering og viser admin-navigasjon.
 */

import Link from "next/link";
import { hentSesjon } from "@/lib/requireSession";
import "./admin.css";

export const metadata = {
  title: "Admin | Statsbudsjettet",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesjon = await hentSesjon();

  return (
    <div className="admin-layout">
      {sesjon && (
        <nav className="admin-nav" aria-label="Admin-navigasjon">
          <div className="admin-nav-brand">
            <Link href="/admin" className="admin-nav-logo">
              Statsbudsjettet CMS
            </Link>
          </div>
          <ul className="admin-nav-links">
            <li>
              <Link href="/admin/budsjettaar">Budsjettår</Link>
            </li>
            <li>
              <Link href="/admin/moduler">Moduler</Link>
            </li>
            <li>
              <Link href="/admin/temaer">Temaer</Link>
            </li>
            <li>
              <Link href="/admin/nokkeltall">Nøkkeltall</Link>
            </li>
            <li>
              <Link href="/admin/programomraader">Programområder</Link>
            </li>
            <li>
              <Link href="/admin/media">Media</Link>
            </li>
            {sesjon.rolle === "administrator" && (
              <li>
                <Link href="/admin/brukere">Brukere</Link>
              </li>
            )}
          </ul>
          <div className="admin-nav-user">
            <span className="admin-nav-name">{sesjon.navn}</span>
            <span className="admin-nav-rolle">{sesjon.rolle}</span>
            <Link href="/api/auth/signout" className="admin-nav-loggut">
              Logg ut
            </Link>
          </div>
        </nav>
      )}
      <main className="admin-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
