/* ==========================================================================
   TypeScript-typer for budsjettdatamodellen.
   Speiler den hierarkiske 6-nivå-strukturen fra DATA.md.
   ========================================================================== */

// ---------------------------------------------------------------------------
// Nivå 6: Post (laveste nivå)
// ---------------------------------------------------------------------------

export type Postgruppe =
  | "driftsutgifter"
  | "investeringer"
  | "overforinger_statsregnskaper"
  | "overforinger_private"
  | "utlaan_statsgjeld";

export interface EndringsData {
  belop: number;
  saldert_forrige: number;
  endring_absolut: number | null;
  endring_prosent: number | null;
}

export interface Post {
  post_nr: number;
  upost_nr: number;
  navn: string;
  belop: number;
  postgruppe: Postgruppe;
  stikkord: string[];
  endring_fra_saldert: EndringsData | null;
}

// ---------------------------------------------------------------------------
// Nivå 5: Kapittel
// ---------------------------------------------------------------------------

export interface Kapittel {
  kap_nr: number;
  navn: string;
  total: number;
  poster: Post[];
  endring_fra_saldert: EndringsData | null;
}

// ---------------------------------------------------------------------------
// Nivå 4: Programkategori
// ---------------------------------------------------------------------------

export interface Programkategori {
  kat_nr: number;
  navn: string;
  total: number;
  kapitler: Kapittel[];
  endring_fra_saldert: EndringsData | null;
}

// ---------------------------------------------------------------------------
// Nivå 3: Programområde
// ---------------------------------------------------------------------------

export interface Programomraade {
  omr_nr: number;
  navn: string;
  total: number;
  kategorier: Programkategori[];
  endring_fra_saldert: EndringsData | null;
}

// ---------------------------------------------------------------------------
// Nivå 2: Budsjettside (utgifter/inntekter)
// ---------------------------------------------------------------------------

export interface BudgetSide {
  total: number;
  omraader: Programomraade[];
  endring_fra_saldert: EndringsData | null;
}

// ---------------------------------------------------------------------------
// SPU (Statens pensjonsfond utland)
// ---------------------------------------------------------------------------

export interface KontantstromKilde {
  id: string;
  navn: string;
  belop: number;
}

