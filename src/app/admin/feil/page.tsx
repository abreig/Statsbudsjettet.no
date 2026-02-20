/**
 * Feilside for autentisering (/admin/feil).
 */

import Link from "next/link";

export default function AuthFeilSide() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-sand, #F7F4EF)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "3rem",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#dc3545",
            margin: "0 0 1rem",
          }}
        >
          Ingen tilgang
        </h1>
        <p style={{ color: "#666", margin: "0 0 2rem" }}>
          Du har ikke tilstrekkelige rettigheter til å se denne siden.
          Kontakt administrator dersom du mener dette er feil.
        </p>
        <Link href="/admin/logginn" className="admin-btn admin-btn-primary">
          Tilbake til innlogging
        </Link>
      </div>
    </div>
  );
}
