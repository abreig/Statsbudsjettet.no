import { promises as fs } from "fs";
import path from "path";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageContainer from "@/components/layout/PageContainer";
import BudsjettSeksjon from "@/components/budget/BudsjettSeksjon";
import type { AggregertBudsjett } from "@/components/data/types/budget";

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

export default async function BudsjettaarSide({ params }: BudsjettaarSideProps) {
  const { aar } = await params;
  const aarNum = parseInt(aar, 10);
  const data = await hentAggregertData(aar);

  return (
    <>
      <Header aar={aarNum} />
      <main>
        <PageContainer>
          <section id="hero" style={{ padding: "var(--space-10) 0" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "var(--tekst-5xl)",
                color: "var(--reg-marine)",
                marginBottom: "var(--space-2)",
              }}
            >
              Statsbudsjettet {aar}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "var(--tekst-xl)",
                color: "var(--tekst-sekundaer)",
              }}
            >
              Regjeringens forslag til statsbudsjett
            </p>
          </section>

          {data && (
            <BudsjettSeksjon data={data} aar={aarNum} />
          )}
        </PageContainer>
      </main>
      <Footer />
    </>
  );
}
