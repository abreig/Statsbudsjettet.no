/**
 * Typer for nasjonalbudsjettet-modulen.
 * Konfigurasjonen speiler CMS-skjemaet (NASJONALBUDSJETTET.md seksjon 7.2).
 */

export type NasjonalbudsjettetSeksjon =
  | { type: "tekst"; overskrift?: string; innhold: string }
  | {
      type: "highcharts";
      tittel: string;
      kilde?: string;
      iframe_url?: string;
      config?: object;
      hoyde?: number;
    }
  | {
      type: "graf_placeholder";
      tittel: string;
      beskrivelse?: string;
      hoyde?: number;
    }
  | {
      type: "nokkeltall_rad";
      tall: { etikett: string; verdi: string; enhet?: string }[];
    };

export interface NasjonalbudsjettetNokkeltall {
  etikett: string;
  verdi: string;
  endring?: string;
  retning?: "opp" | "ned" | "noytral";
  positivt_er?: "opp" | "ned";
}

export interface NasjonalbudsjettetKonfigurasjon {
  tittel: string;
  ingress: string;
  pdf_lenke: string;
  vis_paa_landingsside: boolean;
  nokkeltall: NasjonalbudsjettetNokkeltall[];
  seksjoner: NasjonalbudsjettetSeksjon[];
}
