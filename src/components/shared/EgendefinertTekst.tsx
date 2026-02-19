import styles from "./EgendefinertTekst.module.css";

interface EgendefinertTekstProps {
  konfigurasjon: Record<string, unknown>;
}

/**
 * Egendefinert tekst-modul.
 * Rendrer rik tekst fra CMS med konfigurerbar bredde og bakgrunnsfarge.
 */
export default function EgendefinertTekst({ konfigurasjon }: EgendefinertTekstProps) {
  const innhold = konfigurasjon.innhold as string | undefined;
  const overskrift = konfigurasjon.overskrift as string | undefined;
  const bakgrunnsfarge = konfigurasjon.bakgrunnsfarge as string | undefined;
  const bredde = (konfigurasjon.bredde as string) ?? "normal";

  if (!innhold && !overskrift) return null;

  const breddeKlasse =
    bredde === "smal"
      ? styles.breddeSmal
      : bredde === "bred"
        ? styles.breddeBred
        : styles.breddeNormal;

  return (
    <section
      className={`${styles.seksjon} ${breddeKlasse}`}
      style={bakgrunnsfarge ? { backgroundColor: bakgrunnsfarge } : undefined}
    >
      {overskrift && <h2 className={styles.overskrift}>{overskrift}</h2>}
      {innhold && (
        <div
          className={styles.innhold}
          dangerouslySetInnerHTML={{ __html: innhold }}
        />
      )}
    </section>
  );
}
