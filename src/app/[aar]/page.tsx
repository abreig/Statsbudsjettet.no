import { promises as fs } from "fs";
import path from "path";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageContainer from "@/components/layout/PageContainer";
import ModulRendrer from "@/components/shared/ModulRendrer";
import { hentMockCMSData } from "@/lib/mock-cms";
import type { AggregertBudsjett, BudgetYear } from "@/components/data/types/budget";

interface BudsjettaarSideProps {
  params: Promise<{ aar: string }>;
}

async function hentAggregertData(aar: string): Promise<AggregertBudsjett | null> {
  try {
    const filsti = path.join(process.cwd(), "data", aar, "gul_bok_aggregert.json");
    const innhold = await fs.readFile(filsti, "utf-8");
    return JSON.parse(innhold) as AggregertBudsjett;
  } catch {
    return null;
  }
}

async function hentFullData(aar: string): Promise<BudgetYear | null> {
  try {
    const filsti = path.join(process.cwd(), "data", aar, "gul_bok_full.json");
    const innhold = await fs.readFile(filsti, "utf-8");
    return JSON.parse(innhold) as BudgetYear;
  } catch {
    return null;
  }
}

export default async function BudsjettaarSide({ params }: BudsjettaarSideProps) {
  const { aar } = await params;
  const aarNum = parseInt(aar, 10);

  const [aggregertData, fullData] = await Promise.all([
    hentAggregertData(aar),
    hentFullData(aar),
  ]);

  const cmsData = hentMockCMSData(aarNum);

  return (
    <>
      <Header aar={aarNum} />
      <main>
        <PageContainer>
          {cmsData ? (
            <ModulRendrer
              moduler={cmsData.moduler}
              aar={aarNum}
              aggregertData={aggregertData}
              fullData={fullData}
              temaer={cmsData.temaer}
            />
          ) : (
            <section style={{ padding: "var(--space-10) 0", textAlign: "center" }}>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "var(--tekst-3xl)",
                  color: "var(--reg-marine)",
                }}
              >
                Statsbudsjettet {aar}
              </h1>
              <p style={{ color: "var(--tekst-sekundaer)", marginTop: "var(--space-2)" }}>
                Innhold for dette budsjettåret er ikke tilgjengelig ennå.
              </p>
            </section>
          )}
        </PageContainer>
      </main>
      <Footer />
    </>
  );
}
