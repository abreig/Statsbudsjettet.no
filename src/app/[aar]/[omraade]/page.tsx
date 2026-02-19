interface OmraadeSideProps {
  params: Promise<{ aar: string; omraade: string }>;
}

export default async function OmraadeSide({ params }: OmraadeSideProps) {
  const { aar, omraade } = await params;

  return (
    <main>
      <h1>
        {omraade} &ndash; Statsbudsjettet {aar}
      </h1>
      <p>Drill-down-visning for programområdet.</p>
    </main>
  );
}
