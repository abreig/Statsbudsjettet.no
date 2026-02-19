interface BudsjettaarSideProps {
  params: Promise<{ aar: string }>;
}

export default async function BudsjettaarSide({ params }: BudsjettaarSideProps) {
  const { aar } = await params;

  return (
    <main>
      <h1>Statsbudsjettet {aar}</h1>
      <p>Landingsside for budsjettåret {aar}.</p>
    </main>
  );
}
