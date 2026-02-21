import type { NasjonalbudsjettetSeksjon } from "./types";
import GrafPlaceholder from "./GrafPlaceholder";
import HighchartsEmbed from "./HighchartsEmbed";
import styles from "./SeksjonsRenderer.module.css";

interface SeksjonsRendererProps {
  seksjoner: NasjonalbudsjettetSeksjon[];
}

export default function SeksjonsRenderer({ seksjoner }: SeksjonsRendererProps) {
  return (
    <div className={styles.seksjoner}>
      {seksjoner.map((seksjon, i) => {
        switch (seksjon.type) {
          case "tekst":
            return (
              <TekstSeksjon
                key={i}
                overskrift={seksjon.overskrift}
                innhold={seksjon.innhold}
              />
            );
          case "highcharts":
            return (
              <HighchartsEmbed
                key={i}
                tittel={seksjon.tittel}
                kilde={seksjon.kilde}
                iframe_url={seksjon.iframe_url}
                config={seksjon.config}
                hoyde={seksjon.hoyde}
              />
            );
          case "graf_placeholder":
            return (
              <GrafPlaceholder
                key={i}
                tittel={seksjon.tittel}
                beskrivelse={seksjon.beskrivelse}
                hoyde={seksjon.hoyde}
              />
            );
          case "nokkeltall_rad":
            return <NokkeltallRad key={i} tall={seksjon.tall} />;
        }
      })}
    </div>
  );
}

function TekstSeksjon({
  overskrift,
  innhold,
}: {
  overskrift?: string;
  innhold: string;
}) {
  return (
    <div className={styles.tekstSeksjon}>
      {overskrift && <h3 className={styles.tekstOverskrift}>{overskrift}</h3>}
      <div className={styles.tekstInnhold}>
        {innhold.split("\n\n").map((avsnitt, i) => (
          <p key={i}>{avsnitt}</p>
        ))}
      </div>
    </div>
  );
}

function NokkeltallRad({
  tall,
}: {
  tall: { etikett: string; verdi: string; enhet?: string }[];
}) {
  return (
    <div className={styles.nokkeltallRad}>
      {tall.map((t) => (
        <div key={t.etikett} className={styles.nokkeltallItem}>
          <div className={styles.nokkeltallVerdi}>{t.verdi}</div>
          <div className={styles.nokkeltallEtikett}>
            {t.etikett}
            {t.enhet && <span className={styles.nokkeltallEnhet}> {t.enhet}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
