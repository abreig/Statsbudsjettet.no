import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageContainer from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Historikk — Statsbudsjettet",
  description: "Oversikt over statsbudsjettene fra 2019 til i dag.",
};

interface AarData {
  aar: number;
  utgifter: number;
  inntekter: number;
  fondsuttak: number;
}

async function hentAlleAar(): Promise<AarData[]> {
  const dataDir = path.join(process.cwd(), "data");
  const mapper = await fs.readdir(dataDir);
  const aarMapper = mapper.filter((m) => /^\d{4}$/.test(m)).sort().reverse();

  const resultat: AarData[] = [];
  for (const aar of aarMapper) {
    try {
      const metadataFil = path.join(dataDir, aar, "metadata.json");
      const innhold = await fs.readFile(metadataFil, "utf-8");
      const meta = JSON.parse(innhold);
      resultat.push({
        aar: meta.budsjettaar,
        utgifter: meta.totaler.utgifter,
        inntekter: meta.totaler.inntekter,
        fondsuttak: meta.spu.fondsuttak,
      });
    } catch {
      // Ignorer år uten gyldig metadata
    }
  }

  return resultat;
}

function formaterMrd(belop: number): string {
  return (belop / 1e9).toLocaleString("nb-NO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default async function HistorikkSide() {
  const alleAar = await hentAlleAar();

  return (
    <>
      <Header />
      <main id="main-content">
        <PageContainer>
          <section style={{ padding: "var(--space-8) 0" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "var(--tekst-3xl)",
                fontWeight: "var(--vekt-bold)",
                color: "var(--reg-marine)",
                textAlign: "center",
                marginBottom: "var(--space-2)",
              }}
            >
              Historiske statsbudsjetter
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--tekst-base)",
                color: "var(--tekst-sekundaer)",
                textAlign: "center",
                maxWidth: "40rem",
                margin: "0 auto var(--space-8)",
                lineHeight: "var(--linjehoyde-normal)",
              }}
            >
              Utforsk regjeringens statsbudsjetter fra {alleAar.at(-1)?.aar ?? 2019} til {alleAar[0]?.aar ?? 2025}.
              Klikk på et år for å se detaljene.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              {alleAar.map((data) => (
                <Link
                  key={data.aar}
                  href={`/${data.aar}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    border: "1px solid var(--reg-lysgraa)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-5)",
                    backgroundColor: "var(--bg-hvit)",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "var(--tekst-2xl)",
                      fontWeight: "var(--vekt-bold)",
                      color: "var(--reg-marine)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {data.aar}
                  </div>
                  <dl style={{ margin: 0, fontFamily: "var(--font-sans)" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "var(--space-1) 0",
                        borderBottom: "1px solid var(--reg-lysgraa)",
                      }}
                    >
                      <dt style={{ fontSize: "var(--tekst-sm)", color: "var(--tekst-sekundaer)" }}>
                        Utgifter
                      </dt>
                      <dd
                        style={{
                          fontFamily: "var(--font-tall)",
                          fontSize: "var(--tekst-sm)",
                          margin: 0,
                        }}
                      >
                        {formaterMrd(data.utgifter)} mrd. kr
                      </dd>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "var(--space-1) 0",
                        borderBottom: "1px solid var(--reg-lysgraa)",
                      }}
                    >
                      <dt style={{ fontSize: "var(--tekst-sm)", color: "var(--tekst-sekundaer)" }}>
                        Inntekter
                      </dt>
                      <dd
                        style={{
                          fontFamily: "var(--font-tall)",
                          fontSize: "var(--tekst-sm)",
                          margin: 0,
                        }}
                      >
                        {formaterMrd(data.inntekter)} mrd. kr
                      </dd>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "var(--space-1) 0",
                      }}
                    >
                      <dt style={{ fontSize: "var(--tekst-sm)", color: "var(--tekst-sekundaer)" }}>
                        Overf. fra SPU
                      </dt>
                      <dd
                        style={{
                          fontFamily: "var(--font-tall)",
                          fontSize: "var(--tekst-sm)",
                          margin: 0,
                        }}
                      >
                        {formaterMrd(data.fondsuttak)} mrd. kr
                      </dd>
                    </div>
                  </dl>
                  <div
                    style={{
                      marginTop: "var(--space-3)",
                      fontSize: "var(--tekst-sm)",
                      color: "var(--reg-blaa)",
                      fontWeight: "var(--vekt-medium)",
                    }}
                  >
                    Se budsjett &rarr;
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </PageContainer>
      </main>
      <Footer />
    </>
  );
}
