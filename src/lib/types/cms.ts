/**
 * TypeScript-typer for CMS-datamodellen.
 * Disse typene speiler Prisma-modellene men er uavhengige av Prisma-klienten,
 * slik at de kan brukes i både server- og klient-kode.
 */

// ---------------------------------------------------------------------------
// Roller og status
// ---------------------------------------------------------------------------

export type Rolle = "administrator" | "redaktor" | "godkjenner" | "leser";

export type BudsjettaarStatus =
  | "kladd"
  | "til_godkjenning"
  | "godkjent"
  | "publisert";

export type ModulType =
  | "hero"
  | "plan_for_norge"
  | "budsjettgrafer"
  | "nokkeltall"
  | "egendefinert_tekst";

export type Endringsindikator = "opp" | "ned" | "noytral";

export type RevHandling = "opprett" | "endre" | "slett" | "statusendring";

// ---------------------------------------------------------------------------
// TipTap JSON-struktur
// ---------------------------------------------------------------------------

export interface TipTapJSON {
  type: "doc";
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Grafkonfigurasjon (for programområde-sider)
// ---------------------------------------------------------------------------

export interface GrafKonfigurasjon {
  type: "linjegraf" | "barplot" | "nokkeltall";
  tittel: string;
  datareferanse?: string;
  manuellData?: { etikett: string; verdi: number }[];
}

// ---------------------------------------------------------------------------
// Budsjettlenke (kobling mellom tema og programområde)
// ---------------------------------------------------------------------------

export interface BudsjettLenke {
  omrNr: number;
  visningsnavn: string;
  datareferanse: string;
}

// ---------------------------------------------------------------------------
// Prioritering (del av tema)
// ---------------------------------------------------------------------------

export interface Prioritering {
  tittel: string;
  beskrivelse: string | TipTapJSON;
}

// ---------------------------------------------------------------------------
// Analysegraf (del av tema)
// ---------------------------------------------------------------------------

export interface AnalysegrafKonfigurasjon {
  type: "linjegraf" | "barplot" | "nokkeltall";
  data: { etikett: string; verdi: number }[];
}

// ---------------------------------------------------------------------------
// Databasemodell-typer (speiler Prisma men er frittstående)
// ---------------------------------------------------------------------------

export interface CMSBruker {
  id: number;
  epost: string;
  navn: string;
  entraId: string | null;
  rolle: Rolle;
  aktiv: boolean;
}

export interface CMSBudsjettaar {
  id: number;
  aarstall: number;
  status: BudsjettaarStatus;
  publiseringTid: Date | null;
  opprettetAvId: number | null;
  opprettetTid: Date;
  sistEndret: Date;
}

export interface CMSModul {
  id: number;
  budsjettaarId: number;
  type: ModulType;
  rekkefoelge: number;
  synlig: boolean;
  konfigurasjon: Record<string, unknown>;
}

export interface CMSTema {
  id: number;
  budsjettaarId: number;
  rekkefoelge: number;
  tittel: string;
  ingress: string | null;
  farge: string | null;
  ikonUrl: string | null;
  problembeskrivelse: TipTapJSON | null;
  analysegraf: AnalysegrafKonfigurasjon | null;
  prioriteringer: Prioritering[] | null;
  sitatTekst: string | null;
  sitatPerson: string | null;
  sitatTittel: string | null;
  sitatBildeUrl: string | null;
  budsjettlenker: BudsjettLenke[] | null;
}

export interface CMSNokkeltall {
  id: number;
  budsjettaarId: number;
  etikett: string;
  verdi: string;
  enhet: string | null;
  endringsindikator: Endringsindikator | null;
  datareferanse: string | null;
}

export interface CMSProgramomraadeInnhold {
  id: number;
  budsjettaarId: number;
  omrNr: number;
  ingress: string | null;
  brodtekst: TipTapJSON | null;
  grafer: GrafKonfigurasjon[] | null;
  nokkeltallIds: number[];
  sistEndretAvId: number | null;
  sistEndret: Date;
}

export interface CMSMedia {
  id: number;
  budsjettaarId: number | null;
  filnavn: string;
  lagringsbane: string;
  mimeType: string;
  stoerrelseBytes: number | null;
  altTekst: string | null;
  lastetOppAvId: number | null;
  lastetOppTid: Date;
}

export interface CMSRevisjon {
  id: number;
  tabell: string;
  radId: number;
  handling: RevHandling;
  snapshotJson: Record<string, unknown>;
  endretAvId: number | null;
  endretTid: Date;
}

// ---------------------------------------------------------------------------
// Modulkonfigurasjon-typer (spesifikk for hver modultype)
// ---------------------------------------------------------------------------

export interface HeroKonfigurasjon {
  aar?: number;
  tittel: string;
  undertittel?: string;
  nokkeltallIds?: number[];
  bakgrunnsbilDeUrl?: string;
}

export interface PlanForNorgeKonfigurasjon {
  overskrift?: string;
  temaIder?: number[];
}

export interface BudsjettgraferKonfigurasjon {
  visEndringDefault?: boolean;
  overskrift?: string;
  forklaringstekst?: string;
  spuForklaring?: string;
}

export interface NokkeltallKonfigurasjon {
  tittel?: string;
  nokkeltallIds?: number[];
  layout?: "rad" | "liste" | "rutenett";
}

export interface EgendefinertTekstKonfigurasjon {
  tittel?: string;
  innhold?: TipTapJSON;
  bakgrunnsfarge?: string;
  bredde?: "smal" | "bred" | "fullbredde";
}

// ---------------------------------------------------------------------------
// Hjelpetype: ProgramområdeSide (kombinert data + redaksjon)
// ---------------------------------------------------------------------------

export interface ProgramomraadeSide {
  // Fra datapipelinen (JSON)
  omrNr: number;
  omrNavn: string;
  totalBelop: number;
  endringFraSaldert: number;
  kategorier: unknown[]; // Programkategori fra budget.ts

  // Fra programomraade_innhold i Postgres (valgfritt)
  redaksjon?: {
    ingress: string | null;
    brodtekst: TipTapJSON | null;
    grafer: GrafKonfigurasjon[];
    nokkeltall: CMSNokkeltall[];
  };
}
