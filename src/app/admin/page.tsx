/**
 * Admin-dashbord (/admin).
 * Viser oversikt over budsjettår og hurtiglenker.
 */

import Link from "next/link";
import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  await requireSession(["administrator", "redaktor", "godkjenner", "leser"]);

  const budsjettaar = await prisma.budsjettaar.findMany({
    orderBy: { aarstall: "desc" },
    include: {
      _count: {
        select: {
          moduler: true,
          temaer: true,
          nokkeltall: true,
        },
      },
    },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Dashbord</h1>
        <p>Velkommen til admin-panelet for statsbudsjettet.no</p>
      </div>

      <div className="admin-grid admin-grid-3">
        <Link href="/admin/budsjettaar" className="admin-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Budsjettår</h2>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "var(--reg-marine, #181C62)" }}>
            {budsjettaar.length}
          </p>
        </Link>

        <div className="admin-card">
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Siste aktivitet</h2>
          {budsjettaar.length > 0 ? (
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              {budsjettaar[0].aarstall} — <span className={`status-badge status-${budsjettaar[0].status}`}>{budsjettaar[0].status}</span>
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Ingen budsjettår opprettet</p>
          )}
        </div>

        <div className="admin-card">
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Hurtiglenker</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.875rem" }}>
            <li style={{ marginBottom: "0.25rem" }}>
              <Link href="/admin/budsjettaar">Administrer budsjettår</Link>
            </li>
            <li style={{ marginBottom: "0.25rem" }}>
              <Link href="/admin/media">Mediebibliotek</Link>
            </li>
          </ul>
        </div>
      </div>

      {budsjettaar.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Alle budsjettår</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Årstall</th>
                <th>Status</th>
                <th>Moduler</th>
                <th>Temaer</th>
                <th>Nøkkeltall</th>
                <th>Sist endret</th>
                <th>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {budsjettaar.map((aar: (typeof budsjettaar)[number]) => (
                <tr key={aar.id}>
                  <td><strong>{aar.aarstall}</strong></td>
                  <td>
                    <span className={`status-badge status-${aar.status}`}>
                      {aar.status}
                    </span>
                  </td>
                  <td>{aar._count.moduler}</td>
                  <td>{aar._count.temaer}</td>
                  <td>{aar._count.nokkeltall}</td>
                  <td>{aar.sistEndret.toLocaleDateString("nb-NO")}</td>
                  <td>
                    <div className="admin-actions">
                      <Link
                        href={`/admin/moduler/${aar.aarstall}`}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Rediger
                      </Link>
                      <Link
                        href={`/admin/publisering/${aar.aarstall}`}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Publisering
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
