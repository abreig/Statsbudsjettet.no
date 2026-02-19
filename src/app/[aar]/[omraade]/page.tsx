import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import type { BudgetYear } from "@/components/data/types/budget";

interface OmraadeSideProps {
  params: Promise<{ aar: string; omraade: string }>;
}

export async function generateStaticParams() {
  // Generer sider for alle programområder i hvert år
  const dataDir = path.join(process.cwd(), "data");
  const resultater: { aar: string; omraade: string }[] = [];

  try {
    const aarMapper = await fs.readdir(dataDir);
    for (const aar of aarMapper.filter((m) => /^\d{4}$/.test(m))) {
      try {
        const filsti = path.join(dataDir, aar, "gul_bok_full.json");
        const innhold = await fs.readFile(filsti, "utf-8");
        const data = JSON.parse(innhold) as BudgetYear;

        for (const omr of data.utgifter.omraader) {
          const slug = omr.navn
            .toLowerCase()
            .replace(/[æ]/g, "ae")
            .replace(/[ø]/g, "o")
            .replace(/[å]/g, "aa")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          resultater.push({ aar, omraade: slug });
        }
      } catch {
        // Ignorer år uten data
      }
    }
  } catch {
    // Ignorer
  }

  return resultater;
}

export async function generateMetadata({ params }: OmraadeSideProps): Promise<Metadata> {
  const { aar, omraade } = await params;
  const tittel = omraade
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${tittel} - Statsbudsjettet ${aar}`,
    description: `Detaljer for programområdet ${tittel} i statsbudsjettet ${aar}.`,
  };
}

export default async function OmraadeSide({ params }: OmraadeSideProps) {
  const { aar, omraade } = await params;

  const tittel = omraade
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main id="main-content">
      <h1>
        {tittel} &ndash; Statsbudsjettet {aar}
      </h1>
      <p>Drill-down-visning for programområdet.</p>
    </main>
  );
}