export interface SPUData {
  overfoering_til_fond: number;
  finansposter_til_fond: number;
  overfoering_fra_fond: number;
  netto_overfoering: number;
  fondsuttak: number;
  netto_kontantstrom: number;
  netto_overfoering_til_spu: number;
  kontantstrom_kilder: KontantstromKilde[];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export interface BudgetMetadata {
  kilde: string;
  saldert_budsjett_forrige: string;
}

// ---------------------------------------------------------------------------
// Oljekorrigerte totaler — «uten olje og gass» (post < 90, ekskl. petroleumskapitler).
// Se OLJEKORRIGERT.md for fullstendig begrunnelse.
// ---------------------------------------------------------------------------

export interface OljekorrigertTotaler {
  utgifter_total: number;
  inntekter_total: number;
  /** Strukturelt oljekorrigert underskudd (manuelt innlagt, fra Nasjonalbudsjettet) */
  strukturelt_underskudd?: number;
  /** Uttaksprosent fra SPU iht. handlingsregelen (manuelt innlagt) */
  uttaksprosent?: number;
}

// ---------------------------------------------------------------------------
// Nivå 1: Budsjettår (toppnivå)
// ---------------------------------------------------------------------------

export interface BudgetYear {
  budsjettaar: number;
  publisert: string;
  valuta: "NOK";
  utgifter: BudgetSide;
  inntekter: BudgetSide;
  spu: SPUData;
  oljekorrigert: OljekorrigertTotaler;
  metadata: BudgetMetadata;
}

// ---------------------------------------------------------------------------
// Aggregert visning (for stacked barplots på landingssiden)
// ---------------------------------------------------------------------------

export interface AggregertKategori {
  id: string;
  navn: string;
  belop: number;
  farge: string;
  omr_nr?: number;
  omr_gruppe?: number[];
  saldert_belop?: number | null;
  endring_absolut?: number | null;
  endring_prosent?: number | null;
}

export interface AggregertBudsjett {
  budsjettaar: number;
  total_utgifter: number;
  total_inntekter: number;
  utgifter_aggregert: AggregertKategori[];
  inntekter_aggregert: AggregertKategori[];
  spu: SPUData;
}

// ---------------------------------------------------------------------------
// Hierarkisk navigasjon (for drill-down)
// ---------------------------------------------------------------------------

export interface HierarkiNode {
  nivaa: 1 | 2 | 3 | 4 | 5;
  id: number;
  navn: string;
}

// ---------------------------------------------------------------------------
// Postgruppe-fordeling
// ---------------------------------------------------------------------------

export interface PostgruppeFordeling {
  postgruppe: Postgruppe;
  navn: string;
  belop: number;
  andel: number;
}

// ---------------------------------------------------------------------------
// Modultyper for CMS-konfigurert landingsside
// ---------------------------------------------------------------------------

export type ModulType =
  | "hero"
  | "plan_for_norge"
  | "nasjonalbudsjettet"
  | "budsjettgrafer"
  | "nokkeltall"
  | "egendefinert_tekst";

export interface ModulKonfigurasjon {
  type: ModulType;
  synlig: boolean;
  rekkefolge: number;
  konfigurasjon: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Komponent-props (fra DESIGN.md)
// ---------------------------------------------------------------------------

export interface StackedBarChartProps {
  utgifter: AggregertKategori[];
  inntekter: AggregertKategori[];
  spu: SPUData;
  visEndring: boolean;
  onSegmentClick: (side: "utgift" | "inntekt", id: string) => void;
  aar: number;
}

export interface SPUBridgeProps {
  fraPosition: { x: number; y: number; height: number };
  tilPosition: { x: number; y: number; height: number };
  belop: number;
  nettoOverfoering: number;
}

export interface DrillDownPanelProps {
  data: Programomraade | Programkategori | Kapittel | Post;
  hierarkiSti: HierarkiNode[];
  onNavigate: (node: HierarkiNode) => void;
  onClose: () => void;
  visEndring: boolean;
}

export interface BudgetTableProps {
  poster: Post[];
  visEndring: boolean;
  sortering: "belop" | "postnr" | "endring";
  sorteringsretning: "asc" | "desc";
  onSorteringsEndring: (felt: string) => void;
}

export interface NumberFormatProps {
  belop: number;
  precision?: number;
  visValuta?: boolean;
  somEndring?: boolean;
}

export interface ChangeIndicatorProps {
  endring_absolut: number | null;
  endring_prosent: number | null;
  er_ny_post?: boolean;
  side?: "utgift" | "inntekt";
  compact?: boolean;
}

export interface ComparisonToggleProps {
  aktiv: boolean;
  onToggle: (aktiv: boolean) => void;
}

// ---------------------------------------------------------------------------
// Plan for Norge — tema og detaljvisning
// ---------------------------------------------------------------------------

export interface Prioritering {
  tittel: string;
  beskrivelse: string;
}

export interface Sitat {
  tekst: string;
  person: string;
  tittel: string;
  bildeSrc?: string;
}

export interface BudsjettLenke {
  omrNr: number;
  navn: string;
  belop: number;
}

export interface AnalysisChartData {
  type: "linjegraf" | "barplot" | "nokkeltall";
  data: { etikett: string; verdi: number }[];
}

export interface ThemeCardProps {
  tema: {
    nr: number;
    tittel: string;
    ingress: string;
    farge: string;
    ikon: string;
  };
  onExpand: (nr: number) => void;
  erAktiv: boolean;
}

export interface ThemeDetailProps {
  tema: {
    nr: number;
    tittel: string;
    ingress: string;
    farge: string;
    problembeskrivelse: string;
    analysegraf?: AnalysisChartData;
    prioriteringer: Prioritering[];
    sitat?: Sitat;
    budsjettlenker: BudsjettLenke[];
  };
  onClose: () => void;
  onBudsjettNavigasjon: (omrNr: number) => void;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export interface HeroNokkeltall {
  etikett: string;
  verdi: string;
  datareferanse?: string;
  endring?: EndringsData;
}

export interface HeroKonfigurasjon {
  aar: number;
  tittel: string;
  undertittel?: string;
  nokkeltall: HeroNokkeltall[];
  bakgrunnsbilde?: string;
}

// ---------------------------------------------------------------------------
// Endringsvisning — metadata fra gul_bok_endringer.json
// ---------------------------------------------------------------------------

export interface EndringsMetadata {
  budsjettaar: number;
  saldert_kilde: string | null;
  saldert_aar: number | null;
  har_endringsdata: boolean;
  endring_etikett: string | null;
  statistikk: {
    antall_poster_gb: number;
    antall_med_match: number;
    antall_nye_poster: number;
    matchrate_prosent: number;
    saldert_total_mrd: number;
    gb_total_mrd: number;
    endring_total_mrd: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Datareferanse
// ---------------------------------------------------------------------------

export type Datareferanse = string;
