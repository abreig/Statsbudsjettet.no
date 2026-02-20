/**
 * Innloggingsside for admin-panelet.
 * Viser «Logg inn med departementskonto»-knapp (Azure AD)
 * eller utviklingsmodus-innlogging.
 */

"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function InnloggingInnhold() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const feil = searchParams.get("error");
  const [epost, setEpost] = useState("admin@dev.local");
  const [laster, setLaster] = useState(false);

  const erUtvikling = process.env.NODE_ENV === "development";

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
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--reg-marine, #181C62)",
            margin: "0 0 0.5rem",
          }}
        >
          Statsbudsjettet CMS
        </h1>
        <p style={{ color: "#666", margin: "0 0 2rem", fontSize: "0.875rem" }}>
          Logg inn for å administrere innhold
        </p>

        {feil && (
          <div className="admin-melding admin-melding-feil">
            {feil === "AccessDenied"
              ? "Kontoen din er ikke aktiv. Kontakt administrator."
              : "Innlogging feilet. Prøv igjen."}
          </div>
        )}

        {/* Azure AD-innlogging (produksjon) */}
        <button
          className="admin-btn admin-btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
          onClick={() => {
            setLaster(true);
            signIn("azure-ad", { callbackUrl });
          }}
          disabled={laster}
        >
          {laster ? "Logger inn..." : "Logg inn med departementskonto"}
        </button>

        {/* Utviklingsmodus */}
        {erUtvikling && (
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #eee" }}>
            <p style={{ fontSize: "0.75rem", color: "#999", margin: "0 0 0.75rem" }}>
              Utviklingsmodus
            </p>
            <div className="admin-form-group">
              <label htmlFor="dev-epost">E-post</label>
              <input
                id="dev-epost"
                type="email"
                className="admin-input"
                value={epost}
                onChange={(e) => setEpost(e.target.value)}
              />
            </div>
            <button
              className="admin-btn admin-btn-secondary"
              style={{ width: "100%" }}
              onClick={() => {
                setLaster(true);
                signIn("credentials", { epost, callbackUrl });
              }}
              disabled={laster}
            >
              Logg inn som utvikler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InnloggingSide() {
  return (
    <Suspense fallback={<div>Laster...</div>}>
      <InnloggingInnhold />
    </Suspense>
  );
}
